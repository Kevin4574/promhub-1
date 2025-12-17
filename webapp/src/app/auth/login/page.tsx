"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { buildRelayQuery, completeMockAuthFlow } from "../../../lib/webauthflow"

const FALLBACK_EMAIL = "user@example.com"
const FALLBACK_PASSWORD = "prompt123"
const FALLBACK_CODE = "123456"

function isValidEmail(value: string): boolean {
  return value.includes("@")
}

function isValidPassword(value: string): boolean {
  return value.trim().length >= 6
}

type LoginMode = "password" | "code"

export default function AuthLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [mode, setMode] = useState<LoginMode>("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const emailError = useMemo(() => {
    if (email.trim().length === 0) {
      return ""
    }
    return isValidEmail(email.trim()) ? "" : "请输入有效的邮箱地址"
  }, [email])

  const passwordError = useMemo(() => {
    if (password.trim().length === 0) {
      return ""
    }
    return isValidPassword(password.trim()) ? "" : "密码至少 6 位"
  }, [password])

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

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    const trimmedCode = code.trim()
    const finalEmail = isValidEmail(trimmedEmail) ? trimmedEmail : FALLBACK_EMAIL
    const finalPassword = isValidPassword(trimmedPassword) ? trimmedPassword : FALLBACK_PASSWORD
    const finalCode = trimmedCode.length > 0 ? trimmedCode : FALLBACK_CODE

    if (mode === "password" && passwordError) {
      setFormError(passwordError)
      return
    }

    if (mode === "code" && codeError) {
      setFormError(codeError)
      return
    }

    setEmail(finalEmail)
    if (mode === "password") {
      setPassword(finalPassword)
    } else {
      setCode(finalCode)
    }

    setIsSubmitting(true)
    try {
      const result = await completeMockAuthFlow({
        email: finalEmail,
        mode: "login",
        searchParams
      })
      if (result.bridged) {
        return
      }
    } catch (error) {
      console.error("[webapp] login failed", error)
      setFormError("登录失败，请稍后重试")
      setIsSubmitting(false)
      return
    }

    // 如果已经跳转到 redirect_uri，这里的代码不会再执行；
    // 若缺少 redirect 参数，则回退到首页。
    router.replace("/")
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
            <LoginMagicIcon />
          </div>
          <div className="pm-auth-brand__text">
            <p className="pm-auth-brand__name">Prompt Manna</p>
            <p className="pm-auth-brand__tagline">Personal AI Workspace</p>
          </div>
        </div>
        <div>
          <p className="pm-auth-heading">登录 Prompt Manna</p>
          <p className="pm-auth-desc">输入账号完成登录，小窗会在成功后自动关闭并同步扩展。</p>
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
            密码登录
          </button>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <button
            type="button"
            className={`pm-tertiary-link${mode === "code" ? " active" : ""}`}
            onClick={() => {
              setMode("code")
              setPassword("")
              setFormError(null)
            }}
          >
            验证码登录
          </button>
        </div>
        <form className="pm-auth-form" onSubmit={handleSubmit}>
          <div className="pm-field">
            <label htmlFor="auth-login-email">邮箱地址</label>
            <input
              id="auth-login-email"
              type="email"
              className={`pm-input${emailError ? " pm-input--error" : ""}`}
              placeholder="your@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
            {emailError ? <p className="pm-helper-text">{emailError}</p> : null}
          </div>
          {mode === "password" ? (
            <div className="pm-field">
              <label htmlFor="auth-login-password">密码</label>
              <input
                id="auth-login-password"
                type="password"
                className={`pm-input${passwordError ? " pm-input--error" : ""}`}
                placeholder="输入密码"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
              {passwordError ? <p className="pm-helper-text">{passwordError}</p> : null}
            </div>
          ) : (
            <div className="pm-field">
              <label htmlFor="auth-login-code">邮箱验证码</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  id="auth-login-code"
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
              <p className="pm-helper-text" style={{ color: "#94a3b8" }}>
                忘记密码可直接用验证码登录
              </p>
            </div>
          )}
          <button type="submit" className="pm-primary-btn" disabled={isSubmitting}>
            {isSubmitting ? "登录中..." : "立即登录"}
          </button>
        </form>
        <div className="pm-assist-area">
          <p>
            登录即表示您同意我们的 <span>服务条款</span> 和 <span>隐私政策</span>
          </p>
          <div className="pm-inline-switch">
            <span>还没有账号？</span>
            <button type="button" onClick={() => router.push("/auth/register" + buildRelayQuery(searchParams))}>
              立即注册
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

function LoginMagicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}>
      <path d="M9 18l6-12" strokeLinecap="round" />
      <path d="M5 9l3-.5L9 5l.5 3L13 9l-3 .5L9 13l-.5-3L5 9z" strokeLinecap="round" />
      <path d="M15 5l1-.3L16.3 4l.3 1 1 .3-1 .3-.3 1-.3-1-1-.3z" />
    </svg>
  )
}

