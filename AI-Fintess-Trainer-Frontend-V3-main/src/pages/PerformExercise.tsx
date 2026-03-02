import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, Camera } from "lucide-react";

const API_BASE = import.meta.env.VITE_EXERCISE_API_URL || "http://localhost:8000";

const PerformExercise = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const exercise = location.state?.exercise;
  const [isExercising, setIsExercising] = useState(false);
  const [reps, setReps] = useState(0);
  const [assignedReps] = useState(10);
  const [duration, setDuration] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const isExercisingRef = useRef(false);
  const pollingRef = useRef<any>(null);

  // Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/auth");
    };
    checkAuth();
    if (!exercise) navigate("/suggested-workouts");
  }, []);

  // Timer
  useEffect(() => {
    let interval: any;
    if (isExercising && !isComplete) {
      interval = setInterval(() => setDuration((p) => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isExercising, isComplete]);

  // DB Saving Logic
  const handleExerciseComplete = async (finalReps: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("exercise_history").insert({
        user_id: user.id,
        exercise_type: exercise.name,
        reps: finalReps,
        duration: duration,
        calories_burned: Math.round((duration / 60) * (exercise.calories_burned || 5)),
      });

      if (error) throw error;

      toast({ title: "Workout Saved! 🎉", description: "Your progress is now in your history." });
      setTimeout(() => navigate("/exercise-history"), 2000);
    } catch (err: any) {
      console.error("Save error:", err);
    }
  };

  // Status Polling
  useEffect(() => {
    const pollStatus = async () => {
      if (!isExercisingRef.current) return;
      try {
        const res = await fetch(`${API_BASE}/exercise_status`);
        const data = await res.json();
        setReps(data.reps);

        if (data.reps >= assignedReps && !isComplete) {
          setIsComplete(true);
          setIsExercising(false);
          handleExerciseComplete(data.reps);
        }
      } catch (err) { console.error(err); }
    };

    if (isExercising) {
      pollingRef.current = setInterval(pollStatus, 1000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [isExercising, assignedReps, isComplete]);

  useEffect(() => { isExercisingRef.current = isExercising; }, [isExercising]);

  const startExercise = async () => {
    try {
      await fetch(`${API_BASE}/reset`);
      await fetch(`${API_BASE}/set_target?target=${assignedReps}`, { method: "POST" });
      await fetch(`${API_BASE}/set_exercise?name=${exercise.name.toLowerCase()}`, { method: "POST" });
      
      setReps(0); setDuration(0); setIsComplete(false); setIsExercising(true);
      toast({ title: "Started", description: "AI tracking active." });
    } catch (e) { toast({ title: "Backend Error", variant: "destructive" }); }
  };

  if (!exercise) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Perform Exercise</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{exercise.name}</CardTitle>
              <CardDescription>{exercise.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-2xl font-bold">{reps}</p><p className="text-sm">Performed</p></div>
                <div><p className="text-2xl font-bold">{assignedReps}</p><p className="text-sm">Assigned</p></div>
                <div><p className="text-2xl font-bold">{duration}s</p><p className="text-sm">Duration</p></div>
              </div>
              {!isExercising ? (
                <Button onClick={startExercise} className="w-full mt-4"><Play className="mr-2" /> Start</Button>
              ) : (
                <Button onClick={() => setIsExercising(false)} variant="destructive" className="w-full mt-4"><Square className="mr-2" /> Stop</Button>
              )}
              {isComplete && <div className="mt-4 p-2 bg-green-100 text-green-700 rounded text-center">Goal Reached! Saving...</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Camera /> Monitor</CardTitle></CardHeader>
            <CardContent>
              <div className="aspect-video bg-black rounded-lg">
                {isExercising && <img src={`${API_BASE}/video_feed`} className="w-full h-full object-contain" />}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PerformExercise;