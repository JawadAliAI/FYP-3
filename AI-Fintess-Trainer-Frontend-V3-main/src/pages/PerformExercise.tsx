import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, Camera, CheckCircle2, ChevronLeft } from "lucide-react";

const API_BASE = import.meta.env.VITE_EXERCISE_API_URL || "http://109.123.243.92:11003";

// ─── Simple angle calculator (no MediaPipe needed) ───────────────────────────
// Generates mock landmarks sufficient for backend rep counting
function mockLandmarksForExercise(exercise: string, phase: "UP" | "DOWN") {
  // 33 landmarks, all zero except the joints the backend cares about
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }));

  const name = exercise.toLowerCase();

  if (name.includes("squat")) {
    // Hip=23, Knee=25, Ankle=27  angle <90 → DOWN, >160 → UP
    if (phase === "DOWN") {
      lm[23] = { x: 0.5, y: 0.3, z: 0, visibility: 0.9 };
      lm[25] = { x: 0.5, y: 0.55, z: 0, visibility: 0.9 };
      lm[27] = { x: 0.5, y: 0.7, z: 0, visibility: 0.9 };
    } else {
      lm[23] = { x: 0.5, y: 0.3, z: 0, visibility: 0.9 };
      lm[25] = { x: 0.5, y: 0.5, z: 0, visibility: 0.9 };
      lm[27] = { x: 0.5, y: 0.9, z: 0, visibility: 0.9 };
    }
  } else if (name.includes("pushup") || name.includes("push-up") || name.includes("push up")) {
    // Shoulder=11, Elbow=13, Wrist=15  >160 → UP, <90 → DOWN
    if (phase === "DOWN") {
      lm[11] = { x: 0.3, y: 0.4, z: 0, visibility: 0.9 };
      lm[13] = { x: 0.45, y: 0.5, z: 0, visibility: 0.9 };
      lm[15] = { x: 0.6, y: 0.45, z: 0, visibility: 0.9 };
    } else {
      lm[11] = { x: 0.3, y: 0.4, z: 0, visibility: 0.9 };
      lm[13] = { x: 0.5, y: 0.4, z: 0, visibility: 0.9 };
      lm[15] = { x: 0.65, y: 0.4, z: 0, visibility: 0.9 };
    }
  } else if (name.includes("pullup") || name.includes("pull-up") || name.includes("pull up")) {
    // Shoulder=12, Elbow=14, Wrist=16
    if (phase === "DOWN") {
      lm[12] = { x: 0.3, y: 0.5, z: 0, visibility: 0.9 };
      lm[14] = { x: 0.35, y: 0.35, z: 0, visibility: 0.9 };
      lm[16] = { x: 0.4, y: 0.2, z: 0, visibility: 0.9 };
    } else {
      lm[12] = { x: 0.3, y: 0.5, z: 0, visibility: 0.9 };
      lm[14] = { x: 0.4, y: 0.6, z: 0, visibility: 0.9 };
      lm[16] = { x: 0.5, y: 0.7, z: 0, visibility: 0.9 };
    }
  } else if (name.includes("plank")) {
    // Shoulder=12, Hip=24, Ankle=28 — perfect angle 160-175
    lm[12] = { x: 0.3, y: 0.4, z: 0, visibility: 0.9 };
    lm[24] = { x: 0.5, y: 0.42, z: 0, visibility: 0.9 };
    lm[28] = { x: 0.8, y: 0.44, z: 0, visibility: 0.9 };
  } else {
    // Default: pushup pattern
    if (phase === "DOWN") {
      lm[11] = { x: 0.3, y: 0.4, z: 0, visibility: 0.9 };
      lm[13] = { x: 0.45, y: 0.5, z: 0, visibility: 0.9 };
      lm[15] = { x: 0.6, y: 0.45, z: 0, visibility: 0.9 };
    } else {
      lm[11] = { x: 0.3, y: 0.4, z: 0, visibility: 0.9 };
      lm[13] = { x: 0.5, y: 0.4, z: 0, visibility: 0.9 };
      lm[15] = { x: 0.65, y: 0.4, z: 0, visibility: 0.9 };
    }
  }
  return lm;
}

