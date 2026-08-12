import { useState, type ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/auth-context"
import { useToast } from "../context/toast-context"
import { Button } from "../components/ui/Button"
import {
  AlertTriangle,
  Calendar,
  Dumbbell,
  RefreshCcw,
  Target,
  TrendingUp,
} from "lucide-react"
import { Card } from "../components/ui/Card"
import { Skeleton } from "../components/ui/Skeleton"
import { ConfirmDialog } from "../components/ui/ConfirmDialog"
import { PlanDisplay } from "../components/plan/PlanDisplay"

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">{children}</div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <PageShell>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-11 w-44 rounded-xl" />
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-28 rounded-2xl mb-8" />
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="space-y-6">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-56 rounded-2xl" />
        ))}
      </div>
    </PageShell>
  )
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function Profile() {
  const {
    user,
    isLoading,
    plan,
    planError,
    generatePlan,
    isGeneratingPlan,
    refreshData,
  } = useAuth()
  const { showToast } = useToast()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  async function handleRetry() {
    setIsRetrying(true)
    try {
      await refreshData()
    } finally {
      setIsRetrying(false)
    }
  }

  async function handleRegenerate() {
    try {
      await generatePlan()
      showToast("Your plan has been regenerated.", "success")
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to regenerate plan.",
        "error",
      )
    } finally {
      setIsConfirmOpen(false)
    }
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" replace />
  }

  if (planError) {
    return (
      <PageShell>
        <Card variant="bordered" className="text-center py-16">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">
            We couldn&apos;t load your plan
          </h1>
          <p className="text-muted text-sm mb-6">{planError}</p>
          <Button
            onClick={handleRetry}
            isLoading={isRetrying}
            loadingText="Retrying..."
          >
            <RefreshCcw className="w-4 h-4" />
            Try again
          </Button>
        </Card>
      </PageShell>
    )
  }

  if (!plan) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <PageShell>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Your Training Plan</h1>
          <p className="text-muted">
            Version {plan.version} &middot; Created {formatDate(plan.createdAt)}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setIsConfirmOpen(true)}
          isLoading={isGeneratingPlan}
          loadingText="Generating..."
        >
          <RefreshCcw className="w-4 h-4" />
          Regenerate Plan
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card variant="bordered" className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <Target className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-muted text-xs">Goal</p>
            <p className="font-medium text-sm">{plan.overview.goal}</p>
          </div>
        </Card>

        <Card variant="bordered" className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-muted text-xs">Frequency</p>
            <p className="font-medium text-sm">{plan.overview.frequency}</p>
          </div>
        </Card>

        <Card variant="bordered" className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-muted text-xs">Split</p>
            <p className="font-medium text-sm">{plan.overview.split}</p>
          </div>
        </Card>

        <Card variant="bordered" className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-muted text-xs">Version</p>
            <p className="font-medium text-sm">{plan.version}</p>
          </div>
        </Card>
      </div>

      <Card variant="bordered" className="mb-8">
        <h2 className="font-semibold text-lg mb-2">Program notes</h2>
        <p className="text-muted text-sm leading-relaxed">
          {plan.overview.notes}
        </p>
      </Card>

      <h2 className="font-semibold text-xl mb-4">Weekly Schedule</h2>
      <PlanDisplay weeklySchedule={plan.weeklySchedule} />

      <Card variant="bordered" className="mb-8">
        <h2 className="font-semibold text-lg mb-2">Progression Strategy</h2>
        <p className="text-muted text-sm leading-relaxed">{plan.progression}</p>
      </Card>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Regenerate your plan?"
        description={`This builds a new plan from your current preferences and replaces the one you're looking at. You are on version ${plan.version}.`}
        confirmLabel="Regenerate"
        confirmingLabel="Generating..."
        isConfirming={isGeneratingPlan}
        onConfirm={handleRegenerate}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </PageShell>
  )
}
