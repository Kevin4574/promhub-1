// plasmo content script: matches all pages
import React, { useCallback, useEffect } from "react"

export const config = {
	matches: ["<all_urls>"]
}

export default function Fab() {
const onClick = useCallback(() => {
    // 仅通过 window 广播，避免与 runtime 回路造成重复 toggle
    window.postMessage({ type: "pm:panel:toggle" }, "*")
}, [])

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
			style={{
				position: "fixed",
				bottom: 24,
				right: 24,
				zIndex: 2147483647,
				width: 56,
				height: 56,
				borderRadius: 9999,
				background: "#2563eb",
				color: "#fff",
				fontSize: 12,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
				cursor: "pointer",
				userSelect: "none"
			}}
			onClick={onClick}
			title="FAB 占位"
		>
			FAB 占位
		</div>
	)
}


