def select_split(profile):
    if profile.strength_level == "beginner":
        return "Full Body"
    elif profile.strength_level == "intermediate":
        return "Upper/Lower"
    else:
        return "Push Pull Legs"


def select_volume(profile):
    if profile.goal == "muscle_gain":
        return {
            "rep_range": "8-12",
            "sets_per_exercise": 3,
            "rest_seconds": 75
        }
    elif profile.goal == "lose_weight":
        return {
            "rep_range": "10-15",
            "sets_per_exercise": 3,
            "rest_seconds": 45
        }
    elif profile.goal == "strength":
        return {
            "rep_range": "3-6",
            "sets_per_exercise": 4,
            "rest_seconds": 120
        }
    else:
        return {
            "rep_range": "8-10",
            "sets_per_exercise": 3,
            "rest_seconds": 60
        }


def generate_program_parameters(profile):
    split = select_split(profile)
    volume = select_volume(profile)

    return {
        "split": split,
        "rep_range": volume["rep_range"],
        "sets": volume["sets_per_exercise"],
        "rest": volume["rest_seconds"],
        "days": profile.days_per_week
    }