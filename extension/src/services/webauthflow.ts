"use client"

import { getWebAppOrigin } from "../config"
import { saveSession, type AuthSession } from "./auth"
import { warmupAuthOrigin } from "./auth-warmup"

export type AuthFlowMode = "login" | "register"

type AuthBridgeMessage =
	| {
			type: "pm:auth:bridge"
			ok: true
			state?: string
			session: AuthSession
	  }
	| {
			type: "pm:auth:bridge"
			ok: false
			state?: string
			error?: string
	  }

const WEBAPP_ORIGIN = getWebAppOrigin()
const AUTH_WINDOW_NAME = "promptmanna-auth"
const AUTH_WINDOW_FEATURES =
	"popup=yes,width=686,height=608,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes"
const AUTH_TIMEOUT_MS = 120_000
const WINDOW_CLOSE_POLL_MS = 400

export async function startAuthFlow(mode: AuthFlowMode): Promise<void> {
	if (typeof window === "undefined") {
		openFallbackTab(mode)
		return
	}

	void warmupAuthOrigin()

	const state = createAuthState()
	const relayOrigin = window.location.origin
	const authUrl = buildAuthUrl(mode, state, relayOrigin)

	await new Promise<void>((resolve, reject) => {
		const authWindow = window.open(authUrl, AUTH_WINDOW_NAME, AUTH_WINDOW_FEATURES)
		if (!authWindow) {
			reject(new Error("无法打开登录窗口，请检查浏览器的弹窗拦截设置。"))
			return
		}

		let timeoutId: number | null = null
		let pollId: number | null = null

		const cleanup = () => {
			window.removeEventListener("message", handleMessage)
			if (timeoutId !== null) {
				window.clearTimeout(timeoutId)
				timeoutId = null
			}
			if (pollId !== null) {
				window.clearInterval(pollId)
				pollId = null
			}
		}

		const finishWithError = (message: string) => {
			cleanup()
			try {
				authWindow.close()
			} catch {}
			reject(new Error(message))
		}

		const handleMessage = (event: MessageEvent<AuthBridgeMessage>) => {
			if (event.origin !== WEBAPP_ORIGIN) {
				return
			}
			const payload = event.data
			if (!payload || typeof payload !== "object" || payload.type !== "pm:auth:bridge") {
				return
			}
			if (!payload.state || payload.state !== state) {
				console.warn("[auth] 忽略 state 不匹配的登录消息")
				return
			}

			cleanup()

			if (!payload.ok) {
				reject(new Error(payload.error || "登录失败，请稍后重试"))
				return
			}

			const session = payload.session
			if (!session?.email || !session?.accessToken) {
				reject(new Error("登录结果缺少必要的会话信息"))
				return
			}

			saveSession(session)
				.then(() => {
					try {
						authWindow.close()
					} catch {}
					resolve()
				})
				.catch((error) => {
					reject(error instanceof Error ? error : new Error("无法保存登录状态"))
				})
		}

		window.addEventListener("message", handleMessage)

		timeoutId = window.setTimeout(() => {
			finishWithError("登录超时，请重新发起登录。")
		}, AUTH_TIMEOUT_MS)

		pollId = window.setInterval(() => {
			if (authWindow.closed) {
				finishWithError("登录窗口已关闭，未能完成登录。")
			}
		}, WINDOW_CLOSE_POLL_MS)
	})
}

function openFallbackTab(mode: AuthFlowMode) {
	const targetPath = mode === "login" ? "/auth/login" : "/auth/register"
	const url = `${WEBAPP_ORIGIN}${targetPath}`
	if (typeof window !== "undefined") {
		window.open(url, "_blank", "noopener,noreferrer")
		return
}
	try {
		chrome.tabs?.create?.({ url })
	} catch {
		// ignore fallback failure
	}
}

function buildAuthUrl(mode: AuthFlowMode, state: string, relayOrigin: string): string {
	const path = mode === "login" ? "/auth/login" : "/auth/register"
	const url = new URL(path, WEBAPP_ORIGIN)
	url.searchParams.set("client", "extension")
	url.searchParams.set("mode", mode)
	url.searchParams.set("relay", "postmessage")
	url.searchParams.set("relay_origin", relayOrigin)
	url.searchParams.set("state", state)
	return url.toString()
}

function createAuthState() {
	const buffer = new Uint8Array(16)
	crypto.getRandomValues(buffer)
	return Array.from(buffer, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

