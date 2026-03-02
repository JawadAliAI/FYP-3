from pydantic import BaseModel
from typing import Literal

class UserProfile(BaseModel):
    goal: Literal["lose_weight", "muscle_gain", "strength", "maintenance"]
    gender: Literal["male", "female"]
    training_method: Literal["resistance", "resistance_cardio"]
    workout_type: Literal["weighted", "bodyweight", "no_equipment"]
    strength_level: Literal["beginner", "intermediate", "advanced"]
    days_per_week: int