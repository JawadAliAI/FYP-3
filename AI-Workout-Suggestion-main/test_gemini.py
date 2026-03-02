# test_gemini.py
import os
import google.generativeai as genai
from dotenv import load_dotenv
import json

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel(
    "gemini-1.5-flash",
    generation_config={"response_mime_type": "application/json"}
)

prompt = """
Generate a 5-day beginner full body workout program.
Return ONLY JSON as follows:
{
  "program_duration": "6 Weeks",
  "weekly_split": "",
  "days": [
    {
      "day": "",
      "focus": "",
      "exercises": [
        {"name": "", "sets": 0, "reps": "", "rest_seconds": 0}
      ]
    }
  ],
  "progressive_overload": ""
}
"""

response = model.generate_content(prompt)
raw_output = response.text.strip()

# Print Gemini raw output
print("RAW GEMINI OUTPUT:\n", raw_output)

# Parse JSON safely
try:
    workout_json = json.loads(raw_output)
    print("PARSED JSON:\n", workout_json)
except json.JSONDecodeError as e:
    print("JSON decode error:", e)