import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

models = genai.list_models()

# Simple print
for m in models:
    print(m)

# Or more readable as dictionary
for m in models:
    print(m.to_dict())