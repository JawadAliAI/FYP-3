import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Prefer newest; fall back if the account/API version does not expose a model.
_MODEL_CANDIDATES = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
]


def _response_text(response) -> str:
    try:
        t = response.text
        if t:
            return t.strip()
    except (ValueError, AttributeError):
        pass
    parts = []
    for cand in getattr(response, "candidates", None) or []:
        content = getattr(cand, "content", None)
        for p in getattr(content, "parts", None) or []:
            txt = getattr(p, "text", None)
            if txt:
                parts.append(txt)
    if not parts:
        fr = getattr(getattr(response, "candidates", [None])[0], "finish_reason", None)
        raise ValueError(f"No text in Gemini response (finish_reason={fr}). Try another model or check API key.")
    return "".join(parts).strip()


def _strip_code_fences(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    elif raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    return raw.strip()


def generate_workout_plan(profile, parameters):
    raw_key = os.getenv("GEMINI_API_KEY") or ""
    api_key = raw_key.strip().strip('"').strip("'")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set. Add it to the server .env and restart the workout container.")

    genai.configure(api_key=api_key)

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

    last_err: Exception | None = None
    for model_name in _MODEL_CANDIDATES:
        try:
            model = genai.GenerativeModel(
                model_name,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.3,
                    "top_p": 0.9,
                    "max_output_tokens": 8192,
                },
            )
            response = model.generate_content(prompt)
            raw_text = _strip_code_fences(_response_text(response))
            workout_json = json.loads(raw_text)
            if not isinstance(workout_json, dict) or "days" not in workout_json:
                raise ValueError("Model returned JSON without a 'days' field.")
            return workout_json
        except Exception as e:
            last_err = e
            continue

    raise ValueError(
        f"All Gemini models failed. Last error: {last_err!s}. "
        "Verify GEMINI_API_KEY, billing, and that generative language API is enabled for the project."
    ) from last_err
