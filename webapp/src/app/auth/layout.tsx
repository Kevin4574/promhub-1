"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"

const TARGET_INNER_WIDTH = 686
const TARGET_INNER_HEIGHT = 608
const RESIZE_TOLERANCE = 6

export default function AuthLayout({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const client = searchParams?.get("client") ?? null
  const isExtensionClient = client === "extension"

  useAuthWindowSizing(client)
  const isCompact = useCompactMode()

  const surfaceClassName = useMemo(() => {
    return ["pm-auth-surface", isCompact ? "compact" : "", isExtensionClient ? "pm-auth-surface--ext" : ""]
      .filter(Boolean)
      .join(" ")
  }, [isCompact, isExtensionClient])

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f4f5fb",
        backgroundImage: "url('https://assets.monica.im/static/media/background.3bc1bbfca22beb647465.jpeg')",
        backgroundSize: isExtensionClient ? "118% auto" : "cover",
        backgroundPosition: isExtensionClient ? "center top" : "center",
        backgroundRepeat: "no-repeat",
        padding: isExtensionClient ? "12px 8px" : "32px 12px"
      }}
    >
      <div className={surfaceClassName}>{children}</div>
    </div>
  )
}

function useAuthWindowSizing(client: string | null) {

  useEffect(() => {
    if (client !== "extension") {
      return
    }
    if (typeof window === "undefined" || typeof window.resizeTo !== "function") {
      return
    }

    let rafId: number | null = null

    const adjustSize = () => {
      if (typeof window === "undefined") {
        return
      }

      const innerWidth = window.innerWidth
      const innerHeight = window.innerHeight
      if (!Number.isFinite(innerWidth) || !Number.isFinite(innerHeight)) {
        return
      }

      const widthDiff = Math.abs(innerWidth - TARGET_INNER_WIDTH)
      const heightDiff = Math.abs(innerHeight - TARGET_INNER_HEIGHT)
      if (widthDiff <= RESIZE_TOLERANCE && heightDiff <= RESIZE_TOLERANCE) {
        return
      }

      const outerWidth = window.outerWidth
      const outerHeight = window.outerHeight
      const widthDelta = Number.isFinite(outerWidth - innerWidth) ? Math.max(outerWidth - innerWidth, 0) : 0
      const heightDelta = Number.isFinite(outerHeight - innerHeight) ? Math.max(outerHeight - innerHeight, 0) : 0
      const targetOuterWidth = Math.round(TARGET_INNER_WIDTH + widthDelta)
      const targetOuterHeight = Math.round(TARGET_INNER_HEIGHT + heightDelta)

      if (!Number.isFinite(targetOuterWidth) || !Number.isFinite(targetOuterHeight)) {
        return
      }

      try {
        window.resizeTo(targetOuterWidth, targetOuterHeight)
      } catch (error) {
        console.debug("[auth] 调整登录窗口尺寸失败", error)
      }
    }

    const scheduleAdjust = () => {
      if (typeof window === "undefined") {
        return
      }

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        adjustSize()
      })
    }

    scheduleAdjust()
    const handleLoad = () => scheduleAdjust()
    window.addEventListener("load", handleLoad)

    return () => {
      window.removeEventListener("load", handleLoad)
      if (rafId !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(rafId)
        rafId = null
      }
    }
  }, [client])
}

function useCompactMode() {
  const [compact, setCompact] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const evaluate = () => {
      setCompact(window.innerHeight <= 560 || window.innerWidth <= 640)
    }

    evaluate()
    window.addEventListener("resize", evaluate)
    return () => window.removeEventListener("resize", evaluate)
  }, [])

  return compact
}

