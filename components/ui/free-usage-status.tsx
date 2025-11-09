"use client"
import { useEffect, useState } from "react"

export default function FreeUsageStatus() {
  const [usage, setUsage] = useState<{ usageCount: number; limit: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/usage/anonymous")
      .then((res) => res.json())
      .then((data) => setUsage(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (!usage) return null

  return (
    <div className="mb-2 text-sm text-slate-600 text-center">
      <span>
        استخدامك المجاني: <b>{usage.usageCount}</b> من <b>{usage.limit}</b> رمز QR
      </span>
    </div>
  )
}
