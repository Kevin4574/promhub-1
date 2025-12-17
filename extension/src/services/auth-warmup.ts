import { getWebAppOrigin } from "../config"

const WARMUP_PATHS = ["/auth/login?client=extension", "/auth/register?client=extension"]

let warmupTriggered = false
let warmupPromise: Promise<void> | null = null

async function performWarmup(): Promise<void> {
	const origin = getWebAppOrigin()
	for (const path of WARMUP_PATHS) {
		const url = new URL(path, origin)
		try {
			await fetch(url.toString(), {
				method: "GET",
				mode: "no-cors",
				cache: "no-store"
			})
		} catch (error) {
			console.debug("[auth] warmup request failed", error)
		}
	}
}

export function warmupAuthOrigin(): Promise<void> {
	if (warmupTriggered) {
		return warmupPromise ?? Promise.resolve()
	}
	warmupTriggered = true
	warmupPromise = performWarmup().finally(() => {
		warmupPromise = null
	})
	return warmupPromise
}

