import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, Camera } from "lucide-react";
import { Pose, Results } from "@mediapipe/pose";
import { Camera as MediaPipeCamera } from "@mediapipe/camera_utils";

const API_BASE = import.meta.env.VITE_EXERCISE_API_URL || "https://ai-fitness-exercises-api.onrender.com";

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
  const [feedback, setFeedback] = useState("Initializing camera...");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<Pose | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);
  const lastProcessTimeRef = useRef<number>(0);
  const sessionIdRef = useRef<string>(Math.random().toString(36).substring(7));

  // Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) navigate("/auth");
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
        exercise_name: exercise.name, // Updated from exercise_type to match common schema
        reps: finalReps,
        duration: duration,
        calories_burned: Math.round((duration / 60) * (exercise.calories_burned || 5)),
      });

      if (error) throw error;
      toast({ title: "Workout Saved! 🎉", description: "Your progress is now in your history." });
    } catch (err: any) {
      console.error("Save error:", err);
    }
  };

  // Initialize MediaPipe Pose
  useEffect(() => {
    if (!videoRef.current) return;

    poseRef.current = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    poseRef.current.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    poseRef.current.onResults(onResults);

    cameraRef.current = new MediaPipeCamera(videoRef.current, {
      onFrame: async () => {
        if (poseRef.current && videoRef.current) {
          await poseRef.current.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    return () => {
      cameraRef.current?.stop();
      poseRef.current?.close();
    };
  }, []);

  const onResults = async (results: Results) => {
    if (!canvasRef.current || !isExercising || isComplete) return;

    // Draw on canvas for visualization
    const canvasCtx = canvasRef.current.getContext("2d");
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Throttle API calls to 5 per second
    const now = Date.now();
    if (now - lastProcessTimeRef.current < 200) return;
    lastProcessTimeRef.current = now;

    if (results.poseLandmarks) {
      try {
        const res = await fetch(`${API_BASE}/process_pose`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            landmarks: results.poseLandmarks,
            exercise: exercise.name.toLowerCase(),
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
          toast({ title: "Goal Reached!", description: "Exercise completed successfully." });
        }
      } catch (err) {
        console.error("API Error:", err);
      }
    } else {
      setFeedback("Ensure full body is visible");
    }
    canvasCtx.restore();
  };

  const startExercise = async () => {
    try {
      await fetch(`${API_BASE}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionIdRef.current }),
      });
      
      setReps(0);
      setDuration(0);
      setIsComplete(false);
      setIsExercising(true);
      setFeedback("Ready! Start moving...");
      
      if (cameraRef.current) {
        await cameraRef.current.start();
      }
      
      toast({ title: "Started", description: "AI tracking active." });
    } catch (e) {
      console.error(e);
      toast({ title: "Backend Error", description: "Could not initialize session", variant: "destructive" });
    }
  };

  const stopExercise = () => {
    setIsExercising(false);
    cameraRef.current?.stop();
    setFeedback("Exercise stopped.");
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
              <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-3xl font-bold text-primary">{reps}</p>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Performed</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-3xl font-bold text-primary">{assignedReps}</p>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Goal</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-3xl font-bold text-primary">{duration}s</p>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Time</p>
                </div>
              </div>
              
              <div className="bg-secondary/30 p-4 rounded-lg border border-secondary mb-6">
                <p className="text-center font-medium italic text-secondary-foreground">"{feedback}"</p>
              </div>

              {!isExercising ? (
                <Button onClick={startExercise} className="w-full h-12 text-lg shadow-lg hover:shadow-primary/20 transition-all">
                  <Play className="mr-2 h-5 w-5" /> Start Workout
                </Button>
              ) : (
                <Button onClick={stopExercise} variant="destructive" className="w-full h-12 text-lg">
                  <Square className="mr-2 h-5 w-5" /> Stop / Finish
                </Button>
              )}
              
              {isComplete ? (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg text-center font-semibold animate-in fade-in zoom-in duration-300">
                  🎉 Goal Reached! Saving progress...
                </div>
              ) : (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-2">Instructions:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                    <li>Place your device on a stable surface.</li>
                    <li>Move 6-10 feet away until your full body is visible.</li>
                    <li>Ensure the area is well lit.</li>
                    <li>Perform reps at a controlled pace.</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-2 border-primary/10">
            <CardHeader className="bg-muted/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg"><Camera className="h-5 w-5 text-primary" /> AI Vision Feed</CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-black relative aspect-[4/3] flex items-center justify-center">
              <video 
                ref={videoRef} 
                className="hidden" 
                playsInline 
                muted 
              />
              <canvas 
                ref={canvasRef} 
                className="w-full h-full object-cover" 
                width={640} 
                height={480} 
              />
              
              {!isExercising && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-6 text-center">
                  <div className="bg-primary/20 p-4 rounded-full mb-4">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-medium text-lg">Camera Preview Off</p>
                  <p className="text-sm text-gray-400 mt-2">Click "Start Workout" to activate the AI tracking system.</p>
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
