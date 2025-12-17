import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type MutableRefObject
} from "react"

import type { AuthSession } from "../../services/auth"
import { getSession, logout, subscribeSession } from "../../services/auth"
import { storageGet, storageKeys, storageSet, storageSubscribe } from "../../services/storage"
import { startAuthFlow } from "../../services/webauthflow"
import { warmupAuthOrigin } from "../../services/auth-warmup"
import { U0 } from "./U0"
import { U1 } from "./U1"

const LOCAL_LIMIT = 30
const DEFAULT_LOCAL_COUNT = 15
const DEFAULT_SHOW_FAB = true
const FALLBACK_PROMPT_COUNT = 128
const FALLBACK_FAVORITE_COUNT = 34
const SYNC_MESSAGE_DURATION = 2000

type AuthView = "U0" | "U1"
type AuthLaunchStage = "idle" | "requesting"

type LogPayload = Record<string, unknown>

const viewEventMap: Record<AuthView, string> = {
	U0: "auth.u0.view",
	U1: "auth.u1.view"
}

function logEvent(event: string, payload?: LogPayload) {
	if (payload && Object.keys(payload).length > 0) {
		console.info(`[auth] ${event}`, payload)
		return
	}
	console.info(`[auth] ${event}`)
}

function formatDateOnly(timestamp?: number): string {
	if (!timestamp) {
		return "--"
	}
	const date = new Date(timestamp)
	const year = date.getFullYear()
	const month = `${date.getMonth() + 1}`.padStart(2, "0")
	const day = `${date.getDate()}`.padStart(2, "0")
	return `${year}-${month}-${day}`
}

