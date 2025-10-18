import type { FormEvent } from "react"
import { useMemo, useState } from "react"

import type { LoginPayload } from "../../services/auth"

export interface A0LoginProps {
	onSubmit: (payload: LoginPayload) => Promise<void>
	onBack: () => void
	onSwitchToRegister: () => void
}

const FALLBACK_EMAIL = "user@example.com"
const FALLBACK_PASSWORD = "prompt123"

function isValidEmail(value: string): boolean {
	return /@/.test(value.trim())
}

function isValidPassword(value: string): boolean {
	return value.trim().length >= 6
}

export function A0({ onSubmit, onBack, onSwitchToRegister }: A0LoginProps) {
	const [email, setEmail] = useState(FALLBACK_EMAIL)
	const [password, setPassword] = useState(FALLBACK_PASSWORD)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)

	const emailError = useMemo(() => {
		const trimmed = email.trim()
		if (trimmed.length === 0) {
			return ""
		}
		return isValidEmail(trimmed) ? "" : "请输入有效的邮箱地址"
	}, [email])

	const passwordError = useMemo(() => {
		const trimmed = password.trim()
		if (trimmed.length === 0) {
			return ""
		}
		return isValidPassword(trimmed) ? "" : "密码至少 6 位"
	}, [password])

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setFormError(null)
		setIsSubmitting(true)

		const trimmedEmail = email.trim()
		const trimmedPassword = password.trim()
		const finalEmail = isValidEmail(trimmedEmail) ? trimmedEmail : FALLBACK_EMAIL
		const finalPassword = isValidPassword(trimmedPassword) ? trimmedPassword : FALLBACK_PASSWORD

		setEmail(finalEmail)
		setPassword(finalPassword)

		try {
			await onSubmit({ email: finalEmail, password: finalPassword })
		} catch (error) {
			setFormError("登录失败，请稍后重试")
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="auth-card animate-auth-fade">
			<header className="auth-card__header">
				<div className="auth-card__icon auth-card__icon--primary">
					<LoginMagicIcon />
				</div>
				<div>
					<p className="auth-card__title">欢迎使用 Prompt Manager</p>
					<p className="auth-card__subtitle">登录解锁无限 Prompt 存储空间</p>
				</div>
			</header>
			<section className="auth-card__body">
				{formError ? <p className="auth-form-error" role="alert">{formError}</p> : null}
				<form className="auth-form" onSubmit={handleSubmit}>
					<div>
						<label className="auth-field__label" htmlFor="auth-login-email">邮箱地址</label>
						<input
							id="auth-login-email"
							type="email"
							className={`auth-input${emailError ? " auth-input--error" : ""}`}
							placeholder="your@email.com"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							autoComplete="email"
						/>
						{emailError ? <p className="auth-helper auth-helper--error">{emailError}</p> : null}
					</div>
					<div>
						<label className="auth-field__label" htmlFor="auth-login-password">密码</label>
						<input
							id="auth-login-password"
							type="password"
							className={`auth-input${passwordError ? " auth-input--error" : ""}`}
							placeholder="输入密码"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							autoComplete="current-password"
						/>
						{passwordError ? <p className="auth-helper auth-helper--error">{passwordError}</p> : null}
					</div>
					<button type="submit" className="auth-btn auth-btn--primary" disabled={isSubmitting}>
						{isSubmitting ? "登录中..." : "立即登录"}
					</button>
				</form>
				<p className="auth-note">登录即表示您同意我们的 <span>服务条款</span> 和 <span>隐私政策</span></p>
				<div className="auth-inline-actions">
					<button type="button" className="auth-secondary-link" onClick={onBack}>
						返回入口
					</button>
					<button type="button" className="auth-secondary-link" onClick={onSwitchToRegister}>
						前往注册
					</button>
				</div>
			</section>
		</div>
	)
}

function LoginMagicIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pm-icon">
			<path d="M9 18l6-12" strokeLinecap="round" />
			<path d="M5 9l3-.5L9 5l.5 3L13 9l-3 .5L9 13l-.5-3L5 9z" strokeLinecap="round" />
			<path d="M15 5l1-.3L16.3 4l.3 1 1 .3-1 .3-.3 1-.3-1-1-.3z" />
		</svg>
	)
}
