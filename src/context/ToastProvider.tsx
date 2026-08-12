import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { CheckCircle2, X, XCircle } from "lucide-react"
import { ToastContext, type Toast, type ToastVariant } from "./toast-context"

const DISMISS_AFTER_MS = 6000

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextIdRef = useRef(0)
  const timeoutsRef = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    const timeout = timeoutsRef.current.get(id)
    if (timeout !== undefined) {
      window.clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "error") => {
      const id = nextIdRef.current++
      setToasts((current) => [...current, { id, message, variant }])
      timeoutsRef.current.set(
        id,
        window.setTimeout(() => dismiss(id), DISMISS_AFTER_MS),
      )
    },
    [dismiss],
  )

  useEffect(() => {
    const timeouts = timeoutsRef.current
    return () => timeouts.forEach((timeout) => window.clearTimeout(timeout))
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-60 flex w-full max-w-sm flex-col gap-2"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const Icon = toast.variant === "success" ? CheckCircle2 : XCircle
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-lg ${
                toast.variant === "success"
                  ? "border-accent/40 text-foreground"
                  : "border-red-500/40 text-foreground"
              }`}
            >
              <Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  toast.variant === "success" ? "text-accent" : "text-red-400"
                }`}
                aria-hidden="true"
              />
              <p className="flex-1 leading-relaxed">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="text-muted transition-colors hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
