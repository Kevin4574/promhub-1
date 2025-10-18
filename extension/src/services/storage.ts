const isChromeStorageAvailable = typeof chrome !== "undefined" && !!chrome.storage && !!chrome.storage.local

const memoryStore = new Map<string, unknown>()
const memorySubscribers = new Map<string, Set<(value: unknown) => void>>()

type Subscriber<T> = (value: T | undefined) => void

function getChromeStorage() {
	if (!isChromeStorageAvailable) {
		return null
	}
	return chrome.storage.local
}

export async function storageGet<T>(key: string): Promise<T | undefined> {
	const chromeStorage = getChromeStorage()
	if (!chromeStorage) {
		return memoryStore.get(key) as T | undefined
	}
	return new Promise<T | undefined>((resolve, reject) => {
		chromeStorage.get([key], (result) => {
			if (chrome.runtime?.lastError) {
				reject(new Error(chrome.runtime.lastError.message))
				return
			}
			resolve(result[key] as T | undefined)
		})
	})
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
	const chromeStorage = getChromeStorage()
	if (!chromeStorage) {
		memoryStore.set(key, value)
		notifyMemorySubscribers(key, value)
		return
	}
	return new Promise<void>((resolve, reject) => {
		chromeStorage.set({ [key]: value }, () => {
			if (chrome.runtime?.lastError) {
				reject(new Error(chrome.runtime.lastError.message))
				return
			}
			resolve()
		})
	})
}

export async function storageRemove(key: string): Promise<void> {
	const chromeStorage = getChromeStorage()
	if (!chromeStorage) {
		memoryStore.delete(key)
		notifyMemorySubscribers(key, undefined)
		return
	}
	return new Promise<void>((resolve, reject) => {
		chromeStorage.remove(key, () => {
			if (chrome.runtime?.lastError) {
				reject(new Error(chrome.runtime.lastError.message))
				return
			}
			resolve()
		})
	})
}

function notifyMemorySubscribers(key: string, value: unknown) {
	const subscribers = memorySubscribers.get(key)
	if (!subscribers) {
		return
	}
	subscribers.forEach((callback) => {
		try {
			callback(value)
		} catch (error) {
			console.error(error)
		}
	})
}

export function storageSubscribe<T>(key: string, callback: Subscriber<T>): () => void {
	const chromeStorage = getChromeStorage()
	if (!chromeStorage) {
		let subscribers = memorySubscribers.get(key)
		if (!subscribers) {
			subscribers = new Set<(value: unknown) => void>()
			memorySubscribers.set(key, subscribers)
		}
		const handler = (value: unknown) => callback(value as T | undefined)
		subscribers.add(handler)
		return () => {
			subscribers?.delete(handler)
		}
	}

	const handleChange = (
		changes: Record<string, chrome.storage.StorageChange>,
		areaName: "sync" | "local" | "managed" | "session"
	) => {
		if (areaName !== "local") {
			return
		}
		if (!Object.prototype.hasOwnProperty.call(changes, key)) {
			return
		}
		callback(changes[key].newValue as T | undefined)
	}

	chrome.storage.onChanged.addListener(handleChange)
	return () => {
		chrome.storage.onChanged.removeListener(handleChange)
	}
}

export const storageKeys = {
	session: "pm.auth.session",
	showFab: "pm.settings.showFab",
	localCount: "pm.stats.localCount"
} as const

export type StorageKey = (typeof storageKeys)[keyof typeof storageKeys]
