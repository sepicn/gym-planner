import { useState } from "react"
import { ChevronDown, Dumbbell, Info, Repeat2 } from "lucide-react"
import type { DaySchedule, Exercise } from "../../types"
import { Card } from "../ui/Card"

function ExerciseRow({
  exercise,
  index,
}: {
  exercise: Exercise
  index: number
}) {
  const [showAlternatives, setShowAlternatives] = useState(false)
  const alternatives = exercise.alternatives ?? []

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-start gap-3">
          <span className="text-xs text-muted w-5">{index + 1}.</span>
          <div>
            <p className="font-medium">{exercise.name}</p>
            {exercise.notes && (
              <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {exercise.notes}
              </p>
            )}

            {alternatives.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAlternatives((open) => !open)}
                  aria-expanded={showAlternatives}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <Repeat2 className="w-3 h-3" />
                  {alternatives.length}{" "}
                  {alternatives.length === 1 ? "alternative" : "alternatives"}
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      showAlternatives ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showAlternatives && (
                  <ul className="mt-1.5 space-y-1 border-l border-border pl-3">
                    {alternatives.map((alternative) => (
                      <li key={alternative} className="text-xs text-muted">
                        {alternative}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <span className="text-accent font-medium">{exercise.sets}</span>
        <span className="text-muted"> x </span>
        <span>{exercise.reps}</span>
      </td>

      <td className="py-3 px-4 text-center">
        <span className="text-muted">{exercise.rest}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium ${
            exercise.rpe >= 8
              ? "bg-red-500/10 text-red-400"
              : exercise.rpe >= 7
                ? "bg-yellow-500/10 text-yellow-400"
                : "bg-green-500/10 text-green-400"
          }`}
        >
          {exercise.rpe}
        </span>
      </td>
    </tr>
  )
}

function DayCard({ schedule }: { schedule: DaySchedule }) {
  const exercises = schedule.exercises ?? []

  return (
    <Card variant="bordered" className="overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{schedule.day}</h3>
          <p className="text-sm text-accent">{schedule.focus}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Dumbbell className="h-4 w-4" />
          <span>{exercises.length} exercises</span>
        </div>
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted text-xs tracking-wider">
              <th className="text-left py-2 pr-4 font-medium">Exercise</th>
              <th className="py-2 px-4 font-medium">Sets x Reps</th>
              <th className="py-2 px-4 font-medium">Rest</th>
              <th className="py-2 px-4 font-medium">RPE</th>
            </tr>
          </thead>

          <tbody>
            {exercises.map((exercise, key) => (
              <ExerciseRow key={key} exercise={exercise} index={key} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

interface PlanDisplayProps {
  weeklySchedule: DaySchedule[]
}

export function PlanDisplay({ weeklySchedule }: PlanDisplayProps) {
  if (!weeklySchedule?.length) {
    return (
      <Card variant="bordered" className="mb-8 text-center py-12">
        <p className="text-muted text-sm">
          This plan has no workout days. Try regenerating it.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6 mb-8">
      {weeklySchedule.map((schedule, key) => (
        <DayCard key={key} schedule={schedule} />
      ))}
    </div>
  )
}
