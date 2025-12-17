// plasmo content script: matches all pages
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

export const config = {
	matches: ["<all_urls>"]
}

type FabPosition = {
	x: number
	y: number
}

type DockEdge = "left" | "right" | "top" | "bottom"

type FabState =
	| {
			mode: "free"
			x: number
			y: number
	  }
	| {
			mode: "dock"
			edge: DockEdge
			offset: number // 相对于对应边的偏移：left/right 用 y，top/bottom 用 x
	  }

const FAB_SIZE = 44
const DOCK_WIDTH = 60
const SAFE_MARGIN = 12
const DOCK_MARGIN = 0
const SNAP_DISTANCE = 24
const CLICK_MOVE_TOLERANCE = 3
const STORAGE_KEY = "pm:floating_fab_pos"

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value))
}

function getViewport(): { width: number; height: number } {
	if (typeof window === "undefined") return { width: 1440, height: 900 }
	return { width: window.innerWidth, height: window.innerHeight }
}

function defaultState(): FabState {
	const { width, height } = getViewport()
	return {
		mode: "free",
		x: width - FAB_SIZE - SAFE_MARGIN,
		y: height - FAB_SIZE - SAFE_MARGIN
	}
}

export default function Fab() {
	const [state, setState] = useState<FabState>(() => defaultState())
	const [dragPos, setDragPos] = useState<FabPosition | null>(null)
	const [isDragging, setIsDragging] = useState(false)
	const [isSnapping, setIsSnapping] = useState(false)
	const pointerRef = useRef<{
		startX: number
		startY: number
		startPos: FabPosition
		moved: boolean
		width: number
		height: number
	} | null>(null)
	const rootRef = useRef<HTMLDivElement | null>(null)

	// 读取持久化位置
	useEffect(() => {
		const load = async () => {
			try {
				const stored = await chrome?.storage?.local?.get?.(STORAGE_KEY)
				const saved = stored?.[STORAGE_KEY] as FabState | undefined
				if (!saved || typeof saved !== "object") return

				const { width, height } = getViewport()
				if (saved.mode === "dock" && saved.edge) {
					const sanitized: FabState = {
						mode: "dock",
						edge: saved.edge,
						offset:
							saved.edge === "left" || saved.edge === "right"
								? clamp(saved.offset ?? SAFE_MARGIN, DOCK_MARGIN, Math.max(DOCK_MARGIN, height - FAB_SIZE - DOCK_MARGIN))
								: clamp(saved.offset ?? SAFE_MARGIN, DOCK_MARGIN, Math.max(DOCK_MARGIN, width - DOCK_WIDTH - DOCK_MARGIN))
					}
					setState(sanitized)
					return
				}

				if (saved.mode === "free") {
					setState({
						mode: "free",
						x: clamp(saved.x ?? SAFE_MARGIN, SAFE_MARGIN, Math.max(SAFE_MARGIN, width - FAB_SIZE - SAFE_MARGIN)),
						y: clamp(saved.y ?? SAFE_MARGIN, SAFE_MARGIN, Math.max(SAFE_MARGIN, height - FAB_SIZE - SAFE_MARGIN))
					})
				}
			} catch {
				// ignore storage errors
			}
		}
		load()
	}, [])

	const persistState = useCallback(async (next: FabState) => {
		try {
			await chrome?.storage?.local?.set?.({ [STORAGE_KEY]: next })
		} catch {
			// ignore storage errors
		}
	}, [])

	// 点击仍然通过 window 广播，避免与 runtime 回路造成重复 toggle
	const triggerToggle = useCallback(() => {
		window.postMessage({ type: "pm:panel:toggle" }, "*")
	}, [])

	// 保持在视口内
	const clampToViewport = useCallback(
		(candidate: FabPosition, size: { width: number; height: number }) => {
			const { width, height } = getViewport()
			return {
				x: clamp(candidate.x, SAFE_MARGIN, Math.max(SAFE_MARGIN, width - size.width - SAFE_MARGIN)),
				y: clamp(candidate.y, SAFE_MARGIN, Math.max(SAFE_MARGIN, height - size.height - SAFE_MARGIN))
			}
		},
		[]
	)

	// 视口变化时避免跑出屏幕
	useEffect(() => {
		const handleResize = () => {
			setState((prev) => {
				if (prev.mode === "dock") {
					const { width, height } = getViewport()
					const maxOffset =
						prev.edge === "left" || prev.edge === "right"
							? Math.max(DOCK_MARGIN, height - FAB_SIZE - DOCK_MARGIN)
							: Math.max(DOCK_MARGIN, width - DOCK_WIDTH - DOCK_MARGIN)
					const offset = clamp(prev.offset, DOCK_MARGIN, maxOffset)
					return { ...prev, offset }
				}
				const clamped = clampToViewport({ x: prev.x, y: prev.y }, { width: FAB_SIZE, height: FAB_SIZE })
				return { ...prev, ...clamped }
			})
		}
		window.addEventListener("resize", handleResize)
		return () => window.removeEventListener("resize", handleResize)
	}, [clampToViewport])

	// 吸附最近的边框
	const snapToEdge = useCallback((candidate: FabPosition, size: { width: number; height: number }): FabState | null => {
		const { width, height } = getViewport()
		const xMin = DOCK_MARGIN
		const xMax = Math.max(DOCK_MARGIN, width - size.width - DOCK_MARGIN)
		const yMin = DOCK_MARGIN
		const yMax = Math.max(DOCK_MARGIN, height - size.height - DOCK_MARGIN)
		const x = clamp(candidate.x, xMin, xMax)
		const y = clamp(candidate.y, yMin, yMax)

		const distLeft = x - xMin
		const distRight = xMax - x
		const distTop = y - yMin
		const distBottom = yMax - y
		const minDist = Math.min(distLeft, distRight, distTop, distBottom)

		if (minDist > SNAP_DISTANCE) return null

		if (minDist === distLeft) {
			return { mode: "dock", edge: "left", offset: y }
		}
		if (minDist === distRight) {
			return { mode: "dock", edge: "right", offset: y }
		}
		if (minDist === distTop) {
			return { mode: "dock", edge: "top", offset: x }
		}
		return { mode: "dock", edge: "bottom", offset: x }
	}, [])

	const getCurrentSize = useCallback(
		(localState: FabState, isDraggingNow: boolean) => {
			if (isDraggingNow) {
				// 拖拽时用当前形态的尺寸，避免跳变
				return {
					width: localState.mode === "dock" ? DOCK_WIDTH : FAB_SIZE,
					height: FAB_SIZE
				}
			}
			return {
				width: localState.mode === "dock" ? DOCK_WIDTH : FAB_SIZE,
				height: FAB_SIZE
			}
		},
		[]
	)

	const getCurrentPosition = useCallback(
		(localState: FabState) => {
			const size = getCurrentSize(localState, false)
			if (localState.mode === "dock") {
				const { width, height } = getViewport()
				switch (localState.edge) {
					case "left":
						return {
							x: DOCK_MARGIN,
							y: clamp(localState.offset, DOCK_MARGIN, Math.max(DOCK_MARGIN, height - size.height - DOCK_MARGIN))
						}
					case "right":
						return {
							x: Math.max(DOCK_MARGIN, width - size.width - DOCK_MARGIN),
							y: clamp(localState.offset, DOCK_MARGIN, Math.max(DOCK_MARGIN, height - size.height - DOCK_MARGIN))
						}
					case "top":
						return {
							x: clamp(localState.offset, DOCK_MARGIN, Math.max(DOCK_MARGIN, width - size.width - DOCK_MARGIN)),
							y: DOCK_MARGIN
						}
					case "bottom":
						return {
							x: clamp(localState.offset, DOCK_MARGIN, Math.max(DOCK_MARGIN, width - size.width - DOCK_MARGIN)),
							y: Math.max(DOCK_MARGIN, height - size.height - DOCK_MARGIN)
						}
					default:
						return { x: SAFE_MARGIN, y: SAFE_MARGIN }
				}
			}
			return { x: localState.x, y: localState.y }
		},
		[getCurrentSize]
	)

	// 拖拽逻辑
	const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		if (event.button !== 0) return
		event.preventDefault()

		const target = rootRef.current
		if (!target) return

		const currentPos = dragPos ?? getCurrentPosition(state)
		const size = getCurrentSize(state, true)
		pointerRef.current = {
			startX: event.clientX,
			startY: event.clientY,
			startPos: currentPos,
			moved: false,
			width: size.width,
			height: size.height
		}
		setIsDragging(true)
		setDragPos(currentPos)
		target.setPointerCapture(event.pointerId)
	}, [dragPos, getCurrentPosition, getCurrentSize, state])

	useEffect(() => {
		const handlePointerMove = (event: PointerEvent) => {
			if (!pointerRef.current) return
			event.preventDefault()
			const { startX, startY, startPos, width, height } = pointerRef.current
			const next: FabPosition = clampToViewport(
				{
					x: startPos.x + (event.clientX - startX),
					y: startPos.y + (event.clientY - startY)
				},
				{ width, height }
			)
			if (Math.abs(event.clientX - startX) > CLICK_MOVE_TOLERANCE || Math.abs(event.clientY - startY) > CLICK_MOVE_TOLERANCE) {
				pointerRef.current.moved = true
			}
			setDragPos(next)
		}

		const handlePointerUp = (event: PointerEvent) => {
			if (!pointerRef.current) return
			const { moved, width, height } = pointerRef.current
			pointerRef.current = null
			setIsDragging(false)

			if (!dragPos) {
				if (!moved) triggerToggle()
				return
			}

			if (!moved) {
				triggerToggle()
				setDragPos(null)
				return
			}

			const snapped = snapToEdge(dragPos, { width, height })
			if (snapped) {
				setState(snapped)
				setDragPos(null)
				void persistState(snapped)
				setIsSnapping(true)
				window.setTimeout(() => setIsSnapping(false), 220)
				return
			}

			const freePos = clampToViewport(dragPos, { width: FAB_SIZE, height: FAB_SIZE })
			const nextState: FabState = { mode: "free", ...freePos }
			setState(nextState)
			setDragPos(null)
			void persistState(nextState)
		}

		window.addEventListener("pointermove", handlePointerMove)
		window.addEventListener("pointerup", handlePointerUp)
		return () => {
			window.removeEventListener("pointermove", handlePointerMove)
			window.removeEventListener("pointerup", handlePointerUp)
		}
	}, [clampToViewport, dragPos, persistState, snapToEdge, triggerToggle])

	const style = useMemo<React.CSSProperties>(() => {
		const size = state.mode === "dock" ? { width: DOCK_WIDTH, height: FAB_SIZE } : { width: FAB_SIZE, height: FAB_SIZE }
		const current = dragPos ?? getCurrentPosition(state)

		const docked = state.mode === "dock"
		const borderRadius =
			!docked
				? 9999
				: state.edge === "left"
					? "0 14px 14px 0"
					: state.edge === "right"
						? "14px 0 0 14px"
						: state.edge === "top"
							? "0 0 14px 14px"
							: "14px 14px 0 0"

		return {
			position: "fixed",
			left: current.x,
			top: current.y,
			zIndex: 2147483647,
			width: size.width,
			height: size.height,
			borderRadius,
			background: "linear-gradient(135deg, #2563eb, #4338ca)",
			color: "#fff",
			fontSize: 12,
			fontWeight: 600,
			letterSpacing: 0.2,
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			boxShadow: docked ? "0 8px 20px rgba(37, 99, 235, 0.2)" : "0 12px 30px rgba(37, 99, 235, 0.28)",
			cursor: isDragging ? "grabbing" : "grab",
			userSelect: "none",
			touchAction: "none",
			opacity: isDragging ? 0.9 : 1,
			transition: isDragging
				? "none"
				: "left 180ms cubic-bezier(0.24, 0.8, 0.32, 1), top 180ms cubic-bezier(0.24, 0.8, 0.32, 1), box-shadow 140ms ease, transform 180ms cubic-bezier(0.2, 0.8, 0.3, 1)",
			transform: isDragging ? "scale(0.98)" : isSnapping ? "scale(1.02)" : "translateZ(0)",
			willChange: isDragging ? "left, top, transform" : undefined
		}
	}, [dragPos, getCurrentPosition, state, isDragging, isSnapping])

	useEffect(() => {
		// 将后台通过 runtime 发送到本页的消息，桥接为 window.postMessage
		// 避免 Service Worker 休眠或 runtime 通道偶发失效导致的“点击无反应”
		const onRuntimeMessage = (msg: any) => {
			try {
				if (!msg || typeof msg !== "object") return
				// 避免把 panel 的 toggle 再次转发，造成重复 toggle
				if (msg.type === "pm:panel:toggle") return
				window.postMessage(msg, "*")
			} catch {}
		}
		try {
			chrome?.runtime?.onMessage?.addListener(onRuntimeMessage)
		} catch {}
		return () => {
			try {
				chrome?.runtime?.onMessage?.removeListener?.(onRuntimeMessage)
			} catch {}
		}
	}, [])

	return (
		<div
			ref={rootRef}
			style={style}
			onPointerDown={handlePointerDown}
			title="打开 Prompt Manager"
			aria-label="打开 Prompt Manager"
		>
			PM
		</div>
	)
}


