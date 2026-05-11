import { useNavigate } from "react-router-dom";

interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  rest_seconds?: number;
}

interface Props {
  exercise: Exercise;
  day: string;
}

export default function ExerciseCard({ exercise, day }: Props) {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/perform-exercise", {
      state: {
        exercise: {
          ...exercise,
          description: `${exercise.sets} sets × ${exercise.reps}${exercise.rest_seconds ? ` — ${exercise.rest_seconds}s rest` : ""}`,
          calories_burned: 5, // default fallback kcal/min
        },
        day,
      },
    });
  };

  return (
    <div className="bg-slate-800 p-5 rounded-2xl shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 border border-slate-700 hover:border-cyan-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {exercise.name}
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            {exercise.sets} Sets • {exercise.reps}
            {exercise.rest_seconds && (
              <span className="ml-2 text-cyan-400">· {exercise.rest_seconds}s rest</span>
            )}
          </p>
        </div>

        <button
          onClick={handleStart}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Perform Exercise
        </button>
      </div>
    </div>
  );
}