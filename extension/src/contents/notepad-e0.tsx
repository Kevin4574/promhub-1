// plasmo content script: matches all pages
import React, { useEffect, useState } from "react"

export const config = {
	matches: ["<all_urls>"]
}

export default function NotepadE0() {
	const [open, setOpen] = useState(false)

	useEffect(() => {
		const handler = (e: MessageEvent) => {
			if (e.data?.type === "pm:notepad:open") setOpen(true)
			if (e.data?.type === "pm:notepad:close") setOpen(false)
		}
		window.addEventListener("message", handler)

		const onRuntimeMessage = (msg: any) => {
			if (msg?.type === "pm:notepad:open") setOpen(true)
			if (msg?.type === "pm:notepad:close") setOpen(false)
		}
		try {
			chrome?.runtime?.onMessage?.addListener(onRuntimeMessage)
		} catch {}

		return () => {
			window.removeEventListener("message", handler)
			try {
				chrome?.runtime?.onMessage?.removeListener?.(onRuntimeMessage)
			} catch {}
		}
	}, [])

	if (!open) return null

	return (
		<div style={{ position: "fixed", inset: 0, zIndex: 2147483646, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
			<div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", width: 560, maxWidth: "95vw", padding: 24, fontSize: 14 }}>
				这是 Notepad 占位
				<div style={{ marginTop: 16 }}>
					<button style={{ padding: "6px 12px", fontSize: 12, background: "#111827", color: "#fff", borderRadius: 6 }} onClick={() => setOpen(false)}>
						关闭
					</button>
				</div>
			</div>
		</div>
	)
}



