import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Youtube, Search, Dumbbell, Heart, Zap, Target } from "lucide-react";

interface ExerciseTutorial {
    id: string;
    title: string;
    category: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    duration: string;
    youtubeUrl: string;
    description: string;
    targetMuscles: string[];
}

const ExerciseTutorials = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Exercise tutorial data with YouTube links
    const tutorials: ExerciseTutorial[] = [
        // Chest Exercises
        {
            id: "1",
            title: "Bench Press Technique",
            category: "Chest",
            difficulty: "Intermediate",
            duration: "14:00",
            youtubeUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
            description: "Perfect your bench press form for maximum strength and muscle growth.",
            targetMuscles: ["Chest", "Triceps", "Shoulders"],
        },
        {
            id: "2",
            title: "Bench Press - Alternative Guide",
            category: "Chest",
            difficulty: "Intermediate",
            duration: "12:30",
            youtubeUrl: "https://www.youtube.com/watch?v=gRVjAtPip0Y",
            description: "Another comprehensive guide to mastering the bench press.",
            targetMuscles: ["Chest", "Triceps", "Shoulders"],
        },
        {
            id: "3",
            title: "Perfect Push-Up Form",
            category: "Chest",
            difficulty: "Beginner",
            duration: "8:45",
            youtubeUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4",
            description: "Learn the proper form for push-ups to maximize chest development and prevent injury.",
            targetMuscles: ["Chest", "Triceps", "Shoulders"],
        },
        {
            id: "4",
            title: "Push-Up Variations",
            category: "Chest",
            difficulty: "Beginner",
            duration: "10:20",
            youtubeUrl: "https://www.youtube.com/watch?v=_l3ySVKYVJ8",
            description: "Explore different push-up variations to target different parts of your chest.",
            targetMuscles: ["Chest", "Triceps", "Core"],
        },
        {
            id: "5",
            title: "Chest Fly Tutorial",
            category: "Chest",
            difficulty: "Beginner",
            duration: "9:15",
            youtubeUrl: "https://www.youtube.com/watch?v=eozdVDA78K0",
            description: "Master the chest fly for better chest isolation and development.",
            targetMuscles: ["Chest", "Shoulders"],
        },
        {
            id: "6",
            title: "Chest Fly - Dumbbell Technique",
            category: "Chest",
            difficulty: "Beginner",
            duration: "8:30",
            youtubeUrl: "https://www.youtube.com/watch?v=Z56EYFZemhk",
            description: "Learn proper dumbbell fly technique for chest growth.",
            targetMuscles: ["Chest", "Shoulders"],
        },

        // Back Exercises
        {
            id: "7",
            title: "Pull-Up Progression",
            category: "Back",
            difficulty: "Intermediate",
            duration: "10:15",
            youtubeUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g",
            description: "Step-by-step progression to achieve your first pull-up and beyond.",
            targetMuscles: ["Lats", "Biceps", "Upper Back"],
        },
        {
            id: "8",
            title: "Pull-Up Mastery",
            category: "Back",
            difficulty: "Intermediate",
            duration: "11:45",
            youtubeUrl: "https://www.youtube.com/watch?v=fLw3i7FiXsE",
            description: "Advanced pull-up techniques and variations.",
            targetMuscles: ["Lats", "Biceps", "Upper Back"],
        },
        {
            id: "9",
            title: "Deadlift Complete Guide",
            category: "Back",
            difficulty: "Advanced",
            duration: "15:20",
            youtubeUrl: "https://www.youtube.com/watch?v=ytGaGIn3SjE",
            description: "Complete deadlift tutorial covering conventional and sumo variations.",
            targetMuscles: ["Lower Back", "Hamstrings", "Glutes"],
        },
        {
            id: "10",
            title: "Deadlift Form Check",
            category: "Back",
            difficulty: "Advanced",
            duration: "13:50",
            youtubeUrl: "https://www.youtube.com/watch?v=r4MzxtBKyNE",
            description: "Detailed form breakdown for safe and effective deadlifts.",
            targetMuscles: ["Lower Back", "Hamstrings", "Glutes"],
        },
        {
            id: "11",
            title: "Barbell Rows",
            category: "Back",
            difficulty: "Intermediate",
            duration: "12:00",
            youtubeUrl: "https://www.youtube.com/watch?v=roCP6wCXPqo",
            description: "Build a thick back with proper barbell row form and technique.",
            targetMuscles: ["Lats", "Rhomboids", "Lower Back"],
        },
        {
            id: "12",
            title: "Row Variations",
            category: "Back",
            difficulty: "Intermediate",
            duration: "10:30",
            youtubeUrl: "https://www.youtube.com/watch?v=9efgcAjQe7E",
            description: "Different rowing variations for complete back development.",
            targetMuscles: ["Lats", "Rhomboids", "Traps"],
        },

        // Leg Exercises
        {
            id: "13",
            title: "Squat Tutorial - Complete Guide",
            category: "Legs",
            difficulty: "Beginner",
            duration: "12:30",
            youtubeUrl: "https://www.youtube.com/watch?v=ultWZbUMPL8",
            description: "Master the squat with proper form, breathing techniques, and common mistakes to avoid.",
            targetMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
        },
        {
            id: "14",
            title: "Squat Mechanics",
            category: "Legs",
            difficulty: "Beginner",
            duration: "11:20",
            youtubeUrl: "https://www.youtube.com/watch?v=gcNh17Ckjgg",
            description: "Understanding the biomechanics of the perfect squat.",
            targetMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
        },
        {
            id: "15",
            title: "Lunges - Complete Tutorial",
            category: "Legs",
            difficulty: "Beginner",
            duration: "10:00",
            youtubeUrl: "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
            description: "Master forward, reverse, and walking lunges for leg development.",
            targetMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
        },
        {
            id: "16",
            title: "Lunge Variations",
            category: "Legs",
            difficulty: "Beginner",
            duration: "9:40",
            youtubeUrl: "https://www.youtube.com/watch?v=wrwwXE_x-pQ",
            description: "Different lunge variations to target your legs from all angles.",
            targetMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
        },
        {
            id: "17",
            title: "Leg Press Form",
            category: "Legs",
            difficulty: "Beginner",
            duration: "8:50",
            youtubeUrl: "https://www.youtube.com/watch?v=IZxyjW7MPJQ",
            description: "Proper leg press setup and execution for quad development.",
            targetMuscles: ["Quadriceps", "Glutes"],
        },
        {
            id: "18",
            title: "Leg Press Technique",
            category: "Legs",
            difficulty: "Beginner",
            duration: "7:30",
            youtubeUrl: "https://www.youtube.com/watch?v=z7eQq-GN-Nc",
            description: "Advanced leg press techniques for maximum leg growth.",
            targetMuscles: ["Quadriceps", "Glutes"],
        },

        // Shoulder Exercises
        {
            id: "19",
            title: "Shoulder Press Guide",
            category: "Shoulders",
            difficulty: "Beginner",
            duration: "11:45",
            youtubeUrl: "https://www.youtube.com/watch?v=qEwKCR5JCog",
            description: "Learn proper overhead press technique for shoulder development.",
            targetMuscles: ["Shoulders", "Triceps", "Upper Chest"],
        },
        {
            id: "20",
            title: "Military Press",
            category: "Shoulders",
            difficulty: "Intermediate",
            duration: "10:20",
            youtubeUrl: "https://www.youtube.com/watch?v=M2rwvNhTOu0",
            description: "Build strong shoulders with the military press.",
            targetMuscles: ["Shoulders", "Triceps", "Core"],
        },
        {
            id: "21",
            title: "Lateral Raises",
            category: "Shoulders",
            difficulty: "Beginner",
            duration: "7:40",
            youtubeUrl: "https://www.youtube.com/watch?v=3VcKaXpzqRo",
            description: "Build wider shoulders with perfect lateral raise form.",
            targetMuscles: ["Side Delts", "Shoulders"],
        },
        {
            id: "22",
            title: "Lateral Raise Technique",
            category: "Shoulders",
            difficulty: "Beginner",
            duration: "8:15",
            youtubeUrl: "https://www.youtube.com/watch?v=kDqklk1ZESo",
            description: "Perfect your lateral raises for maximum shoulder width.",
            targetMuscles: ["Side Delts", "Shoulders"],
        },

        // Arm Exercises
        {
            id: "23",
            title: "Bicep Curl Mastery",
            category: "Arms",
            difficulty: "Beginner",
            duration: "7:20",
            youtubeUrl: "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
            description: "Perfect your bicep curl form and learn different variations.",
            targetMuscles: ["Biceps", "Forearms"],
        },
        {
            id: "24",
            title: "Bicep Curl Variations",
            category: "Arms",
            difficulty: "Beginner",
            duration: "9:10",
            youtubeUrl: "https://www.youtube.com/watch?v=av7-8igSXTs",
            description: "Explore different bicep curl variations for arm growth.",
            targetMuscles: ["Biceps", "Forearms"],
        },
        {
            id: "25",
            title: "Tricep Dips Tutorial",
            category: "Arms",
            difficulty: "Intermediate",
            duration: "8:15",
            youtubeUrl: "https://www.youtube.com/watch?v=6kALZikXxLc",
            description: "Learn proper tricep dip form for maximum tricep activation.",
            targetMuscles: ["Triceps", "Chest", "Shoulders"],
        },
        {
            id: "26",
            title: "Tricep Dips - Advanced",
            category: "Arms",
            difficulty: "Intermediate",
            duration: "7:50",
            youtubeUrl: "https://www.youtube.com/watch?v=0326dy_-CzM",
            description: "Advanced tricep dip techniques for bigger arms.",
            targetMuscles: ["Triceps", "Chest", "Shoulders"],
        },

        // Core Exercises
        {
            id: "27",
            title: "Plank Fundamentals",
            category: "Core",
            difficulty: "Beginner",
            duration: "9:30",
            youtubeUrl: "https://www.youtube.com/watch?v=ASdvN_XEl_c",
            description: "Master the plank for a strong, stable core.",
            targetMuscles: ["Abs", "Core", "Lower Back"],
        },
        {
            id: "28",
            title: "Plank Variations",
            category: "Core",
            difficulty: "Beginner",
            duration: "8:45",
            youtubeUrl: "https://www.youtube.com/watch?v=pvIjsG5Svck",
            description: "Different plank variations to strengthen your core effectively.",
            targetMuscles: ["Abs", "Core", "Lower Back"],
        },
        {
            id: "29",
            title: "Crunches Tutorial",
            category: "Core",
            difficulty: "Beginner",
            duration: "6:30",
            youtubeUrl: "https://www.youtube.com/watch?v=Xyd_fa5zoEU",
            description: "Perfect your crunch technique for defined abs.",
            targetMuscles: ["Abs", "Core"],
        },
        {
            id: "30",
            title: "Crunch Variations",
            category: "Core",
            difficulty: "Beginner",
            duration: "7:20",
            youtubeUrl: "https://www.youtube.com/watch?v=MKmrqcoCZ-M",
            description: "Different crunch variations for complete ab development.",
            targetMuscles: ["Abs", "Core"],
        },
        {
            id: "31",
            title: "Russian Twists",
            category: "Core",
            difficulty: "Intermediate",
            duration: "8:00",
            youtubeUrl: "https://www.youtube.com/watch?v=wkD8rjkodUI",
            description: "Build oblique strength with Russian twists.",
            targetMuscles: ["Obliques", "Core", "Abs"],
        },
        {
            id: "32",
            title: "Russian Twist Technique",
            category: "Core",
            difficulty: "Intermediate",
            duration: "7:15",
            youtubeUrl: "https://www.youtube.com/watch?v=JyUqwkVpsi8",
            description: "Master the Russian twist for a stronger core.",
            targetMuscles: ["Obliques", "Core", "Abs"],
        },

        // Cardio Exercises
        {
            id: "33",
            title: "HIIT Workout",
            category: "Cardio",
            difficulty: "Intermediate",
            duration: "20:00",
            youtubeUrl: "https://www.youtube.com/watch?v=ml6cT4AZdqI",
            description: "High-intensity interval training for maximum fat burn.",
            targetMuscles: ["Full Body", "Cardio"],
        },
        {
            id: "34",
            title: "HIIT Training Guide",
            category: "Cardio",
            difficulty: "Intermediate",
            duration: "18:30",
            youtubeUrl: "https://www.youtube.com/watch?v=cZnsLVArIt8",
            description: "Complete HIIT training guide for beginners and advanced.",
            targetMuscles: ["Full Body", "Cardio"],
        },
        {
            id: "35",
            title: "Running Form",
            category: "Cardio",
            difficulty: "Beginner",
            duration: "12:00",
            youtubeUrl: "https://www.youtube.com/watch?v=brFHyOtTwH4",
            description: "Improve your running form for better performance and injury prevention.",
            targetMuscles: ["Legs", "Cardio"],
        },
        {
            id: "36",
            title: "Running Technique",
            category: "Cardio",
            difficulty: "Beginner",
            duration: "10:45",
            youtubeUrl: "https://www.youtube.com/watch?v=_kGESn8ArrU",
            description: "Master proper running technique for efficiency.",
            targetMuscles: ["Legs", "Cardio"],
        },
        {
            id: "37",
            title: "Burpees - Full Body",
            category: "Cardio",
            difficulty: "Intermediate",
            duration: "6:30",
            youtubeUrl: "https://www.youtube.com/watch?v=TU8QYVW0gDU",
            description: "High-intensity full-body exercise for cardio and strength.",
            targetMuscles: ["Full Body", "Core", "Legs"],
        },
        {
            id: "38",
            title: "Burpee Variations",
            category: "Cardio",
            difficulty: "Intermediate",
            duration: "8:20",
            youtubeUrl: "https://www.youtube.com/watch?v=JZQA08SlJnM",
            description: "Different burpee variations to challenge yourself.",
            targetMuscles: ["Full Body", "Core", "Legs"],
        },

        // Full Body Workouts
        {
            id: "39",
            title: "Full Body Workout",
            category: "Full Body",
            difficulty: "Intermediate",
            duration: "30:00",
            youtubeUrl: "https://www.youtube.com/watch?v=UBMk30rjy0o",
            description: "Complete full-body workout routine for overall fitness.",
            targetMuscles: ["Full Body", "All Muscles"],
        },
        {
            id: "40",
            title: "Total Body Training",
            category: "Full Body",
            difficulty: "Intermediate",
            duration: "25:00",
            youtubeUrl: "https://www.youtube.com/watch?v=Yz6PmHcYbN0",
            description: "Total body training for strength and endurance.",
            targetMuscles: ["Full Body", "All Muscles"],
        },
        {
            id: "41",
            title: "Abs Workout",
            category: "Core",
            difficulty: "Intermediate",
            duration: "15:00",
            youtubeUrl: "https://www.youtube.com/watch?v=DHD1-2P94DI",
            description: "Intense ab workout for a six-pack.",
            targetMuscles: ["Abs", "Core"],
        },
        {
            id: "42",
            title: "Six Pack Abs",
            category: "Core",
            difficulty: "Advanced",
            duration: "20:00",
            youtubeUrl: "https://www.youtube.com/watch?v=1919eTCoESo",
            description: "Advanced ab routine for defined six-pack abs.",
            targetMuscles: ["Abs", "Core", "Obliques"],
        },

        // Weight Loss Specific
        {
            id: "43",
            title: "Weight Loss Workout",
            category: "Weight Loss",
            difficulty: "Beginner",
            duration: "25:00",
            youtubeUrl: "https://www.youtube.com/watch?v=2MicE75thDQ",
            description: "Effective workout routine designed for weight loss.",
            targetMuscles: ["Full Body", "Cardio"],
        },
        {
            id: "44",
            title: "Fat Burning Workout",
            category: "Weight Loss",
            difficulty: "Intermediate",
            duration: "22:00",
            youtubeUrl: "https://www.youtube.com/watch?v=kZDvg92tTMc",
            description: "High-intensity fat burning workout for rapid results.",
            targetMuscles: ["Full Body", "Cardio"],
        },
        {
            id: "45",
            title: "Fat Burning HIIT",
            category: "Weight Loss",
            difficulty: "Intermediate",
            duration: "20:00",
            youtubeUrl: "https://www.youtube.com/watch?v=ml6cT4AZdqI",
            description: "HIIT workout specifically designed for fat loss.",
            targetMuscles: ["Full Body", "Cardio"],
        },
        {
            id: "46",
            title: "Cardio Fat Burn",
            category: "Weight Loss",
            difficulty: "Intermediate",
            duration: "18:30",
            youtubeUrl: "https://www.youtube.com/watch?v=cZnsLVArIt8",
            description: "Cardio-focused workout for maximum fat burning.",
            targetMuscles: ["Full Body", "Cardio"],
        },
        {
            id: "47",
            title: "Home Workout - Full Body",
            category: "Full Body",
            difficulty: "Beginner",
            duration: "30:00",
            youtubeUrl: "https://www.youtube.com/watch?v=UBMk30rjy0o",
            description: "Complete home workout requiring no equipment.",
            targetMuscles: ["Full Body", "All Muscles"],
        },
        {
            id: "48",
            title: "Home Training Routine",
            category: "Full Body",
            difficulty: "Beginner",
            duration: "25:00",
            youtubeUrl: "https://www.youtube.com/watch?v=Yz6PmHcYbN0",
            description: "Effective home training routine for all fitness levels.",
            targetMuscles: ["Full Body", "All Muscles"],
        },
        {
            id: "49",
            title: "Beginner Workout Guide",
            category: "Full Body",
            difficulty: "Beginner",
            duration: "20:00",
            youtubeUrl: "https://www.youtube.com/watch?v=oAPCPjnU1wA",
            description: "Perfect workout routine for complete beginners.",
            targetMuscles: ["Full Body", "All Muscles"],
        },
        {
            id: "50",
            title: "Beginner Fat Loss",
            category: "Weight Loss",
            difficulty: "Beginner",
            duration: "25:00",
            youtubeUrl: "https://www.youtube.com/watch?v=2MicE75thDQ",
            description: "Beginner-friendly workout for weight loss and fitness.",
            targetMuscles: ["Full Body", "Cardio"],
        },
    ];

    const categories = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio", "Full Body", "Weight Loss"];

    const filteredTutorials = tutorials.filter((tutorial) => {
        const matchesSearch =
            tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tutorial.targetMuscles.some((muscle) =>
                muscle.toLowerCase().includes(searchQuery.toLowerCase())
            );
        const matchesCategory = selectedCategory === "All" || tutorial.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "Beginner":
                return "bg-green-500/10 text-green-500 border-green-500/20";
            case "Intermediate":
                return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            case "Advanced":
                return "bg-red-500/10 text-red-500 border-red-500/20";
            default:
                return "bg-gray-500/10 text-gray-500 border-gray-500/20";
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "Chest":
            case "Arms":
                return <Dumbbell className="h-4 w-4" />;
            case "Core":
                return <Target className="h-4 w-4" />;
            case "Cardio":
                return <Heart className="h-4 w-4" />;
            default:
                return <Zap className="h-4 w-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                        <Youtube className="h-10 w-10 text-red-500" />
                        Exercise Tutorials
                    </h1>
                    <p className="text-muted-foreground">
                        Learn proper form and technique with curated YouTube tutorials
                    </p>
                </div>

                {/* Search and Filter */}
                <div className="mb-8 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search exercises, muscles, or keywords..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <Badge
                                key={category}
                                variant={selectedCategory === category ? "default" : "outline"}
                                className="cursor-pointer hover:bg-primary/80 transition-colors px-4 py-2"
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Tutorial Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTutorials.map((tutorial) => (
                        <Card
                            key={tutorial.id}
                            className="hover:border-primary/50 transition-all hover:shadow-lg group"
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {getCategoryIcon(tutorial.category)}
                                        <Badge variant="outline" className="text-xs">
                                            {tutorial.category}
                                        </Badge>
                                    </div>
                                    <Badge className={getDifficultyColor(tutorial.difficulty)}>
                                        {tutorial.difficulty}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                    {tutorial.title}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    Duration: {tutorial.duration}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">{tutorial.description}</p>

                                <div className="mb-4">
                                    <p className="text-xs font-semibold mb-2 text-muted-foreground">Target Muscles:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {tutorial.targetMuscles.map((muscle, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {muscle}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <a
                                    href={tutorial.youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors"
                                >
                                    <Youtube className="h-5 w-5" />
                                    Watch Tutorial
                                </a>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* No Results */}
                {filteredTutorials.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground text-lg">
                            No tutorials found. Try adjusting your search or filters.
                        </p>
                    </div>
                )}

                {/* Results Count */}
                <div className="mt-8 text-center text-sm text-muted-foreground">
                    Showing {filteredTutorials.length} of {tutorials.length} tutorials
                </div>
            </div>
        </div>
    );
};

export default ExerciseTutorials;
