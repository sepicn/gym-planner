import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/auth-context"
import { Card } from "../components/ui/Card"
import { Select } from "../components/ui/Select"
import { Textarea } from "../components/ui/Textarea"
import { Button } from "../components/ui/Button"
import { Skeleton } from "../components/ui/Skeleton"
import { ArrowRight, Loader2 } from "lucide-react"
import type { UserProfile } from "../types"

const goalOptions = [
  { value: "bulk", label: "Build Muscle (Bulk)" },
  { value: "cut", label: "Lose fat (Cut)" },
  { value: "recomp", label: "Body Recomposition" },
  { value: "strength", label: "Build Strength" },
  { value: "endurance", label: "Improve Endurance" },
]

const experienceOptions = [
  { value: "beginner", label: "Beginner (0-1 years)" },
  { value: "intermediate", label: "Intermediate (1-3 years)" },
  { value: "advanced", label: "Advanced (3+ years)" },
]

const daysOptions = [
  { value: "2", label: "2 days per week" },
  { value: "3", label: "3 days per week" },
  { value: "4", label: "4 days per week" },
  { value: "5", label: "5 days per week" },
  { value: "6", label: "6 days per week" },
]

const sessionOptions = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
  { value: "90", label: "90 minutes" },
]

const equipmentOptions = [
  { value: "full_gym", label: "Full Gym Access" },
  { value: "home", label: "Home Gym" },
  { value: "dumbbells", label: "Dumbbells Only" },
]

const splitOptions = [
  { value: "full_body", label: "Full Body" },
  { value: "upper_lower", label: "Upper/Lower Split" },
  { value: "ppl", label: "Push/Pull/Legs" },
  { value: "custom", label: "Let AI Decide" },
]

const DEFAULTS = {
  goal: "bulk",
  experience: "intermediate",
  daysPerWeek: "4",
  sessionLength: "60",
  equipment: "full_gym",
  injuries: "",
  preferredSplit: "upper_lower",
}

function toFormData(profile: UserProfile | null) {
  if (!profile) return DEFAULTS

  return {
    goal: profile.goal,
    experience: profile.experience,
    daysPerWeek: String(profile.daysPerWeek),
    sessionLength: String(profile.sessionLength),
    equipment: profile.equipment,
    injuries: profile.injuries ?? "",
    preferredSplit: profile.preferredSplit,
  }
}

export default function Onboarding() {
  const { profile, isLoading } = useAuth()

  // The form is a separate component so it only mounts once the profile is
  // known, seeding its state directly instead of syncing through an effect.
  if (isLoading || profile === undefined) {
    return <OnboardingSkeleton />
  }

  return <PreferencesForm initialProfile={profile} />
}

function OnboardingSkeleton() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-xl mx-auto">
        <Card variant="bordered" className="space-y-5">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
          <Skeleton className="h-11 rounded-xl" />
        </Card>
      </div>
    </div>
  )
}

function PreferencesForm({
  initialProfile,
}: {
  initialProfile: UserProfile | null
}) {
  const { saveProfile, generatePlan, isGeneratingPlan } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState(() => toFormData(initialProfile))
  const navigate = useNavigate()

  const isEditing = initialProfile !== null

  function updateForm(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleQuestionnaire(e: React.SubmitEvent) {
    e.preventDefault()
    if (isSubmitting) return

    setError("")
    setIsSubmitting(true)

    const profile: Omit<UserProfile, "userId" | "updatedAt"> = {
      goal: formData.goal as UserProfile["goal"],
      experience: formData.experience as UserProfile["experience"],
      daysPerWeek: parseInt(formData.daysPerWeek),
      sessionLength: parseInt(formData.sessionLength),
      equipment: formData.equipment as UserProfile["equipment"],
      injuries: formData.injuries || undefined,
      preferredSplit: formData.preferredSplit as UserProfile["preferredSplit"],
    }

    try {
      await saveProfile(profile)
      await generatePlan()
      navigate("/profile")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create your plan.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-xl mx-auto">
        {!isSubmitting ? (
          <Card variant="bordered">
            <h1 className="text-2xl font-bold mb-2">
              {isEditing ? "Edit your preferences" : "Tell Us About Yourself"}
            </h1>
            <p className="text-muted mb-6">
              {isEditing
                ? "Saving builds a new version of your plan from these answers."
                : "Help us create the perfect plan for you."}
            </p>

            <form className="space-y-5" onSubmit={handleQuestionnaire}>
              <Select
                id="goal"
                label="What's your primary goal?"
                options={goalOptions}
                value={formData.goal}
                onChange={(e) => updateForm("goal", e.target.value)}
              />
              <Select
                id="experience"
                label="Training experience"
                options={experienceOptions}
                value={formData.experience}
                onChange={(e) => updateForm("experience", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  id="daysPerWeek"
                  label="Days per week"
                  options={daysOptions}
                  value={formData.daysPerWeek}
                  onChange={(e) => updateForm("daysPerWeek", e.target.value)}
                />
                <Select
                  id="sessionLength"
                  label="Session length"
                  options={sessionOptions}
                  value={formData.sessionLength}
                  onChange={(e) => updateForm("sessionLength", e.target.value)}
                />
              </div>
              <Select
                id="equipment"
                label="Equipment access"
                options={equipmentOptions}
                value={formData.equipment}
                onChange={(e) => updateForm("equipment", e.target.value)}
              />

              <Select
                id="preferredSplit"
                label="Preferred training split"
                options={splitOptions}
                value={formData.preferredSplit}
                onChange={(e) => updateForm("preferredSplit", e.target.value)}
              />

              <Textarea
                id="injuries"
                label="Any injuries or limitations? (optional)"
                placeholder="E.g., lower back issues, shoulder impingement..."
                rows={3}
                value={formData.injuries}
                onChange={(e) => updateForm("injuries", e.target.value)}
              />
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                {isEditing && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate("/profile")}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isSubmitting}
                  loadingText="Working..."
                >
                  {isEditing ? "Save & Regenerate" : "Generate My Plan"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <Card variant="bordered" className="text-center py-16">
            <Loader2 className="w-12 h-12 text-accent mx-auto mb-6 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">
              {isGeneratingPlan ? "Creating your plan" : "Saving your answers"}
            </h1>
            <p className="text-muted">
              {isGeneratingPlan
                ? "Our AI is building your personalized training program..."
                : "Just a moment."}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
