// plasmo content script: matches all pages
import React, { useEffect, useState } from "react"
import PanelShellPlaceholder from "../components/panel/PanelShellPlaceholder"

export const config = {
	matches: ["<all_urls>"]
}

export default function PanelContent() {
	const [open, setOpen] = useState(false)

	useEffect(() => {
		const handler = (e: MessageEvent) => {
			if (typeof e.data !== "object" || !e.data) return
			if (e.data.type === "pm:panel:toggle") {
				setOpen((v) => !v)
			}
		}
		window.addEventListener("message", handler)

		const onRuntimeMessage = (msg: any) => {
			if (msg?.type === "pm:panel:toggle") setOpen((v: boolean) => !v)
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

	useEffect(() => {
		if (!open) return
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpen(false)
			}
		}
		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [open])

	if (!open) return null

	return (
		<PanelShellPlaceholder title="Extension Panel（Home/Find/C-0）占位" onClose={() => setOpen(false)}>
			<div>这是 Extension Panel（Home/Find/C-0）占位。</div>
		</PanelShellPlaceholder>
	)
}



