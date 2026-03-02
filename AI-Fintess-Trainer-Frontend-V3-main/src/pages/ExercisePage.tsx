import { useLocation, useNavigate } from "react-router-dom";

export default function ExercisePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { exercise, day } = location.state || {};

  if (!exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <p>No exercise selected.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-cyan-400 hover:underline"
      >
        ← Back
      </button>

      <div className="bg-slate-800 p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          {exercise.name}
        </h1>

        <p className="text-gray-400 mb-4">
          {day}
        </p>

        <div className="text-lg mb-6">
          {exercise.sets} Sets • {exercise.reps}
        </div>

        <div className="bg-slate-700 p-5 rounded-xl">
          <p className="text-gray-300">
            Track your reps and maintain proper form.
            Focus on controlled movement and breathing.
          </p>
        </div>
      </div>
    </div>
  );
}