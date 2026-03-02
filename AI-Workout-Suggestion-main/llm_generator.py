import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel(
    "models/gemini-2.5-flash-lite",
    generation_config={
        "response_mime_type": "application/json"
    }
)
# You can use "gemini-1.5-pro" for higher reasoning


def generate_workout_plan(profile, parameters):

    prompt = f"""
You are a certified strength and conditioning coach.

Generate a {parameters['days']}-day structured workout program.

User Profile:
Goal: {profile.goal}
Gender: {profile.gender}
Training Method: {profile.training_method}
Workout Type: {profile.workout_type}
Strength Level: {profile.strength_level}

Program Rules:
Split: {parameters['split']}
Rep Range: {parameters['rep_range']}
Sets per exercise: {parameters['sets']}
Rest seconds: {parameters['rest']}

IMPORTANT:
Return ONLY valid JSON.
Do NOT include explanations.
Do NOT include markdown formatting.

JSON Format:

{{
  "program_duration": "6 Weeks",
  "weekly_split": "",
  "days": [
    {{
      "day": "",
      "focus": "",
      "exercises": [
        {{
          "name": "",
          "sets": 0,
          "reps": "",
          "rest_seconds": 0
        }}
      ]
    }}
  ],
  "progressive_overload": ""
}}
"""

    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.3,
            "top_p": 0.9,
            "max_output_tokens": 2048
        }
    )

    #response = model.generate_content(prompt)
    workout_json = json.loads(response.text)
    return workout_json