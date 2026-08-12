import { useEffect, useRef, type ReactNode } from "react"
import { Button } from "./Button"

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  isConfirming?: boolean
  confirmingLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isConfirming = false,
  confirmingLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // showModal() gives us the focus trap, Escape handling and backdrop for free.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!isConfirming) onCancel()
      }}
      className="m-auto w-[calc(100%-3rem)] max-w-md rounded-2xl border border-border bg-card p-6 text-foreground backdrop:bg-black/70"
    >
      <h2 id="confirm-dialog-title" className="text-lg font-semibold mb-2">
        {title}
      </h2>
      <div className="text-sm text-muted leading-relaxed">{description}</div>

      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={isConfirming}
        >
          {cancelLabel}
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          isLoading={isConfirming}
          loadingText={confirmingLabel}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
