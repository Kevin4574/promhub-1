import { Toggle } from "../../components/ui/Toggle"

export interface U0Props {
	localCount: number
	localLimit: number
	showFab: boolean
	authLaunching: boolean
	authLaunchStage: "idle" | "requesting"
	authError?: string | null
	onToggleFab: (next: boolean) => void
	onRequestLogin: () => void
	onRequestRegister: () => void
	onOpenWebApp: () => void
}

export function U0({
	localCount,
	localLimit,
	showFab,
	authLaunching,
	authLaunchStage,
	authError,
	onToggleFab,
	onRequestLogin,
	onRequestRegister,
	onOpenWebApp
}: U0Props) {
	const remaining = Math.max(localLimit - localCount, 0)
	const storagePercent = localLimit > 0 ? Math.min(100, Math.round((localCount / localLimit) * 100)) : 0
	const launchNotice =
		authLaunchStage === "requesting"
			? "已请求打开登录窗口，首次加载网页端时可能需要几秒。如果未看到新窗口，请检查浏览器的弹窗拦截或稍后再试。"
			: null

	return (
		<div className="auth-card animate-auth-fade">
			<header className="auth-card__header u0-brand-header">
				<div className="auth-card__icon auth-card__icon--primary u0-brand__icon">
					<MagicIcon />
				</div>
				<div className="u0-brand__text">
					<p className="u0-brand__title">Prompt Manager</p>
					<p className="u0-brand__subtitle">未登录 · 请先登录账号</p>
				</div>
			</header>
			<section className="auth-card__body u0-body">
				<div className="u0-content">
					<div className="auth-card__block auth-card__block--span-2 auth-card__block--entry">
						<div className="auth-block-header">
							<div className="auth-block-heading">
								<UserSlashIcon />
								<h6 className="auth-card__block-title">账号状态</h6>
							</div>
							<span className="auth-tag auth-tag--warning">未登录</span>
						</div>
						<p className="auth-block-description">登录后解锁完整功能</p>
						<div className="u0-auth-actions">
							<button
								type="button"
								className="auth-btn auth-btn--accent auth-btn--block"
								onClick={onRequestLogin}
								disabled={authLaunching}
							>
								{authLaunching ? "正在请求登录窗口..." : "立即登录"}
							</button>
							<button type="button" className="auth-tertiary-link u0-register-link" onClick={onRequestRegister} disabled={authLaunching}>
								还没有账号？立即注册
							</button>
							{launchNotice ? <div className="auth-inline-note">{launchNotice}</div> : null}
							{authError ? <div className="auth-inline-error">{authError}</div> : null}
						</div>
					</div>
					<div className="auth-card__block auth-card__block--span-2 auth-card__block--notice">
						<div className="auth-notice-header">
							<InfoIcon />
							<div>
								<h6 className="auth-card__block-title">当前限制</h6>
								<p className="auth-card__block-meta">未登录状态下的可用能力</p>
							</div>
						</div>
						<ul className="auth-list auth-list--dense">
							<li>• 最多保存 30 条 Prompt</li>
							<li>• 仅支持本地存储</li>
							<li>• 无法跨设备同步</li>
						</ul>
					</div>
					<div className="u0-storage">
						<div className="u0-storage__header">
							<h6 className="auth-card__block-title">本地存储</h6>
							<span className="auth-tag auth-tag--warning">
								{localCount} / {localLimit}
							</span>
						</div>
						<div className="auth-progress">
							<div className="auth-progress__indicator" style={{ width: `${storagePercent}%` }} />
						</div>
						<p className="u0-storage__hint">还可保存 {remaining} 条 Prompt</p>
					</div>
					<div className="u0-toggle">
						<div>
							<h6 className="u0-toggle__title">启用浮动按钮</h6>
							<p className="u0-toggle__meta">显示右下角快捷按钮</p>
						</div>
						<Toggle checked={showFab} onChange={onToggleFab} label="启用浮动按钮" />
					</div>
				</div>
			</section>
			<footer className="auth-card__footer">
				<button type="button" className="auth-btn auth-btn--secondary auth-btn--block" onClick={onOpenWebApp}>
					打开 WebApp
				</button>
			</footer>
		</div>
	)
}

function MagicIcon() {
	return (
		<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false" className="u0-brand__svg">
			<path
				fill="currentColor"
				d="M224 32c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32zm181.3 74.7L405.3 96l11.3-11.3c6.2-6.2 6.2-16.4 0-22.6s-16.4-6.2-22.6 0L384 73.4L372.7 62.1c-6.2-6.2-16.4-6.2-22.6 0s-6.2 16.4 0 22.6L361.4 96l-11.3 11.3c-6.2 6.2-6.2 16.4 0 22.6s16.4 6.2 22.6 0L384 118.6l11.3 11.3c6.2 6.2 16.4 6.2 22.6 0s6.2-16.4 0-22.6zM96 128c0-17.7-14.3-32-32-32S32 110.3 32 128s14.3 32 32 32s32-14.3 32-32zm384 96c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32zM112 352c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32zm352 32c-17.7 0-32 14.3-32 32c0 17.7-14.3 32-32 32c-17.7 0-32 14.3-32 32c0 17.7-14.3 32-32 32h-32l-45.3-45.3l-45.3 45.3c-6.2 6.2-16.4 6.2-22.6 0l-32-32c-6.2-6.2-6.2-16.4 0-22.6L288 322.7 125.3 160l-64 64L224 382.6 70.6 536c-6.2 6.2-6.2 16.4 0 22.6l32 32c6.2 6.2 16.4 6.2 22.6 0L321.3 394.6 416 489.3c6.2 6.2 16.4 6.2 22.6 0l32-32c6.2-6.2 6.2-16.4 0-22.6L288 214.7 461.3 41.4c6.2-6.2 6.2-16.4 0-22.6L416 0l32-32c6.2-6.2 6.2-16.4 0-22.6s-16.4-6.2-22.6 0L380.7 6.7 288 101.4 173.3 -13.3 96 64l226.7 226.7 96-96L416 256z"
			/>
		</svg>
	)
}

function UserSlashIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pm-icon pm-icon--warn">
			<circle cx="9" cy="7" r="3" />
			<path d="M14 20a5 5 0 00-10 0" strokeLinecap="round" />
			<path d="M15 9l6 6" strokeLinecap="round" />
			<path d="M21 9l-6 6" strokeLinecap="round" />
		</svg>
	)
}

function InfoIcon() {
	return (
		<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="pm-icon pm-icon--info">
			<circle cx="10" cy="10" r="7" />
			<path d="M10 6.5h.01" strokeLinecap="round" />
			<path d="M8.5 9.5h3l-1 4" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}