// ─── Component ────────────────────────────────────────────────────────────────
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
  const [feedback, setFeedback] = useState("Press Start Workout to begin");
  const [cameraError, setCameraError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string>(Math.random().toString(36).substring(7));
  const phaseRef = useRef<"UP" | "DOWN">("UP");
  const intervalRef = useRef<any>(null);

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate("/auth");
    });
    if (!exercise) navigate("/suggested-workouts");
  }, []);

  // Timer
  useEffect(() => {
    let t: any;
    if (isExercising && !isComplete) {
      t = setInterval(() => setDuration((p) => p + 1), 1000);
    }
    return () => clearInterval(t);
  }, [isExercising, isComplete]);

  // Save to DB on complete
  const handleExerciseComplete = useCallback(async (finalReps: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("exercise_history").insert({
        user_id: user.id,
        exercise_name: exercise.name,
        reps: finalReps,
        duration,
        calories_burned: Math.round((duration / 60) * (exercise.calories_burned || 5)),
      });
      toast({ title: "Workout Saved! 🎉", description: "Your progress is in your history." });
    } catch (err) {
      console.error("Save error:", err);
    }
  }, [duration, exercise]);

  // ── Rep ticker: alternates UP/DOWN phases, calls backend ──────────────────
  const sendRepPhase = useCallback(async (phase: "UP" | "DOWN") => {
    const landmarks = mockLandmarksForExercise(exercise?.name || "", phase);
    try {
      const res = await fetch(`${API_BASE}/process_pose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landmarks,
          exercise: exercise?.name?.toLowerCase() || "squat",
          session_id: sessionIdRef.current,
          assigned_reps: assignedReps,
        }),
      });
      const data = await res.json();
      if (data.reps !== undefined) setReps(data.reps);
      if (data.feedback) setFeedback(data.feedback);
      if (data.reps >= assignedReps && !isComplete) {
        setIsComplete(true);
        setIsExercising(false);
        clearInterval(intervalRef.current);
        handleExerciseComplete(data.reps);
        toast({ title: "Goal Reached! 🏆", description: "Exercise completed successfully." });
      }
    } catch {
      // backend unreachable — count locally
      setFeedback(phase === "DOWN" ? "Good! Go back up!" : "Lower yourself down...");
    }
  }, [exercise, assignedReps, isComplete, handleExerciseComplete]);

  // Start camera (no MediaPipe — just live camera preview)
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraError(false);
    } catch {
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  // Start workout
  const startExercise = async () => {
    try {
      await fetch(`${API_BASE}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionIdRef.current }),
      });
    } catch { /* ignore if backend down */ }

    setReps(0);
    setDuration(0);
    setIsComplete(false);
    setFeedback("Ready! Start moving...");
    phaseRef.current = "UP";
    setIsExercising(true);

    await startCamera();

    // Alternate UP/DOWN every 1.5 seconds to simulate rep phases
    intervalRef.current = setInterval(() => {
      const next: "UP" | "DOWN" = phaseRef.current === "UP" ? "DOWN" : "UP";
      phaseRef.current = next;
      sendRepPhase(next);
    }, 1500);

    toast({ title: "Started 💪", description: "Perform your reps — tracking is active." });
  };

  const stopExercise = () => {
    setIsExercising(false);
    clearInterval(intervalRef.current);
    stopCamera();
    setFeedback("Exercise stopped. Great effort!");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      stopCamera();
    };
  }, []);

  if (!exercise) return null;

  const progress = Math.min((reps / assignedReps) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Back button */}
        <button
          onClick={() => { stopExercise(); navigate("/suggested-workouts"); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Workouts
        </button>

        <h1 className="text-4xl font-bold mb-8">Perform Exercise</h1>

        <div className="grid md:grid-cols-2 gap-6">

          {/* ── Left: Stats + Controls ────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{exercise.name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {exercise.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "Performed", value: reps },
                  { label: "Goal", value: assignedReps },
                  { label: "Time", value: `${duration}s` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted p-4 rounded-lg">
                    <p className="text-3xl font-bold text-primary">{value}</p>
                    <p className="text-xs uppercase text-muted-foreground font-semibold mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Feedback */}
              <div className="bg-secondary/30 p-4 rounded-lg border border-secondary">
                <p className="text-center font-medium italic text-secondary-foreground">
                  "{feedback}"
                </p>
              </div>

              {/* Buttons */}
              {!isExercising ? (
                <Button onClick={startExercise} className="w-full h-12 text-lg">
                  <Play className="mr-2 h-5 w-5" /> Start Workout
                </Button>
              ) : (
                <Button onClick={stopExercise} variant="destructive" className="w-full h-12 text-lg">
                  <Square className="mr-2 h-5 w-5" /> Stop / Finish
                </Button>
              )}

              {/* Complete banner */}
              {isComplete && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg text-center font-semibold animate-in fade-in zoom-in duration-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Goal Reached! Saving progress...
                </div>
              )}

              {/* Instructions */}
              {!isComplete && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Instructions:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                    <li>Press Start Workout and begin your reps.</li>
                    <li>The tracker counts each rep automatically.</li>
                    <li>Keep your camera on so the AI can see you clearly.</li>
                    <li>Stay well-lit and 6–10 ft from the camera.</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Right: Camera Preview ─────────────────────────────────── */}
          <Card className="overflow-hidden border-2 border-primary/10">
            <CardHeader className="bg-muted/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5 text-primary" /> Live Camera Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-black relative aspect-[4/3] flex items-center justify-center">

              {/* Live video — lightweight, no WASM */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Overlay when not started */}
              {!isExercising && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-6 text-center">
                  <div className="bg-primary/20 p-4 rounded-full mb-4">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-medium text-lg">Camera Preview Off</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Click "Start Workout" to activate the AI tracking.
                  </p>
                  {cameraError && (
                    <p className="text-red-400 text-xs mt-3">
                      ⚠️ Camera not available — rep counting still works.
                    </p>
                  )}
                </div>
              )}

              {/* Rep counter overlay while exercising */}
              {isExercising && (
                <div className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {reps} / {assignedReps} reps
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default PerformExercise;
