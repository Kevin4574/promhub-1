const PROD_WEBAPP_ORIGIN = "https://promptmanna.app"
const DEV_WEBAPP_ORIGIN = "http://localhost:3000"

type RuntimeEnv = {
	PLASMO_PUBLIC_WEBAPP_ORIGIN?: string
	NODE_ENV?: string
}

function readRuntimeEnv(): RuntimeEnv {
	if (typeof globalThis === "undefined") {
		return {}
	}
	const maybeProcess = (globalThis as { process?: { env?: RuntimeEnv } }).process
	return maybeProcess?.env ?? {}
}

export function getWebAppOrigin(): string {
	const env = readRuntimeEnv()
	const envOrigin = env.PLASMO_PUBLIC_WEBAPP_ORIGIN
	if (envOrigin && envOrigin.trim().length > 0) {
		return envOrigin
	}
	if (env.NODE_ENV !== "production") {
		return DEV_WEBAPP_ORIGIN
	}
	return PROD_WEBAPP_ORIGIN
}

