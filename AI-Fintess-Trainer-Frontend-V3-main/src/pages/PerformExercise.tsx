import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, Camera, CheckCircle2, ChevronLeft } from "lucide-react";

const API_BASE = import.meta.env.VITE_EXERCISE_API_URL || "http://109.123.243.92:11003";

declare global {
  interface Window {
    Pose: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
  }
}

const PerformExercise = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const exercise = location.state?.exercise;
  const [isExercising, setIsExercising] = useState(false);
  const isExercisingRef = useRef(false);
  useEffect(() => { isExercisingRef.current = isExercising; }, [isExercising]);

  const [reps, setReps] = useState(0);
  const [assignedReps] = useState(10);
  const [duration, setDuration] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const isCompleteRef = useRef(false);
  useEffect(() => { isCompleteRef.current = isComplete; }, [isComplete]);

  const [feedback, setFeedback] = useState("Press Start Workout to begin");
  const [cameraError, setCameraError] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionIdRef = useRef<string>(Math.random().toString(36).substring(7));
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const lastCallTime = useRef<number>(0);

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
      const { error } = await supabase.from("exercise_history").insert({
        user_id: user.id,
        exercise_type: exercise.name,
        reps: finalReps,
        duration,
        calories_burned: Math.round((duration / 60) * (exercise.calories_burned || 5)),
      });
      
      if (error) throw error;
      
      toast({ title: "Workout Saved! 🎉", description: "Your progress is in your history." });
      setTimeout(() => navigate("/exercise-history"), 2000);
    } catch (err) {
      console.error("Save error:", err);
    }
  }, [duration, exercise, toast]);

  // MediaPipe Setup
  useEffect(() => {
    if (!window.Pose) {
      console.error("MediaPipe not loaded from CDN.");
      return;
    }

    const pose = new window.Pose({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults(onResults);
    poseRef.current = pose;

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (poseRef.current) {
        poseRef.current.close();
      }
    };
  }, []);

  const onResults = async (results: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvasCtx = canvasRef.current.getContext("2d");
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Draw video frame on canvas
    canvasCtx.drawImage(
      results.image, 0, 0, canvasRef.current.width, canvasRef.current.height
    );

    // Draw landmarks
    if (results.poseLandmarks) {
      window.drawConnectors(canvasCtx, results.poseLandmarks, window.POSE_CONNECTIONS,
        { color: '#00FF00', lineWidth: 4 });
      window.drawLandmarks(canvasCtx, results.poseLandmarks,
        { color: '#FF0000', lineWidth: 2 });

      // Throttle API calls to avoid overloading the backend, but fast enough to not miss reps (150ms ~ 7fps)
      const now = Date.now();
      if (isExercisingRef.current && !isCompleteRef.current && (now - lastCallTime.current > 150)) {
        lastCallTime.current = now;
        sendRepPhase(results.poseLandmarks);
      }
    }
    canvasCtx.restore();
  };

  const sendRepPhase = async (landmarks: any) => {
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
        handleExerciseComplete(data.reps);
      }
    } catch (e) {
      console.error("Backend error:", e);
    }
  };

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
    setFeedback("Initializing AI tracking...");
    setIsExercising(true);
    setLoadingModel(true);

    if (videoRef.current && poseRef.current) {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await poseRef.current.send({ image: videoRef.current });
            if (loadingModel) setLoadingModel(false);
          }
        },
        width: 640,
        height: 480
      });
      cameraRef.current = camera;
      try {
        await camera.start();
        setFeedback("Ready! Start moving...");
        setCameraError(false);
      } catch {
        setCameraError(true);
        setIsExercising(false);
        setLoadingModel(false);
      }
    }
  };

  const stopExercise = () => {
    setIsExercising(false);
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
    setFeedback("Exercise stopped. Great effort!");
  };

  if (!exercise) return null;

  const progress = Math.min((reps / assignedReps) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        <button
          onClick={() => { stopExercise(); navigate("/suggested-workouts"); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Workouts
        </button>

        <h1 className="text-4xl font-bold mb-8">Perform Exercise</h1>

        <div className="grid md:grid-cols-2 gap-6">

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{exercise.name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {exercise.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

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

              <div className="bg-secondary/30 p-4 rounded-lg border border-secondary">
                <p className="text-center font-medium italic text-secondary-foreground">
                  "{feedback}"
                </p>
              </div>

              {!isExercising ? (
                <Button onClick={startExercise} className="w-full h-12 text-lg">
                  <Play className="mr-2 h-5 w-5" /> Start Workout
                </Button>
              ) : (
                <Button onClick={stopExercise} variant="destructive" className="w-full h-12 text-lg">
                  <Square className="mr-2 h-5 w-5" /> Stop / Finish
                </Button>
              )}

              {isComplete && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg text-center font-semibold animate-in fade-in zoom-in duration-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Goal Reached! Saving progress...
                </div>
              )}

              {!isComplete && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Instructions:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                    <li>Press Start Workout and step back.</li>
                    <li>Ensure your full body is visible in the camera.</li>
                    <li>Perform the exercise and the AI will count reps!</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2 border-primary/10">
            <CardHeader className="bg-muted/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5 text-primary" /> Live Camera Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-black relative aspect-[4/3] flex items-center justify-center">

              <video
                ref={videoRef}
                className="hidden"
                playsInline
                muted
                autoPlay
              />
              <canvas 
                ref={canvasRef} 
                className={`w-full h-full object-cover ${!isExercising && 'hidden'}`}
                width={640} 
                height={480}
              />

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
                      ⚠️ Camera not available. Please check browser permissions.
                    </p>
                  )}
                </div>
              )}

              {loadingModel && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                  <p className="animate-pulse font-semibold">Loading AI Vision Model...</p>
                </div>
              )}

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
