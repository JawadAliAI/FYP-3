from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import math
import os

app = FastAPI(title="AI Fitness Trainer - Exercise Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Exercise Sessions (in-memory) ---
exercise_sessions = {}


# --- Models ---
class Landmark(BaseModel):
    x: float
    y: float
    z: float = 0.0
    visibility: float = 0.0


class PoseRequest(BaseModel):
    landmarks: List[Landmark]
    exercise: str
    session_id: str = "default"
    assigned_reps: int = 10


class ResetRequest(BaseModel):
    session_id: str = "default"


# --- Angle Calculation ---
def calc_angle(a: Landmark, b: Landmark, c: Landmark) -> float:
    radians = math.atan2(c.y - b.y, c.x - b.x) - math.atan2(a.y - b.y, a.x - b.x)
    angle = abs(radians * 180.0 / math.pi)
    return 360 - angle if angle > 180 else angle


# --- Session State ---
def get_session(session_id: str):
    if session_id not in exercise_sessions:
        exercise_sessions[session_id] = {
            "reps": 0,
            "stage": "UP",
            "done": False,
            "correct_form": 0,
            "incorrect_form": 0,
        }
    return exercise_sessions[session_id]


# --- Exercise Processors ---
def process_squat(landmarks, session_id, assigned_reps):
    state = get_session(session_id)
    # Hip(23), Knee(25), Ankle(27)
    angle = calc_angle(landmarks[23], landmarks[25], landmarks[27])
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


def process_pushup(landmarks, session_id, assigned_reps):
    state = get_session(session_id)
    # Shoulder(11), Elbow(13), Wrist(15)
    angle = calc_angle(landmarks[11], landmarks[13], landmarks[15])
    feedback = "Adjust your position"

    if angle > 160:
        state["stage"] = "UP"
        feedback = "Go Down"
    if angle < 90 and state["stage"] == "UP":
        state["stage"] = "DOWN"
        state["reps"] += 1
        feedback = "Good! Keep going"

    if state["reps"] >= assigned_reps:
        state["done"] = True
        feedback = "Exercise complete!"

    return {
        "reps": state["reps"],
        "stage": state["stage"],
        "done": state["done"],
        "feedback": feedback,
        "angle": int(angle),
        "assigned_reps": assigned_reps,
    }


def process_pullup(landmarks, session_id, assigned_reps):
    state = get_session(session_id)
    # Right Shoulder(12), Elbow(14), Wrist(16)
    angle = calc_angle(landmarks[12], landmarks[14], landmarks[16])
    feedback = ""

    if angle > 150:
        state["stage"] = "DOWN"
        feedback = "Move up!"
    if angle < 70 and state["stage"] == "DOWN":
        state["stage"] = "UP"
        state["reps"] += 1
        feedback = "Good rep!"

    if state["reps"] >= assigned_reps:
        state["done"] = True
        feedback = "Exercise complete!"

    return {
        "reps": state["reps"],
        "stage": state["stage"],
        "done": state["done"],
        "feedback": feedback,
        "angle": int(angle),
        "assigned_reps": assigned_reps,
    }


def process_plank(landmarks, session_id, assigned_reps):
    state = get_session(session_id)
    # Right Shoulder(12), Hip(24), Ankle(28)
    angle = calc_angle(landmarks[12], landmarks[24], landmarks[28])
    feedback = ""

    if 160 <= angle <= 175:
        feedback = "Perfect posture!"
        state["correct_form"] += 1
    elif angle < 160:
        feedback = "Raise your hips!"
        state["incorrect_form"] += 1
    else:
        feedback = "Lower your hips!"
        state["incorrect_form"] += 1

    return {
        "feedback": feedback,
        "angle": int(angle),
        "correct_frames": state["correct_form"],
        "incorrect_frames": state["incorrect_form"],
        "assigned_reps": assigned_reps,
    }


# --- Routes ---
@app.get("/")
def root():
    return {
        "status": "healthy",
        "service": "AI Fitness Trainer - Exercise Detection API",
        "version": "2.0",
        "description": "Lightweight exercise detection API - receives pose landmarks from frontend",
        "endpoints": {
            "process_pose": "POST /process_pose - Process pose landmarks for exercise counting",
            "exercise_status": "GET /exercise_status/{session_id} - Get current session status",
            "reset": "POST /reset - Reset exercise session",
            "health": "GET /health - Health check",
        },
    }


@app.post("/process_pose")
async def process_pose(request: PoseRequest):
    """
    Process pose landmarks sent from the frontend.
    Frontend does MediaPipe detection in the browser, sends landmarks here for counting.
    """
    try:
        landmarks = request.landmarks
        exercise = request.exercise.lower()

        if len(landmarks) < 33:
            return {"error": "Need 33 pose landmarks", "detected": False}

        if "squat" in exercise:
            result = process_squat(landmarks, request.session_id, request.assigned_reps)
        elif "plank" in exercise:
            result = process_plank(landmarks, request.session_id, request.assigned_reps)
        elif "pullup" in exercise or "pull-up" in exercise:
            result = process_pullup(landmarks, request.session_id, request.assigned_reps)
        else:
            result = process_pushup(landmarks, request.session_id, request.assigned_reps)

        result["detected"] = True
        result["exercise"] = exercise
        return result

    except Exception as e:
        return {"error": str(e), "detected": False}


@app.get("/exercise_status/{session_id}")
def get_status(session_id: str = "default"):
    if session_id in exercise_sessions:
        return exercise_sessions[session_id]
    return {"reps": 0, "session_id": session_id, "message": "No active session"}


@app.post("/reset")
def reset(request: ResetRequest):
    if request.session_id in exercise_sessions:
        del exercise_sessions[request.session_id]
    return {"status": "reset", "session_id": request.session_id}


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "AI Fitness Trainer - Exercise Detection",
        "active_sessions": len(exercise_sessions),
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
