import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import WorkoutModal from "@/components/ui/WorkoutModal";
import WorkoutCard from "@/components/ui/WorkoutCard";
import { supabase } from "@/lib/supabase";

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

interface WorkoutResponse {
  program_duration: string;
  weekly_split: string;
  days: DayWorkout[];
  progressive_overload: string;
}

export default function SuggestedWorkouts() {
  const [modalOpen, setModalOpen] = useState(false);
  const [workoutData, setWorkoutData] = useState<WorkoutResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWorkout();
  }, []);

  // 🔥 Fetch latest workout from Supabase
  const fetchWorkout = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Fetch error:", error);
      return;
    }

    if (data && data.length > 0) {
      setWorkoutData(data[0].workout_plan); // store entire JSON
    } else {
      setWorkoutData(null);
    }
  };

  // 🔥 Generate + Store Workout
  const generateWorkout = async (formData: any) => {
    try {
      setLoading(true);

      const res = await fetch(
        `${import.meta.env.VITE_WORKOUT_API_URL || "https://ai-workout-suggestion-api.onrender.com"}/generate-workout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      const apiData: WorkoutResponse = await res.json();
      console.log("FULL API RESPONSE:", apiData);

      if (!apiData || !apiData.days) {
        console.error("Invalid workout response");
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("User not logged in");
        setLoading(false);
        return;
      }

      // 🔥 Store FULL structured response
      const { error } = await supabase.from("workouts").insert({
        user_id: user.id,
        workout_plan: apiData,
      });

      if (error) {
        console.error("Insert error:", error);
        setLoading(false);
        return;
      }

      await fetchWorkout();
      setModalOpen(false);
      setLoading(false);
    } catch (error) {
      console.error("Error generating workout:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <Navbar />

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Suggested Workouts</h1>
            <p className="text-gray-400">AI-powered exercise recommendations</p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-cyan-500 hover:bg-cyan-600 px-5 py-2 rounded-lg"
          >
            Generate AI Workout
          </button>
        </div>

        {loading && (
          <p className="text-cyan-400 text-lg">Generating workout...</p>
        )}

        {!loading && !workoutData && (
          <div className="bg-slate-800 p-6 rounded-xl text-center">
            <p className="text-gray-400 mb-4">
              You don’t have any workout plan yet.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-lg"
            >
              Generate Now
            </button>
          </div>
        )}

        {workoutData && (
          <div className="mt-6 space-y-6">
            {/* Program Info */}
            <div className="bg-slate-800 p-5 rounded-xl">
              <h2 className="text-xl font-semibold">
                {workoutData.program_duration}
              </h2>
              <p className="text-gray-400">{workoutData.weekly_split}</p>
            </div>

            {/* Days */}
            <div className="grid gap-4">
              {workoutData.days.map((day, index) => (
                <WorkoutCard key={index} day={day} />
              ))}
            </div>

            {/* Progressive Overload */}
            <div className="bg-slate-800 p-5 rounded-xl">
              <h3 className="font-semibold mb-2">
                Progressive Overload Strategy
              </h3>
              <p className="text-gray-400">
                {workoutData.progressive_overload}
              </p>
            </div>
          </div>
        )}
      </div>

      <WorkoutModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={generateWorkout}
      />
    </div>
  );
}
