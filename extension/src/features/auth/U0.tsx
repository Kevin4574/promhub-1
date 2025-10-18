import { Toggle } from "../../components/ui/Toggle"

export interface U0Props {
	localCount: number
	localLimit: number
	showFab: boolean
	onToggleFab: (next: boolean) => void
	onRequestLogin: () => void
	onOpenWebApp: () => void
	versionLabel: string
}

export function U0({
	localCount,
	localLimit,
	showFab,
	onToggleFab,
	onRequestLogin,
	onOpenWebApp,
	versionLabel
}: U0Props) {
	const remaining = Math.max(localLimit - localCount, 0)
	const storagePercent = localLimit > 0 ? Math.min(100, Math.round((localCount / localLimit) * 100)) : 0

	return (
		<div className="auth-card animate-auth-fade">
			<header className="auth-card__header">
				<div className="auth-card__icon auth-card__icon--primary">
					<MagicIcon />
				</div>
				<div>
					<p className="auth-card__title">Prompt Manager</p>
					<p className="auth-card__subtitle">浏览器扩展设置</p>
				</div>
			</header>
			<section className="auth-card__body">
				<div className="auth-card__grid">
					<div className="auth-card__block auth-card__block--alert auth-card__block--span-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2 text-orange-700">
								<UserSlashIcon />
								<h6 className="auth-card__block-title">账号状态</h6>
							</div>
							<span className="auth-pill auth-pill--warning">未登录</span>
						</div>
						<p className="auth-helper">登录后解锁完整功能</p>
						<button type="button" className="auth-btn auth-btn--primary" onClick={onRequestLogin}>
							立即登录 / 注册
						</button>
					</div>
					<div className="auth-card__block auth-card__block--info auth-card__block--span-2">
						<h6 className="auth-card__block-title">当前限制</h6>
						<ul className="auth-list">
							<li>• 最多保存 30 条 Prompt</li>
							<li>• 仅支持本地存储</li>
							<li>• 无法跨设备同步</li>
						</ul>
					</div>
					<div className="auth-card__block auth-card__block--span-2">
						<div className="flex items-center justify-between">
							<h6 className="auth-card__block-title">本地存储</h6>
							<span className="auth-pill auth-pill--warning">
								{localCount} / {localLimit}
							</span>
						</div>
						<div className="auth-progress">
							<div className="auth-progress__indicator" style={{ width: `${storagePercent}%` }} />
						</div>
						<p className="auth-helper">还可保存 {remaining} 条 Prompt</p>
					</div>
					<div className="auth-card__block auth-card__block--span-2 auth-card__block--toggle">
						<div>
							<h6 className="auth-card__block-title" style={{ marginBottom: 4 }}>启用浮动按钮</h6>
							<p className="auth-card__block-meta">显示右下角快捷按钮</p>
						</div>
						<Toggle checked={showFab} onChange={onToggleFab} label="启用浮动按钮" />
					</div>
				</div>
				<button type="button" className="auth-link" onClick={onOpenWebApp}>
					打开 WebApp
				</button>
				<p className="auth-note">{versionLabel}</p>
			</section>
		</div>
	)
}

function MagicIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pm-icon">
			<path d="M9 18l6-12" strokeLinecap="round" />
			<path d="M5 9l3-.5L9 5l.5 3L13 9l-3 .5L9 13l-.5-3L5 9z" strokeLinecap="round" />
			<path d="M15 5l1-.3L16.3 4l.3 1 1 .3-1 .3-.3 1-.3-1-1-.3z" />
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
