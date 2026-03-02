import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function WorkoutModal({ isOpen, onClose, onSubmit }: Props) {
  const [form, setForm] = useState({
    goal: "",
    gender: "",
    training_method: "",
    workout_type: "",
    strength_level: "",
    days_per_week: 3,
  });

  if (!isOpen) return null;

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 text-white p-6 rounded-xl w-[500px]">
        <h2 className="text-xl font-semibold mb-4">Generate AI Workout</h2>

        <div className="grid gap-3">

          <select name="goal" onChange={handleChange} className="bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
            <option value="">Select Goal</option>
            <option value="lose_weight">Lose Weight</option>
            <option value="muscle_gain">Muscle Gain</option>
            <option value="strength">Strength</option>
          </select>

          <select name="gender" onChange={handleChange} className="bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <select name="training_method" onChange={handleChange} className="bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
            <option value="">Training Method</option>
            <option value="resistance">Resistance</option>
            <option value="resistance_cardio">Resistance + Cardio</option>
          </select>

          <select name="workout_type" onChange={handleChange} className="bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
            <option value="">Workout Type</option>
            <option value="weighted">Weighted</option>
            <option value="bodyweight">Body Weight</option>
            <option value="no_equipment">No Equipment</option>
          </select>

          <select name="strength_level" onChange={handleChange} className="bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
            <option value="">Strength Level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {/* NEW FIELD */}
          <select name="days_per_week" onChange={handleChange} className="bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
            {[1,2,3,4,5,6,7].map(d => (
              <option key={d} value={d}>{d} Days</option>
            ))}
          </select>

          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg py-2"
          >
            Generate
          </button>

          <button
            onClick={onClose}
            className="text-gray-400"
          >
            Cancel
          </button>

        </div>
      </div>
    </div>
  );
}