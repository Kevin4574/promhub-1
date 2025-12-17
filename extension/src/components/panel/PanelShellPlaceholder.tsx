import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

type PanelShellPlaceholderProps = {
	title: string
	children?: React.ReactNode
	onClose?: () => void
}

const PANEL_MIN_WIDTH = 420
const PANEL_MAX_WIDTH = 1200
const HOST_MIN_WIDTH_FLOOR = 560
const HOST_MIN_WIDTH_CEIL = 720
const HOST_MIN_WIDTH_RATIO = 0.45
const HOST_OVERFLOW_TOLERANCE = 8
const HOST_TRANSITION =
	"width 240ms cubic-bezier(0.24, 0.8, 0.32, 1), max-width 240ms cubic-bezier(0.24, 0.8, 0.32, 1), margin-right 240ms cubic-bezier(0.24, 0.8, 0.32, 1)"
const HOST_CONTENT_SELECTORS = [
	"#app",
	"#root",
	"#__next",
	"#page",
	"#pm-root",
	".app",
	".root",
	".app-root",
	'main[role="main"]',
	"ytd-app",
	"#content",
	".ytd-page-manager",
	"ytd-watch-flexy"
]

const HOST_CONTENT_SELECTOR_TARGETS = HOST_CONTENT_SELECTORS.flatMap((selector) => [
	`body > ${selector}`,
	selector
])

type PanelMode = "squeeze" | "overlay"

type PanelLayout = {
	width: number
	mode: PanelMode
	hostSafeMinWidth: number
}

function getViewportWidth(): number {
	if (typeof window === "undefined") {
		return 1440
	}
	return window.innerWidth
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value))
}

function getHostSafeMinWidth(viewport: number): number {
	return clamp(Math.round(viewport * HOST_MIN_WIDTH_RATIO), HOST_MIN_WIDTH_FLOOR, HOST_MIN_WIDTH_CEIL)
}

function resolvePanelLayout(viewport: number, desiredWidth: number): PanelLayout {
	const hostSafeMinWidth = getHostSafeMinWidth(viewport)
	const clampedDesired = clamp(desiredWidth, PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, viewport))
	const hostWidthAfterSqueeze = viewport - clampedDesired

	if (hostWidthAfterSqueeze >= hostSafeMinWidth) {
		const maxSqueezeWidth = Math.max(PANEL_MIN_WIDTH, viewport - hostSafeMinWidth)
		return {
			mode: "squeeze",
			width: clamp(clampedDesired, PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, maxSqueezeWidth)),
			hostSafeMinWidth
		}
	}

	return {
		mode: "overlay",
		width: clamp(clampedDesired, PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, viewport)),
		hostSafeMinWidth
	}
}

function computeInitialLayout(): PanelLayout {
	const viewport = getViewportWidth()
	return resolvePanelLayout(viewport, PANEL_MIN_WIDTH)
}

function measureHostContentWidth(): number {
	if (typeof document === "undefined") return 0
	for (const selector of HOST_CONTENT_SELECTORS) {
		const element =
			document.querySelector<HTMLElement>(`body > ${selector}`) ?? document.querySelector<HTMLElement>(selector)
		if (element) {
			const rect = element.getBoundingClientRect()
			if (rect.width > 0) return rect.width
		}
	}
	return document.body?.getBoundingClientRect().width ?? 0
}

