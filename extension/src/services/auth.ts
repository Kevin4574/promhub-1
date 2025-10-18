import { storageGet, storageRemove, storageSet, storageSubscribe, storageKeys } from "./storage"

export type AuthTier = "Pro" | "Free"

export interface AuthSession {
	email: string
	nickname?: string
	tier?: AuthTier
	lastSyncAt?: number
}

export interface LoginPayload {
	email: string
	password: string
}

export type SessionSubscriber = (session: AuthSession | null) => void

const DEFAULT_TIER: AuthTier = "Pro"

export async function getSession(): Promise<AuthSession | null> {
	const session = await storageGet<AuthSession>(storageKeys.session)
	return session ?? null
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
	const timestamp = Date.now()
	const nickname = deriveNickname(payload.email)
	const session: AuthSession = {
		email: payload.email,
		nickname,
		tier: DEFAULT_TIER,
		lastSyncAt: timestamp
	}

	await storageSet(storageKeys.session, session)
	return session
}

export async function logout(): Promise<void> {
	await storageRemove(storageKeys.session)
}

export function subscribeSession(callback: SessionSubscriber): () => void {
	return storageSubscribe<AuthSession>(storageKeys.session, (value) => {
		callback(value ?? null)
	})
}

function deriveNickname(email: string): string {
	const [namePart] = email.split("@")
	if (!namePart) {
		return "User"
	}
	return namePart
}
