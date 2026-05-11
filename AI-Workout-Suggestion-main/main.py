from fastapi import FastAPI
from models import UserProfile
from workout_engine import generate_program_parameters
from llm_generator import generate_workout_plan
from fastapi.middleware.cors import CORSMiddleware
import os
import traceback

app = FastAPI(title="AI Workout Suggestion API")

origins = [
    "http://109.123.243.92:11000",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.get("/")
def root():
    return {
        "status": "healthy",
        "service": "AI Workout Suggestion API",
        "version": "1.0",
        "endpoints": {
            "generate_workout": "POST /generate-workout - Generate a personalized workout plan",
            "health": "GET /health - Health check",
        },
    }


@app.get("/health")
def health():
    return {"status": "healthy", "service": "AI Workout Suggestion API"}

@app.post("/generate-workout")
def create_workout(profile: UserProfile):
    try:
        print("\n===== REQUEST RECEIVED =====")
        print(profile)

        parameters = generate_program_parameters(profile)

        print("\n===== PARAMETERS =====")
        print(parameters)

        workout_plan = generate_workout_plan(profile, parameters)

        print("\n===== WORKOUT GENERATED =====")

        return workout_plan

    except Exception as e:
        print("\n===== FULL ERROR =====")
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
