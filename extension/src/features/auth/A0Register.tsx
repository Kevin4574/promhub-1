import type { FormEvent } from "react"
import { useState } from "react"

export interface RegisterPayload {
	email: string
	password: string
	nickname: string
}

export interface A0RegisterProps {
	onSubmit: (payload: RegisterPayload) => Promise<void>
	onBack: () => void
	onSwitchToLogin: () => void
}

const FALLBACK_NICKNAME = "new-user"
const FALLBACK_EMAIL = "user@example.com"
const FALLBACK_PASSWORD = "prompt123"

export function A0Register({ onSubmit, onBack, onSwitchToLogin }: A0RegisterProps) {
	const [nickname, setNickname] = useState(FALLBACK_NICKNAME)
	const [email, setEmail] = useState(FALLBACK_EMAIL)
	const [password, setPassword] = useState(FALLBACK_PASSWORD)
	const [confirmPassword, setConfirmPassword] = useState(FALLBACK_PASSWORD)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setFormError(null)

		const trimmedNickname = nickname.trim() || FALLBACK_NICKNAME
		const trimmedEmail = email.trim() || FALLBACK_EMAIL
		const trimmedPassword = password.trim() || FALLBACK_PASSWORD
		const trimmedConfirmPassword = confirmPassword.trim() || FALLBACK_PASSWORD

		if (trimmedPassword.length < 6) {
			setFormError("密码至少 6 位")
			return
		}

		if (trimmedPassword !== trimmedConfirmPassword) {
			setFormError("两次输入的密码不一致")
			return
		}

		setNickname(trimmedNickname)
		setEmail(trimmedEmail)
		setPassword(trimmedPassword)
		setConfirmPassword(trimmedPassword)

		setIsSubmitting(true)
		try {
			await onSubmit({ email: trimmedEmail, password: trimmedPassword, nickname: trimmedNickname })
		} catch (error) {
			setFormError("注册失败，请稍后重试")
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="auth-card animate-auth-fade">
			<header className="auth-card__header">
				<div className="auth-card__icon auth-card__icon--primary">
					<RegisterIcon />
				</div>
				<div>
					<p className="auth-card__title">注册 Prompt Manager</p>
					<p className="auth-card__subtitle">创建新账号，开始使用</p>
				</div>
			</header>
			<section className="auth-card__body">
				{formError ? <p className="auth-form-error" role="alert">{formError}</p> : null}
				<form className="auth-form" onSubmit={handleSubmit}>
					<div>
						<label className="auth-field__label" htmlFor="auth-register-nickname">用户名</label>
						<input
							id="auth-register-nickname"
							type="text"
							className="auth-input"
							placeholder="输入用户名"
							value={nickname}
							onChange={(event) => setNickname(event.target.value)}
						/>
					</div>
					<div>
						<label className="auth-field__label" htmlFor="auth-register-email">邮箱地址</label>
						<input
							id="auth-register-email"
							type="email"
							className="auth-input"
							placeholder="your@email.com"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							autoComplete="email"
						/>
					</div>
					<div>
						<label className="auth-field__label" htmlFor="auth-register-password">密码</label>
						<input
							id="auth-register-password"
							type="password"
							className="auth-input"
							placeholder="至少 6 位"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							autoComplete="new-password"
						/>
					</div>
					<div>
						<label className="auth-field__label" htmlFor="auth-register-confirm">确认密码</label>
						<input
							id="auth-register-confirm"
							type="password"
							className="auth-input"
							placeholder="再次输入密码"
							value={confirmPassword}
							onChange={(event) => setConfirmPassword(event.target.value)}
							autoComplete="new-password"
						/>
					</div>
					<button type="submit" className="auth-btn auth-btn--primary" disabled={isSubmitting}>
						{isSubmitting ? "注册中..." : "立即注册"}
					</button>
				</form>
				<p className="auth-note">注册即表示您同意我们的 <span>服务条款</span> 和 <span>隐私政策</span></p>
				<div className="auth-inline-actions">
					<button type="button" className="auth-secondary-link" onClick={onBack}>
						返回入口
					</button>
					<button type="button" className="auth-secondary-link" onClick={onSwitchToLogin}>
						已有账号？登录
					</button>
				</div>
			</section>
		</div>
	)
}

function RegisterIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pm-icon">
			<path d="M12 12a5 5 0 100-10 5 5 0 000 10z" />
			<path d="M21 21a8.38 8.38 0 00-9-8 8.38 8.38 0 00-9 8" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M16 11l5 5" strokeLinecap="round" />
			<path d="M21 11l-5 5" strokeLinecap="round" />
		</svg>
	)
}