export function AuthRoot() {
	const [view, setView] = useState<AuthView>("U0")
	const [session, setSession] = useState<AuthSession | null>(null)
	const [localCount, setLocalCount] = useState<number>(DEFAULT_LOCAL_COUNT)
	const [showFab, setShowFab] = useState<boolean>(DEFAULT_SHOW_FAB)
	const [initialised, setInitialised] = useState(false)
	const [isSyncing, setIsSyncing] = useState(false)
	const [authLaunching, setAuthLaunching] = useState(false)
	const [authError, setAuthError] = useState<string | null>(null)
	const [authLaunchStage, setAuthLaunchStage] = useState<AuthLaunchStage>("idle")

	const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const shellRef = useRef<HTMLDivElement | null>(null)
	const requestResize = usePopupAutoResize(shellRef)
	const prevSessionRef = useRef<AuthSession | null>(null)
	const bootstrappedSessionRef = useRef(false)

	useEffect(() => {
		let cancelled = false

		async function bootstrap() {
			try {
				void warmupAuthOrigin()
				const [storedSession, storedShowFab, storedLocalCount] = await Promise.all([
					getSession(),
					storageGet<boolean>(storageKeys.showFab),
					storageGet<number>(storageKeys.localCount)
				])

				if (cancelled) {
					return
				}

				const nextSession = storedSession ?? null
				const nextShowFab = typeof storedShowFab === "boolean" ? storedShowFab : DEFAULT_SHOW_FAB
				const nextLocalCount = typeof storedLocalCount === "number" ? storedLocalCount : DEFAULT_LOCAL_COUNT

				setSession(nextSession)
				setView(nextSession ? "U1" : "U0")
				setShowFab(nextShowFab)
				setLocalCount(nextLocalCount)

				const persistTasks: Array<Promise<void>> = []
				if (typeof storedShowFab !== "boolean") {
					persistTasks.push(storageSet(storageKeys.showFab, nextShowFab))
				}
				if (typeof storedLocalCount !== "number") {
					persistTasks.push(storageSet(storageKeys.localCount, nextLocalCount))
				}
				if (persistTasks.length > 0) {
					await Promise.allSettled(persistTasks)
				}
			} catch (error) {
				console.error("[auth] failed to initialise popup state", error)
			} finally {
				if (!cancelled) {
					setInitialised(true)
				}
			}
		}

		bootstrap().catch((error) => {
			console.error("[auth] bootstrap error", error)
		})

		const offSession = subscribeSession((nextSession) => {
			setSession(nextSession)
			setView(nextSession ? "U1" : "U0")
		})

		const offShowFab = storageSubscribe<boolean>(storageKeys.showFab, (value) => {
			if (typeof value === "boolean") {
				setShowFab(value)
			}
		})

		const offLocalCount = storageSubscribe<number>(storageKeys.localCount, (value) => {
			if (typeof value === "number") {
				setLocalCount(value)
			}
		})

		return () => {
			cancelled = true
			offSession()
			offShowFab()
			offLocalCount()
			if (syncTimerRef.current) {
				clearTimeout(syncTimerRef.current)
				syncTimerRef.current = null
			}
		}
	}, [])

	useEffect(() => {
		if (!initialised) {
			return
		}
		logEvent(viewEventMap[view])
	}, [initialised, view])

	const safeLocalCount = useMemo(() => {
		return Math.max(0, Math.min(localCount, LOCAL_LIMIT))
	}, [localCount])

	useEffect(() => {
		if (!bootstrappedSessionRef.current) {
			bootstrappedSessionRef.current = true
			prevSessionRef.current = session
			return
		}

		const previous = prevSessionRef.current
		if (session && !previous) {
			setView("U1")
			setIsSyncing(true)
			logEvent("auth.u1.syncing_start")
			if (syncTimerRef.current) {
				clearTimeout(syncTimerRef.current)
			}
			syncTimerRef.current = setTimeout(() => {
				setIsSyncing(false)
				logEvent("auth.u1.syncing_complete")
				syncTimerRef.current = null
				setSession((prev) => (prev ? { ...prev, lastSyncAt: Date.now() } : null))
			}, SYNC_MESSAGE_DURATION)
		}

		if (!session && previous) {
			if (syncTimerRef.current) {
				clearTimeout(syncTimerRef.current)
				syncTimerRef.current = null
			}
			setIsSyncing(false)
			setView("U0")
		}

		prevSessionRef.current = session
	}, [session])

	const launchAuthFlow = useCallback(
		async (mode: "login" | "register") => {
			if (authLaunching) {
				return
			}
			const source = mode === "login" ? "auth.u0.login_click" : "auth.u0.register_click"
			logEvent(source)
			setAuthError(null)
			setAuthLaunchStage("requesting")
			setAuthLaunching(true)
			try {
				await startAuthFlow(mode)
				logEvent(mode === "login" ? "auth.u0.login_flow_started" : "auth.u0.register_flow_started")
			} catch (error) {
				console.error("[auth] failed to start WebAuthFlow", error)
				logEvent(mode === "login" ? "auth.u0.login_flow_error" : "auth.u0.register_flow_error", { message: (error as Error)?.message })
				setAuthError("登录窗口未能成功打开，请检查扩展权限或稍后再试。")
			} finally {
				setAuthLaunchStage("idle")
				setAuthLaunching(false)
			}
		},
		[authLaunching]
	)

	const handleRequestLogin = useCallback(() => {
		void launchAuthFlow("login")
	}, [launchAuthFlow])

	const handleRequestRegister = useCallback(() => {
		void launchAuthFlow("register")
	}, [launchAuthFlow])

	const handleFabToggle = useCallback(
		async (next: boolean) => {
			const source = session ? "auth.u1.fab_toggle" : "auth.u0.fab_toggle"
			logEvent(source, { enabled: next })
			setShowFab(next)
			try {
				await storageSet(storageKeys.showFab, next)
			} catch (error) {
				console.error("[auth] failed to persist FAB preference", error)
			}
		},
		[session]
	)

	const handleOpenWebApp = useCallback(() => {
		const source = session ? "auth.u1.open_webapp" : "auth.u0.open_webapp"
		logEvent(source)
		try {
			window.open("https://promptmanna.app", "_blank", "noopener,noreferrer")
		} catch (error) {
			console.error("[auth] failed to open web app", error)
		}
	}, [session])

	const handleLogout = useCallback(async () => {
		logEvent("auth.u1.logout", { email: session?.email })
		if (syncTimerRef.current) {
			clearTimeout(syncTimerRef.current)
			syncTimerRef.current = null
		}
		setIsSyncing(false)
		try {
			await logout()
		} catch (error) {
			console.error("[auth] logout failed", error)
		} finally {
			setSession(null)
		}
	}, [session])

	const joinedLabel = useMemo(() => formatDateOnly(session?.joinedAt ?? session?.lastLoginAt), [session])

	const promptCount = session?.promptCount ?? FALLBACK_PROMPT_COUNT
	const favoriteCount = session?.favoriteCount ?? FALLBACK_FAVORITE_COUNT

	useEffect(() => {
		if (!initialised) {
			return
		}
		requestResize()
	}, [initialised, requestResize, view, isSyncing, showFab, safeLocalCount, session])

	if (!initialised) {
		return (
			<div className="pm-auth-shell">
				<div className="pm-card-surface pm-card-loading">
					<div className="pm-card-loading__spinner" />
					<p className="pm-card-loading__text">正在载入...</p>
				</div>
			</div>
		)
	}

	return (
		<div ref={shellRef} className="pm-auth-shell">
			{!initialised ? null : (
				<>
					{view === "U0" ? (
						<U0
							localCount={safeLocalCount}
							localLimit={LOCAL_LIMIT}
							showFab={showFab}
							authLaunching={authLaunching}
							authLaunchStage={authLaunchStage}
							authError={authError}
							onToggleFab={handleFabToggle}
							onRequestLogin={handleRequestLogin}
							onRequestRegister={handleRequestRegister}
							onOpenWebApp={handleOpenWebApp}
						/>
					) : null}
					{view === "U1" && session ? (
						<U1
							session={session}
							showFab={showFab}
							onToggleFab={handleFabToggle}
							onOpenWebApp={handleOpenWebApp}
							onLogout={handleLogout}
							joinedLabel={joinedLabel}
							promptCount={promptCount}
							favoriteCount={favoriteCount}
									syncing={isSyncing}
						/>
					) : null}
				</>
			)}
		</div>
	)
}

