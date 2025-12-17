import type { AuthSession } from "../../services/auth"
import { Toggle } from "../../components/ui/Toggle"

export interface U1Props {
	session: AuthSession
	showFab: boolean
	onToggleFab: (next: boolean) => void
	onOpenWebApp: () => void
	onLogout: () => void
	joinedLabel: string
	promptCount: number
	favoriteCount: number
	syncing: boolean
}

export function U1({
	session,
	showFab,
	onToggleFab,
	onOpenWebApp,
	onLogout,
	joinedLabel,
	promptCount,
	favoriteCount,
	syncing
}: U1Props) {
	const displayName = session.nickname || session.email

	return (
		<div className="auth-card animate-auth-fade">
			{syncing ? (
				<div className="auth-banner">
					<SyncIcon /> 登录成功，数据已同步
				</div>
			) : null}
			<header className="auth-card__header">
				<div className="auth-card__icon auth-card__icon--success">
					<UserCheckIcon />
				</div>
				<div>
					<p className="auth-card__title">Prompt Manager</p>
					<p className="auth-card__subtitle auth-card__subtitle--success">已登录</p>
				</div>
			</header>
			<section className="auth-card__body">
				<div className="auth-card__grid auth-card__grid--vertical">
					<div className="auth-card__block auth-card__block--success auth-card__block--span-2 auth-card__block--account">
						<h6 className="auth-card__block-title">账户信息</h6>
						<ul className="auth-metric-list">
							<li>
								<span className="auth-metric-label">账户名</span>
								<span className="auth-metric-value">{displayName}</span>
							</li>
							<li>
								<span className="auth-metric-label">邮箱</span>
								<span className="auth-metric-value">{session.email}</span>
							</li>
							<li>
								<span className="auth-metric-label">加入于</span>
								<span className="auth-metric-value">{joinedLabel}</span>
							</li>
						</ul>
					</div>
					<div className="auth-card__block auth-card__block--span-2 auth-card__block--stat">
						<div className="auth-stat-card">
							<div className="auth-stat-card__header">
								<StatIcon />
								<h6 className="auth-card__block-title">统计数据</h6>
							</div>
							<ul className="auth-metric-list auth-metric-list--blue">
								<li>
									<span className="auth-metric-label">Prompt 数量</span>
									<span className="auth-metric-value">{promptCount}</span>
								</li>
								<li>
									<span className="auth-metric-label">收藏数量</span>
									<span className="auth-metric-value">{favoriteCount}</span>
								</li>
							</ul>
						</div>
					</div>
					<div className="auth-card__block auth-card__block--span-2 auth-card__block--plain">
						<div className="auth-block-header">
							<h6 className="auth-card__block-title">Prompt 存储</h6>
							<span className="auth-tag auth-tag--success">∞ 无限制</span>
						</div>
						<div className="auth-progress">
							<div className="auth-progress__indicator auth-progress__indicator--success" style={{ width: "100%" }} />
						</div>
						<p className="auth-helper auth-helper--success">
							<InfinityIcon /> 无限存储空间
						</p>
					</div>
					<div className="auth-card__block auth-card__block--span-2 auth-card__block--toggle">
						<div>
							<h6 className="auth-card__block-title" style={{ marginBottom: 4 }}>启用浮动按钮</h6>
							<p className="auth-card__block-meta">显示右下角快捷按钮</p>
						</div>
						<Toggle checked={showFab} onChange={onToggleFab} label="启用浮动按钮" />
					</div>
				</div>
			</section>
			<footer className="auth-card__footer auth-card__footer--actions">
				<div className="auth-inline-actions">
					<button type="button" className="auth-btn auth-btn--secondary" onClick={onOpenWebApp}>
						打开 WebApp
					</button>
					<button type="button" className="auth-btn auth-btn--danger" onClick={onLogout}>
						注销登录
					</button>
				</div>
			</footer>
		</div>
	)
}

function UserCheckIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pm-icon pm-icon--success">
			<circle cx="9" cy="7" r="3" />
			<path d="M14 20a5 5 0 00-10 0" strokeLinecap="round" />
			<path d="M16 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function InfinityIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pm-icon pm-icon--success">
			<path d="M6 12c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0-1.5 6-5 3-3.5-5-5 0-6 1-5-3z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function SyncIcon() {
	return (
		<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="pm-icon pm-icon--sync">
			<path d="M4 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M16 16v-4h-4" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M4.93 6.93a6 6 0 018.49-1.42L15 6" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M15.07 13.07a6 6 0 01-8.49 1.42L5 14" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function StatIcon() {
	return (
		<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="pm-icon pm-icon--blue">
			<path d="M4 14v-3" strokeLinecap="round" />
			<path d="M9 14V6" strokeLinecap="round" />
			<path d="M14 14v-5" strokeLinecap="round" />
			<path d="M3 16h14" strokeLinecap="round" />
		</svg>
	)
}
