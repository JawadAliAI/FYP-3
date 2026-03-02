from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models import PushupCounter, PullupCounter, PlankCounter
import mediapipe as mp
import numpy as np
import cv2
import base64
import os

app = FastAPI(title="AI Fitness Trainer - Exercise Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MediaPipe Setup ---
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(min_detection_confidence=0.7, min_tracking_confidence=0.7)

# --- Exercise Counters (per-session, keyed by session_id) ---
exercise_sessions = {}


class FrameRequest(BaseModel):
    image: str  # base64 encoded image
    exercise: str  # "pushup", "pullup", "plank", "squats"
    session_id: str = "default"
    assigned_reps: int = 10


class ResetRequest(BaseModel):
    session_id: str = "default"


class SetExerciseRequest(BaseModel):
    name: str
    session_id: str = "default"


def get_counter(exercise: str, session_id: str):
    """Get or create an exercise counter for a session."""
    key = f"{session_id}_{exercise}"
    if key not in exercise_sessions:
        if "pushup" in exercise or "push-up" in exercise:
            exercise_sessions[key] = PushupCounter()
        elif "pullup" in exercise or "pull-up" in exercise:
            exercise_sessions[key] = PullupCounter()
        elif "plank" in exercise:
            exercise_sessions[key] = PlankCounter()
        else:
            # Default to pushup counter for squats and others
            exercise_sessions[key] = PushupCounter()
    return exercise_sessions[key]


def calc_angle(a, b, c):
    """Calculate angle between three points."""
    a = np.array([a.x, a.y])
    b = np.array([b.x, b.y])
    c = np.array([c.x, c.y])
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    return 360 - angle if angle > 180 else angle


# --- Squat tracking state per session ---
squat_sessions = {}


def process_squat(landmarks, session_id, assigned_reps):
    """Process squat exercise from landmarks."""
    if session_id not in squat_sessions:
        squat_sessions[session_id] = {"reps": 0, "stage": "UP", "done": False}

    state = squat_sessions[session_id]
    lm = landmarks

    angle = calc_angle(lm[23], lm[25], lm[27])

    feedback = "Keep going!"
    if angle < 90 and state["stage"] == "UP":
        state["stage"] = "DOWN"
        feedback = "Good squat depth!"
    if angle > 160 and state["stage"] == "DOWN":
        state["stage"] = "UP"
        state["reps"] += 1
        feedback = "Great rep!"

    if state["reps"] >= assigned_reps:
        state["done"] = True
        feedback = "Exercise complete! Well done!"

    return {
        "reps": state["reps"],
        "stage": state["stage"],
        "done": state["done"],
        "feedback": feedback,
        "angle": int(angle),
        "assigned_reps": assigned_reps,
    }


# --- Routes ---
@app.get("/")
def root():
    return {
        "status": "healthy",
        "service": "AI Fitness Trainer - Exercise Detection API",
        "version": "2.0",
        "description": "Cloud-deployed exercise detection using MediaPipe pose estimation",
        "endpoints": {
            "process_frame": "POST /process_frame - Process a video frame for exercise detection",
            "exercise_status": "GET /exercise_status/{session_id} - Get current exercise status",
            "reset": "POST /reset - Reset exercise session",
            "health": "GET /health - Health check",
        },
    }


@app.post("/process_frame")
async def process_frame(request: FrameRequest):
    """
    Process a single video frame sent from the frontend.
    The frontend captures webcam frames and sends them as base64 images.
    """
    try:
        # Decode base64 image
        img_data = base64.b64decode(request.image)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return {"error": "Invalid image data"}

        # Process with MediaPipe
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image_rgb)

        if not results.pose_landmarks:
            return {
                "detected": False,
                "message": "No pose detected. Make sure your full body is visible.",
            }

        landmarks = results.pose_landmarks.landmark
        exercise = request.exercise.lower()

        # Process based on exercise type
        if "squat" in exercise:
            result = process_squat(landmarks, request.session_id, request.assigned_reps)
        elif "plank" in exercise:
            counter = get_counter(exercise, request.session_id)
            result = counter.process_pose(landmarks, mp_pose)
            result["assigned_reps"] = request.assigned_reps
        elif "pullup" in exercise or "pull-up" in exercise:
            counter = get_counter(exercise, request.session_id)
            result = counter.process_pose(landmarks, mp_pose)
            result["assigned_reps"] = request.assigned_reps
        else:
            # Default: pushup
            counter = get_counter(exercise, request.session_id)
            result = counter.process_pose(landmarks, mp_pose)
            result["assigned_reps"] = request.assigned_reps

        # Extract landmark coordinates for frontend overlay
        landmark_points = []
        for lm in landmarks:
            landmark_points.append({"x": lm.x, "y": lm.y, "z": lm.z, "visibility": lm.visibility})

        result["detected"] = True
        result["landmarks"] = landmark_points
        result["exercise"] = exercise

        return result

    except Exception as e:
        return {"error": str(e), "detected": False}


@app.get("/exercise_status/{session_id}")
def get_status(session_id: str = "default"):
    """Get the current status of an exercise session."""
    # Check squat sessions
    if session_id in squat_sessions:
        return squat_sessions[session_id]

    # Check other exercise sessions
    for key, counter in exercise_sessions.items():
        if key.startswith(session_id):
            return {
                "reps": getattr(counter, "counter", 0),
                "session_id": session_id,
            }

    return {"reps": 0, "session_id": session_id, "message": "No active session"}


@app.post("/reset")
def reset(request: ResetRequest):
    """Reset an exercise session."""
    session_id = request.session_id

    # Clear squat sessions
    if session_id in squat_sessions:
        del squat_sessions[session_id]

    # Clear exercise counter sessions
    keys_to_remove = [k for k in exercise_sessions if k.startswith(session_id)]
    for key in keys_to_remove:
        del exercise_sessions[key]

    return {"status": "reset", "session_id": session_id}


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "AI Fitness Trainer - Exercise Detection",
        "active_sessions": len(exercise_sessions) + len(squat_sessions),
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
