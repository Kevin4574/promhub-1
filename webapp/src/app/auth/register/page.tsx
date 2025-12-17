"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { buildRelayQuery, completeMockAuthFlow } from "../../../lib/webauthflow"

const FALLBACK_EMAIL = "user@example.com"
const FALLBACK_PASSWORD = "prompt123"
const FALLBACK_NICKNAME = "new-user"
const FALLBACK_CODE = "123456"

type RegisterMode = "password" | "code"

export default function AuthRegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [mode, setMode] = useState<RegisterMode>("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [code, setCode] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordMismatch = useMemo(() => {
    if (mode !== "password") {
      return ""
    }
    if (!password && !confirmPassword) {
      return ""
    }
    if (password.trim().length < 6 || confirmPassword.trim().length < 6) {
      return "密码至少 6 位"
    }
    return password.trim() === confirmPassword.trim() ? "" : "两次输入的密码不一致"
  }, [password, confirmPassword, mode])

  const codeError = useMemo(() => {
    if (mode !== "code") {
      return ""
    }
    if (code.trim().length === 0) {
      return ""
    }
    return code.trim().length < 4 ? "请输入完整验证码" : ""
  }, [code, mode])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const trimmedEmail = email.trim() || FALLBACK_EMAIL
    const trimmedPassword = password.trim() || FALLBACK_PASSWORD
    const trimmedConfirmPassword = confirmPassword.trim() || FALLBACK_PASSWORD
    const trimmedCode = code.trim() || FALLBACK_CODE
    const trimmedNickname = FALLBACK_NICKNAME

    if (mode === "password") {
      if (trimmedPassword.length < 6) {
        setFormError("密码至少 6 位")
        return
      }
      if (trimmedPassword !== trimmedConfirmPassword) {
        setFormError("两次输入的密码不一致")
        return
      }
    }
    if (mode === "code" && codeError) {
      setFormError(codeError)
      return
    }

    setEmail(trimmedEmail)
    if (mode === "password") {
      setPassword(trimmedPassword)
      setConfirmPassword(trimmedPassword)
    } else {
      setCode(trimmedCode)
    }

    setIsSubmitting(true)
    try {
      const result = await completeMockAuthFlow({
        email: trimmedEmail,
        nickname: trimmedNickname,
        mode: "register",
        searchParams
      })
      if (result.bridged) {
        return
      }
    } catch (error) {
      console.error("[webapp] register failed", error)
      setFormError("注册失败，请稍后重试")
      setIsSubmitting(false)
      return
    }

    router.replace("/auth/login" + buildRelayQuery(searchParams))
  }

  const handleCloseWindow = () => {
    if (typeof window === "undefined") {
      router.replace("/")
      return
    }
    try {
      window.close()
    } catch (error) {
      console.debug("[auth] 无法关闭小窗", error)
      router.replace("/")
      return
    }
    window.setTimeout(() => {
      router.replace("/")
    }, 400)
  }

  return (
    <div className="pm-auth-card">
      <header className="pm-auth-card__header pm-auth-card__header--stack">
        <div className="pm-auth-brand">
          <div className="pm-auth-brand__mark">
            <RegisterIcon />
          </div>
          <div className="pm-auth-brand__text">
            <p className="pm-auth-brand__name">Prompt Manna</p>
            <p className="pm-auth-brand__tagline">Create your workspace</p>
          </div>
        </div>
        <div>
          <p className="pm-auth-heading">注册 Prompt Manna</p>
          <p className="pm-auth-desc">填写以下信息创建账号，完成后会同步到扩展。</p>
        </div>
      </header>
      <section className="pm-auth-body">
        {formError ? <div className="pm-form-error">{formError}</div> : null}
        <div className="pm-inline-switch" style={{ gap: 10 }}>
          <button
            type="button"
            className={`pm-tertiary-link${mode === "password" ? " active" : ""}`}
            onClick={() => {
              setMode("password")
              setCode("")
              setFormError(null)
            }}
          >
            密码注册
          </button>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <button
            type="button"
            className={`pm-tertiary-link${mode === "code" ? " active" : ""}`}
            onClick={() => {
              setMode("code")
              setPassword("")
              setConfirmPassword("")
              setFormError(null)
            }}
          >
            验证码注册
          </button>
        </div>
        <form className="pm-auth-form" onSubmit={handleSubmit}>
          <div className="pm-field">
            <label htmlFor="auth-register-email">邮箱地址</label>
            <input
              id="auth-register-email"
              type="email"
              className="pm-input"
              placeholder="your@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>
          {mode === "password" ? (
            <>
              <div className="pm-field">
                <label htmlFor="auth-register-password">密码</label>
                <input
                  id="auth-register-password"
                  type="password"
                  className="pm-input"
                  placeholder="至少 6 位"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="pm-field">
                <label htmlFor="auth-register-confirm">确认密码</label>
                <input
                  id="auth-register-confirm"
                  type="password"
                  className="pm-input"
                  placeholder="再次输入密码"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {passwordMismatch ? <p className="pm-helper-text">{passwordMismatch}</p> : null}
            </>
          ) : (
            <div className="pm-field">
              <label htmlFor="auth-register-code">邮箱验证码</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  id="auth-register-code"
                  type="text"
                  className={`pm-input${codeError ? " pm-input--error" : ""}`}
                  placeholder="输入验证码"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  autoComplete="one-time-code"
                  style={{ flex: 1 }}
                />
                <button type="button" className="pm-primary-btn" style={{ minWidth: 96 }} disabled>
                  发送验证码
                </button>
              </div>
              {codeError ? <p className="pm-helper-text">{codeError}</p> : null}
            </div>
          )}
          <button type="submit" className="pm-primary-btn" disabled={isSubmitting}>
            {isSubmitting ? "注册中..." : "立即注册"}
          </button>
        </form>
        <div className="pm-assist-area">
          <p>
            注册即表示您同意我们的 <span>服务条款</span> 和 <span>隐私政策</span>
          </p>
          <div className="pm-inline-switch">
            <span>已有账号？</span>
            <button type="button" onClick={() => router.push("/auth/login" + buildRelayQuery(searchParams))}>
              去登录
            </button>
          </div>
        </div>
      </section>
      <footer className="pm-auth-footer">
        <button type="button" className="pm-tertiary-link" onClick={handleCloseWindow}>
          关闭窗口
        </button>
      </footer>
    </div>
  )
}
function RegisterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 24, height: 24 }}>
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10z" />
      <path d="M21 21a8.38 8.38 0 00-9-8 8.38 8.38 0 00-9 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 11l5 5" strokeLinecap="round" />
      <path d="M21 11l-5 5" strokeLinecap="round" />
    </svg>
  )
}