function usePopupAutoResize(targetRef: MutableRefObject<HTMLElement | null>) {
	const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
	const rafRef = useRef<number | null>(null)

	const resizePopup = useCallback(() => {
		const node = targetRef.current
		if (!node || typeof window === "undefined") {
			return
		}

		const rect = node.getBoundingClientRect()
		const width = Math.ceil(rect.width)
		const height = Math.ceil(rect.height)

		const widthDeltaRaw = window.outerWidth - window.innerWidth
		const heightDeltaRaw = window.outerHeight - window.innerHeight
		const widthDelta = Number.isFinite(widthDeltaRaw) ? Math.max(widthDeltaRaw, 0) : 0
		const heightDelta = Number.isFinite(heightDeltaRaw) ? Math.max(heightDeltaRaw, 0) : 0

		const targetWidth = width + widthDelta
		const targetHeight = height + heightDelta

		if (!Number.isFinite(targetWidth) || !Number.isFinite(targetHeight)) {
			return
		}

		const last = sizeRef.current
		if (Math.abs(last.width - targetWidth) < 1 && Math.abs(last.height - targetHeight) < 1) {
			return
		}

		sizeRef.current = { width: targetWidth, height: targetHeight }

		if (typeof window.resizeTo === "function") {
			try {
				window.resizeTo(targetWidth, targetHeight)
			} catch (error) {
				console.error("[auth] failed to resize popup", error)
			}
		}
	}, [targetRef])

	const scheduleResize = useCallback(() => {
		if (typeof window === "undefined") {
			return
		}
		if (rafRef.current !== null) {
			window.cancelAnimationFrame(rafRef.current)
		}
		if (typeof window.requestAnimationFrame === "function") {
			rafRef.current = window.requestAnimationFrame(() => {
				rafRef.current = null
				resizePopup()
			})
		} else {
			rafRef.current = null
			resizePopup()
		}
	}, [resizePopup])

	useLayoutEffect(() => {
		if (typeof window === "undefined") {
			return
		}

		const node = targetRef.current
		if (!node) {
			return
		}

		scheduleResize()

		const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => scheduleResize()) : null
		resizeObserver?.observe(node)

		window.addEventListener("load", scheduleResize)

		return () => {
			resizeObserver?.disconnect()
			window.removeEventListener("load", scheduleResize)
			if (rafRef.current !== null) {
				window.cancelAnimationFrame(rafRef.current)
				rafRef.current = null
			}
		}
	}, [scheduleResize, targetRef])

	return scheduleResize
}

