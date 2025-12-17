"use client"

import type { ReadonlyURLSearchParams } from "next/navigation"

export type AuthMode = "login" | "register"

export interface MockAuthOptions {
  email: string
  nickname?: string
  mode: AuthMode
  searchParams: ReadonlyURLSearchParams
}

export interface MockAuthResult {
  session: MockSession
  bridged: boolean
}

export interface MockSession {
  email: string
  nickname: string
  tier: string
  promptCount: number
  favoriteCount: number
  joinedAt: number
  lastLoginAt: number
  lastSyncAt: number
  accessToken: string
  refreshToken: string
  tokenType: string
  issuedAt: number
  expiresAt: number
}

export function buildRelayQuery(searchParams: ReadonlyURLSearchParams | null): string {
  if (!searchParams) {
    return ""
  }
  const entries = Array.from(searchParams.entries())
  if (entries.length === 0) {
    return ""
  }
  const query = new URLSearchParams(entries)
  return `?${query.toString()}`
}

export async function completeMockAuthFlow({ email, nickname, mode, searchParams }: MockAuthOptions): Promise<MockAuthResult> {
  const now = Date.now()
  const accessToken = `mock-access-${now}`
  const refreshToken = `mock-refresh-${now}`
  const session: MockSession = {
    email,
    nickname: nickname ?? deriveNickname(email),
    tier: mode === "register" ? "Free" : "Pro",
    promptCount: mode === "register" ? 0 : 128,
    favoriteCount: mode === "register" ? 0 : 34,
    joinedAt: mode === "register" ? now : now - 1000 * 60 * 60 * 24 * 45,
    lastLoginAt: now,
    lastSyncAt: now,
    accessToken,
    refreshToken,
    tokenType: "bearer",
    issuedAt: now,
    expiresAt: now + 3600 * 1000
  }

  persistMockSiteSession(session)

  if (shouldRelayViaPostMessage(searchParams)) {
    await relaySessionViaPostMessage({
      session,
      mode,
      state: searchParams.get("state") ?? "",
      relayOrigin: searchParams.get("relay_origin") ?? ""
    })
    return { session, bridged: true }
  }

  const redirectUri = searchParams.get("redirect_uri")
  if (redirectUri) {
    performLegacyRedirect({
      redirectUri,
      mode,
      state: searchParams.get("state") ?? "",
      accessToken,
      refreshToken,
      session
    })
  }

  return { session, bridged: false }
}

function shouldRelayViaPostMessage(searchParams: ReadonlyURLSearchParams): boolean {
  return searchParams.get("relay") === "postmessage"
}

function performLegacyRedirect({
  redirectUri,
  mode,
  state,
  accessToken,
  refreshToken,
  session
}: {
  redirectUri: string
  mode: AuthMode
  state: string
  accessToken: string
  refreshToken: string
  session: MockSession
}) {
  const redirect = new URL(redirectUri)
  const hash = new URLSearchParams()
  hash.set("mode", mode)
  hash.set("access_token", accessToken)
  hash.set("refresh_token", refreshToken)
  hash.set("token_type", "bearer")
  hash.set("expires_in", String(3600))
  if (state) {
    hash.set("state", state)
  }
  hash.set("session", btoa(encodeURIComponent(JSON.stringify(session))))
  window.location.href = `${redirect.toString()}#${hash.toString()}`
}

async function relaySessionViaPostMessage({
  session,
  mode,
  state,
  relayOrigin
}: {
  session: MockSession
  mode: AuthMode
  state: string
  relayOrigin: string
}) {
  if (typeof window === "undefined") {
    throw new Error("window_not_ready")
  }
  if (!state) {
    throw new Error("missing_state")
  }
  const targetWindow = window.opener ?? null
  if (!targetWindow) {
    throw new Error("missing_opener")
  }
  const targetOrigin = relayOrigin?.length ? relayOrigin : window.origin
  const payload = {
    type: "pm:auth:bridge" as const,
    ok: true,
    state,
    mode,
    session
  }
  targetWindow.postMessage(payload, targetOrigin)
  window.setTimeout(() => {
    try {
      window.close()
    } catch {
      // ignore
    }
  }, 50)
}

function persistMockSiteSession(session: MockSession) {
  if (typeof window === "undefined") {
    return
  }
  try {
    window.localStorage.setItem("pm:mock:session", JSON.stringify(session))
  } catch {
    // ignore storage errors
  }
}

function deriveNickname(value: string) {
  const [name] = value.split("@")
  return name || "user"
}

