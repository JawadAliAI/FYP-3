import ExerciseCard from "./ExerciseCard";

interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
}

interface DayWorkout {
  day: string;
  focus: string;
  exercises: Exercise[];
}

interface Props {
  day: DayWorkout;
}

export default function WorkoutCard({ day }: Props) {
  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-md">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-cyan-400">
          {day.day}
        </h2>
        <p className="text-gray-400 text-sm">
          Focus: {day.focus}
        </p>
      </div>

      <div className="space-y-4">
        {day.exercises.map((exercise, index) => (
          <ExerciseCard
            key={index}
            exercise={exercise}
            day={day.day}
          />
        ))}
      </div>
    </div>
  );
}