export default function PanelShellPlaceholder({ title, children, onClose }: PanelShellPlaceholderProps) {
	const [layout, setLayout] = useState<PanelLayout>(() => computeInitialLayout())
	const [isDragging, setIsDragging] = useState(false)
	const resizerRef = useRef<HTMLDivElement | null>(null)
	const shellRef = useRef<HTMLElement | null>(null)
	const hostStyleRef = useRef<HTMLStyleElement | null>(null)
	const dragStateRef = useRef<{
		raf: number | null
		pendingWidth: number
		liveLayout: PanelLayout
	}>({
		raf: null,
		pendingWidth: layout.width,
		liveLayout: layout
	})

	// 创建 / 清理宿主样式节点
	useEffect(() => {
		const styleEl = document.createElement("style")
		styleEl.id = "pm-panel-host-style"
		document.head.appendChild(styleEl)
		hostStyleRef.current = styleEl
		return () => {
			styleEl.remove()
			hostStyleRef.current = null
		}
	}, [])

	const buildSqueezeCSS = useCallback((squeezeWidth: number, hostSafeMinWidth: number, transitionValue: string) => {
		const selectors = HOST_CONTENT_SELECTOR_TARGETS.join(",\n")
		return `
:root {
	--pm-panel-width: ${squeezeWidth}px;
	--pm-panel-host-min-width: ${hostSafeMinWidth}px;
}
html {
	width: 100% !important;
	max-width: 100% !important;
	overflow-x: hidden !important;
}
body {
	width: 100% !important;
	max-width: 100% !important;
	margin: 0 !important;
	padding-right: var(--pm-panel-width, ${squeezeWidth}px) !important;
	padding-inline-end: var(--pm-panel-width, ${squeezeWidth}px) !important;
	box-sizing: border-box !important;
	min-width: var(--pm-panel-host-min-width, ${hostSafeMinWidth}px) !important;
	transition: ${transitionValue};
}
${selectors} {
	width: 100% !important;
	max-width: 100% !important;
	box-sizing: border-box !important;
}
`
	}, [])

	const writeHostStyles = useCallback(
		(targetLayout: PanelLayout, animate = true) => {
			const styleEl = hostStyleRef.current
			if (!styleEl) return

			if (targetLayout.mode !== "squeeze") {
				styleEl.textContent = ""
				return
			}

			const squeezeWidth = Math.min(targetLayout.width, getViewportWidth())
			const transitionValue = animate ? HOST_TRANSITION : "none"
			styleEl.textContent = buildSqueezeCSS(squeezeWidth, targetLayout.hostSafeMinWidth, transitionValue)
		},
		[buildSqueezeCSS]
	)

	// 根据模式实时更新宿主挤压宽度
	useEffect(() => {
		writeHostStyles(layout, !isDragging)
	}, [layout, isDragging, writeHostStyles])

	useEffect(() => {
		if (layout.mode !== "squeeze") return
		const raf = window.requestAnimationFrame(() => {
			const contentWidth = measureHostContentWidth()
			const minAllowed = layout.hostSafeMinWidth - HOST_OVERFLOW_TOLERANCE
			if (contentWidth > 0 && contentWidth < minAllowed) {
				setLayout((prev) => {
					if (prev.mode !== "squeeze") return prev
					return {
						...prev,
						mode: "overlay"
					}
				})
			}
		})
		return () => window.cancelAnimationFrame(raf)
	}, [layout])

	const applyLiveLayout = useCallback(
		(nextLayout: PanelLayout, animate = false) => {
			dragStateRef.current.liveLayout = nextLayout
			if (shellRef.current) {
				shellRef.current.style.width = `${nextLayout.width}px`
			}
			writeHostStyles(nextLayout, animate)
		},
		[writeHostStyles]
	)

	// 自适应宽度与模式
	useEffect(() => {
		const handleResize = () => {
			setLayout((prev) => resolvePanelLayout(getViewportWidth(), prev.width))
		}
		window.addEventListener("resize", handleResize)
		return () => window.removeEventListener("resize", handleResize)
	}, [])

	// 同步最新布局到拖拽状态
	useEffect(() => {
		dragStateRef.current.liveLayout = layout
		dragStateRef.current.pendingWidth = layout.width
	}, [layout])

	const scheduleLayoutUpdate = useCallback(
		(nextWidth: number) => {
			dragStateRef.current.pendingWidth = nextWidth
			if (dragStateRef.current.raf !== null) return
			dragStateRef.current.raf = window.requestAnimationFrame(() => {
				dragStateRef.current.raf = null
				const viewport = getViewportWidth()
				const nextLayout = resolvePanelLayout(viewport, dragStateRef.current.pendingWidth)
				applyLiveLayout(nextLayout, false)
			})
		},
		[applyLiveLayout]
	)

	const handlePointerDown = useCallback(
		(event: PointerEvent) => {
			if (event.button !== 0) return
			event.preventDefault()

			const resizer = resizerRef.current
			const pointerId = event.pointerId
			const originalCursor = document.body.style.cursor
			const originalUserSelect = document.body.style.userSelect

			document.body.style.cursor = "col-resize"
			document.body.style.userSelect = "none"
			setIsDragging(true)

			const onPointerMove = (moveEvent: PointerEvent) => {
				const viewport = getViewportWidth()
				const desiredWidth = viewport - moveEvent.clientX
				scheduleLayoutUpdate(desiredWidth)
			}

			const onPointerUp = () => {
				if (dragStateRef.current.raf !== null) {
					cancelAnimationFrame(dragStateRef.current.raf)
					dragStateRef.current.raf = null
					const viewport = getViewportWidth()
					const finalLayout = resolvePanelLayout(viewport, dragStateRef.current.pendingWidth)
					applyLiveLayout(finalLayout, false)
					setLayout(finalLayout)
				} else {
					setLayout(dragStateRef.current.liveLayout)
				}
				document.body.style.cursor = originalCursor
				document.body.style.userSelect = originalUserSelect
				setIsDragging(false)
				window.removeEventListener("pointermove", onPointerMove)
				window.removeEventListener("pointerup", onPointerUp)
				resizer?.releasePointerCapture(pointerId)
			}

			resizer?.setPointerCapture(pointerId)
			window.addEventListener("pointermove", onPointerMove)
			window.addEventListener("pointerup", onPointerUp)
		},
		[scheduleLayoutUpdate]
	)

	useEffect(() => {
		const resizer = resizerRef.current
		if (!resizer) return
		const listener = (event: PointerEvent) => handlePointerDown(event)
		resizer.addEventListener("pointerdown", listener)
		return () => {
			resizer.removeEventListener("pointerdown", listener)
		}
	}, [handlePointerDown])

	const shellStyles = useMemo<React.CSSProperties>(
		() => ({
			position: "fixed",
			top: 0,
			right: 0,
			bottom: 0,
			width: layout.width,
			maxWidth: PANEL_MAX_WIDTH,
			minWidth: Math.min(layout.width, PANEL_MIN_WIDTH),
			background: "#ffffff",
			boxShadow: "-18px 0 40px rgba(15, 23, 42, 0.18)",
			borderLeft: "1px solid #e2e8f0",
			display: "flex",
			flexDirection: "column",
			zIndex: 2147483646,
			transition: isDragging ? "none" : "width 200ms ease"
		}),
		[layout.width, isDragging]
	)

	const resizerStyles = useMemo<React.CSSProperties>(
		() => ({
			position: "absolute",
			top: 0,
			left: -6,
			bottom: 0,
			width: 12,
			cursor: "col-resize",
			zIndex: 2147483647,
			touchAction: "none"
		}),
		[]
	)

	return (
		<aside ref={shellRef} style={shellStyles} aria-label="Prompt Manager Extension Panel" data-mode={layout.mode}>
			<div ref={resizerRef} style={resizerStyles} aria-hidden="true" />
			{/* BrandBar 占位 */}
			<header
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "12px 16px",
					borderBottom: "1px solid #e2e8f0"
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
					<div
						style={{
							width: 36,
							height: 36,
							borderRadius: 12,
							background: "linear-gradient(135deg, #3b82f6, #9333ea)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "#fff",
							fontWeight: 600,
							fontSize: 16,
							boxShadow: "0 10px 20px rgba(59, 130, 246, 0.25)"
						}}
					>
						PM
					</div>
					<div>
						<p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Prompt Manager</p>
						<p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{title}</p>
					</div>
				</div>
				<button
					type="button"
					onClick={onClose}
					title="关闭面板"
					style={{
						width: 32,
						height: 32,
						borderRadius: 10,
						background: "transparent",
						border: "1px solid rgba(148, 163, 184, 0.6)",
						color: "#475569",
						cursor: "pointer"
					}}
				>
					<span style={{ display: "block", lineHeight: "30px" }}>×</span>
				</button>
			</header>

			{/* 主体占位 */}
			<main
				style={{
					flex: 1,
					padding: 16,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "flex-start",
					gap: 8,
					fontSize: 13,
					color: "#475569"
				}}
			>
				<p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
					这是 Extension Panel（Home / Find / C-0）占位。
				</p>
				<p style={{ margin: 0 }}>
					未来这里会承载 Home（我的）、Find（发现市场）、C-0（保存/编辑页）等主工作区内容，仅用于占位验证右侧挤压式布局。
				</p>
				{children && <div style={{ marginTop: 12 }}>{children}</div>}
			</main>

			{/* Footer 占位 */}
			<footer
				style={{
					borderTop: "1px solid #e2e8f0",
					padding: "10px 16px",
					fontSize: 12,
					color: "#94a3b8",
					textAlign: "center"
				}}
			>
				Panel 壳层占位（BrandBar / Content / Footer）· 仅用于 Step 0 验证右侧挤压面板。
			</footer>
		</aside>
	)
}










