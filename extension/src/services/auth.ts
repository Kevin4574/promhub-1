import { storageGet, storageRemove, storageSet, storageSubscribe, storageKeys } from "./storage"

export type AuthTier = "Pro" | "Free"

export interface AuthSession {
	email: string
	accessToken: string
	refreshToken?: string
	tokenType?: string
	expiresAt?: number
	issuedAt?: number
	nickname?: string
	tier?: AuthTier
	lastSyncAt?: number
	lastLoginAt?: number
	joinedAt?: number
	promptCount?: number
	favoriteCount?: number
}

export type SessionSubscriber = (session: AuthSession | null) => void

const DEFAULT_TIER: AuthTier = "Pro"
const DEFAULT_PROMPT_COUNT = 128
const DEFAULT_FAVORITE_COUNT = 34
const DEFAULT_JOINED_OFFSET = 1000 * 60 * 60 * 24 * 45 // ~45 days

export async function getSession(): Promise<AuthSession | null> {
	const session = await storageGet<AuthSession>(storageKeys.session)
	if (!session) {
		return null
}
	if (!session.accessToken) {
		await storageRemove(storageKeys.session)
		return null
	}
	return hydrateSession(session)
}

export async function saveSession(session: AuthSession): Promise<void> {
	const hydrated = hydrateSession(session)
	await storageSet(storageKeys.session, hydrated)
}

export async function logout(): Promise<void> {
	await storageRemove(storageKeys.session)
}

export function subscribeSession(callback: SessionSubscriber): () => void {
	return storageSubscribe<AuthSession>(storageKeys.session, (value) => {
		if (!value || !value.accessToken) {
			callback(null)
			return
		}
		callback(hydrateSession(value))
	})
}

function hydrateSession(session: AuthSession): AuthSession {
	const nickname = session.nickname ?? deriveNickname(session.email)
	const lastLoginAt = session.lastLoginAt ?? session.lastSyncAt ?? Date.now()
	const issuedAt = session.issuedAt ?? session.lastLoginAt ?? Date.now()
	const expiresAt = session.expiresAt ?? (issuedAt ? issuedAt + 1000 * 60 * 60 : undefined)
	const joinedAt = session.joinedAt ?? Math.max(lastLoginAt - DEFAULT_JOINED_OFFSET, 0)

	return {
		...session,
		nickname,
		tier: session.tier ?? DEFAULT_TIER,
		tokenType: session.tokenType ?? "bearer",
		issuedAt,
		expiresAt,
		lastLoginAt,
		lastSyncAt: session.lastSyncAt ?? lastLoginAt,
		joinedAt,
		promptCount: session.promptCount ?? DEFAULT_PROMPT_COUNT,
		favoriteCount: session.favoriteCount ?? DEFAULT_FAVORITE_COUNT
	}
}

function deriveNickname(email: string): string {
	const [namePart] = email.split("@")
	if (!namePart) {
		return "User"
	}
	return namePart
}
