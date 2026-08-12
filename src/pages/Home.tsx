import { Link, Navigate } from "react-router-dom"
import { Brain, Dumbbell, LineChart, ShieldCheck } from "lucide-react"
import { useAuth } from "../context/auth-context"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"

const features = [
  {
    icon: Brain,
    title: "Built around your answers",
    description:
      "Goal, experience, equipment and time per session all shape the program you get.",
  },
  {
    icon: Dumbbell,
    title: "Sets, reps, rest and RPE",
    description:
      "Every exercise comes with prescribed load targets and alternatives you can swap in.",
  },
  {
    icon: LineChart,
    title: "A progression strategy",
    description:
      "Not just a workout list - clear rules for when and how to add weight.",
  },
  {
    icon: ShieldCheck,
    title: "Works around injuries",
    description:
      "Tell it what hurts and it avoids the movements that would aggravate it.",
  },
]

export default function Home() {
  const { user, isSessionLoading } = useAuth()

  if (isSessionLoading) {
    return null
  }

  if (user) {
    return <Navigate to="/profile" replace />
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <section className="max-w-3xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted mb-6">
          <Dumbbell className="w-3.5 h-3.5 text-accent" />
          AI training programs
        </span>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">
          A training plan that fits{" "}
          <span className="text-accent">your week</span>
        </h1>

        <p className="text-muted text-lg leading-relaxed max-w-xl mx-auto mb-9">
          Answer six questions and get a complete weekly program: exercises,
          sets, reps, rest, RPE and how to progress. Adjust it whenever your
          schedule or goals change.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/auth/sign-up">
            <Button size="lg" className="w-full sm:w-auto">
              Build my plan
            </Button>
          </Link>
          <Link to="/auth/sign-in">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-4 mt-20">
        {features.map(({ icon: Icon, title, description }) => (
          <Card key={title} variant="bordered">
            <Icon className="w-5 h-5 text-accent mb-3" />
            <h2 className="font-semibold mb-1.5">{title}</h2>
            <p className="text-muted text-sm leading-relaxed">{description}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
