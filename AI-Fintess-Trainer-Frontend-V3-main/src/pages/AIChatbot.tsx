import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Send, Bot, User, Mic, Volume2, Youtube, Trash2, Dumbbell, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
  tutorials?: Tutorial[];
}

interface Tutorial {
  exercise: string;
  links: string[];
}

const AIChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [autoPlayTTS, setAutoPlayTTS] = useState(true); // Auto-play TTS by default
  const { toast } = useToast();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Backend API URL - Update this to your FastAPI server URL
  const API_BASE_URL = import.meta.env.VITE_ASSISTANT_API_URL || "https://fyp-assistent-4ej8.onrender.com"; // Deployed backend on Render

  useEffect(() => {
    checkAuth();
    loadChatHistory();
    checkFirstVisit();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const checkFirstVisit = () => {
    const hasVisited = localStorage.getItem("fitbot_visited");
    if (!hasVisited) {
      setShowWelcome(true);
      localStorage.setItem("fitbot_visited", "true");
    }
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const loadChatHistory = () => {
    const stored = localStorage.getItem("fitbot_chat_history");
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }
  };

  const saveChatHistory = (newMessages: Message[]) => {
    localStorage.setItem("fitbot_chat_history", JSON.stringify(newMessages));
  };

  const handleSend = async () => {
    if (!input.trim() || !userId) return;

    const userMessage = input.trim();
    setInput("");

    const newUserMessage: Message = { role: "user", content: userMessage };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Prepare chat history for API
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          user_id: userId,
          chat_history: chatHistory
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      const aiMessage: Message = {
        role: "assistant",
        content: data.reply || "No response received.",
        tutorials: data.tutorials || []
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);

      // Auto-play TTS for AI response (if enabled)
      if (autoPlayTTS && aiMessage.content && aiMessage.content !== "No response received.") {
        setTimeout(() => {
          handleTextToSpeech(aiMessage.content);
        }, 500); // Small delay to ensure message is rendered
      }

    } catch (error: any) {
      toast({
        title: "Connection Error",
        description: `Failed to connect to FitBot API. Make sure the backend is running at ${API_BASE_URL}`,
        variant: "destructive",
      });

      // Remove the user message if API failed
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.wav");

        try {
          const response = await fetch(`${API_BASE_URL}/stt`, {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            setInput(data.transcript || "");
            toast({
              title: "Voice Recognized!",
              description: "Your speech has been converted to text.",
            });
          } else {
            throw new Error("Speech recognition failed");
          }
        } catch (error) {
          toast({
            title: "Voice Input Failed",
            description: "Could not convert speech to text. Please try again.",
            variant: "destructive",
          });
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();

      // Stop recording after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 5000);

    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  };

  const handleTextToSpeech = async (text: string) => {
    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
      toast({
        title: "Audio Stopped",
        description: "Voice playback has been stopped.",
      });
      return;
    }

    try {
      setIsSpeaking(true);

      // Add timeout for TTS request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${API_BASE_URL}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language_code: "en" }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          toast({
            title: "Playback Error",
            description: "Could not play audio.",
            variant: "destructive",
          });
        };

        audio.play();

        toast({
          title: "Playing Audio",
          description: "Listen to the AI response.",
        });
      } else {
        throw new Error("TTS failed");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({
          title: "Request Timeout",
          description: "Text-to-speech took too long. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Text-to-Speech Failed",
          description: "Could not convert text to speech. Please try again.",
          variant: "destructive",
        });
      }
      setIsSpeaking(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("fitbot_chat_history");
    toast({
      title: "Chat Cleared",
      description: "Your conversation history has been cleared.",
    });
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    let formatted = content;

    // Bold text **text**
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br/>');

    return formatted;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Dumbbell className="h-10 w-10 text-primary" />
              FitBot - AI Fitness Coach
            </h1>
            <p className="text-muted-foreground">
              Your personal AI trainer for workouts, nutrition, and fitness guidance
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoPlayTTS ? "default" : "outline"}
              onClick={() => setAutoPlayTTS(!autoPlayTTS)}
              className="gap-2"
            >
              <Volume2 className="h-4 w-4" />
              Auto-Play {autoPlayTTS ? "ON" : "OFF"}
            </Button>
            <Button variant="outline" onClick={clearChat} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear Chat
            </Button>
          </div>
        </div>

        <Card className="h-[calc(100vh-280px)] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Chat with Your AI Coach
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Ask about workouts, nutrition, form tips, or get personalized training plans
            </p>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Welcome to FitBot!</h3>
                    <p className="text-muted-foreground mb-4">
                      I'm your AI fitness coach. I can help you with:
                    </p>
                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-sm">
                      <Badge variant="outline" className="py-2">💪 Workout Plans</Badge>
                      <Badge variant="outline" className="py-2">🥗 Nutrition Advice</Badge>
                      <Badge variant="outline" className="py-2">🎯 Form Tips</Badge>
                      <Badge variant="outline" className="py-2">📊 Progress Tracking</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Start by telling me your fitness goals!
                    </p>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div key={index}>
                    <div
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <div className="bg-primary/10 p-2 rounded-full h-fit">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                      )}

                      <div className="flex flex-col gap-2 max-w-[75%]">
                        <div
                          className={`rounded-2xl p-5 shadow-sm ${message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border"
                            }`}
                        >
                          <div
                            className="text-base leading-relaxed whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                          />
                        </div>

                        {message.role === "assistant" && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTextToSpeech(message.content)}
                              className="h-8 gap-1"
                            >
                              <Volume2 className="h-3 w-3" />
                              {isSpeaking ? "Stop" : "Listen"}
                            </Button>
                          </div>
                        )}

                        {/* YouTube Tutorial Links */}
                        {message.tutorials && message.tutorials.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                              <Youtube className="h-3 w-3 text-red-500" />
                              Recommended Tutorials:
                            </p>
                            {message.tutorials.map((tutorial, tutIdx) => (
                              <Card key={tutIdx} className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200 dark:border-red-800">
                                <CardContent className="p-4">
                                  <p className="text-base font-bold mb-3 flex items-center gap-2">
                                    <Youtube className="h-4 w-4 text-red-500" />
                                    {tutorial.exercise}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {tutorial.links.map((link, linkIdx) => (
                                      <a
                                        key={linkIdx}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 shadow-sm"
                                      >
                                        <Youtube className="h-4 w-4" />
                                        Video {linkIdx + 1}
                                      </a>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>

                      {message.role === "user" && (
                        <div className="bg-primary/10 p-2 rounded-full h-fit">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3">
                    <div className="bg-primary/10 p-2 rounded-full h-fit">
                      <Bot className="h-5 w-5 text-primary animate-pulse" />
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-6 border-t border-border bg-card">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleVoiceInput}
                  disabled={loading || isRecording}
                  className={isRecording ? "animate-pulse bg-red-500 text-white" : ""}
                >
                  <Mic className="h-4 w-4" />
                </Button>

                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Ask about workouts, nutrition, or get a personalized plan..."
                  disabled={loading}
                  className="flex-1"
                />

                <Button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-2 text-center">
                {isRecording ? "🎤 Recording... (5 seconds max)" : "Press Enter to send, Shift+Enter for new line"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Dialog */}
        <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="h-6 w-6 text-primary" />
                Welcome to FitBot - Your AI Fitness Coach!
              </DialogTitle>
              <DialogDescription className="text-base pt-4">
                I'm here to help you achieve your fitness goals with personalized workout plans,
                nutrition advice, and exercise guidance.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  What I Can Do For You:
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <div className="text-2xl">💪</div>
                    <div>
                      <p className="font-medium text-sm">Custom Workout Plans</p>
                      <p className="text-xs text-muted-foreground">Tailored to your goals & schedule</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <div className="text-2xl">🥗</div>
                    <div>
                      <p className="font-medium text-sm">Nutrition Guidance</p>
                      <p className="text-xs text-muted-foreground">Meal plans & diet tips</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <div className="text-2xl">🎯</div>
                    <div>
                      <p className="font-medium text-sm">Form & Technique</p>
                      <p className="text-xs text-muted-foreground">Proper exercise execution</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <div className="text-2xl">📹</div>
                    <div>
                      <p className="font-medium text-sm">Video Tutorials</p>
                      <p className="text-xs text-muted-foreground">YouTube links for exercises</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  How It Works:
                </h3>
                <ol className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">1.</span>
                    <span>Tell me your fitness goal (weight loss, muscle gain, etc.)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">2.</span>
                    <span>Answer a few quick questions about your situation</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">3.</span>
                    <span>Get a personalized workout plan with YouTube tutorials</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">4.</span>
                    <span>Ask follow-up questions anytime!</span>
                  </li>
                </ol>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Mic className="h-5 w-5 text-primary" />
                <p className="text-sm">
                  <strong>Pro Tip:</strong> Use the microphone button for voice input,
                  and click "Listen" to hear responses!
                </p>
              </div>

              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Ready to start your fitness journey? Click any example below:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => {
                      setInput("I want to lose weight and build muscle");
                      setShowWelcome(false);
                    }}
                  >
                    💬 I want to lose weight and build muscle
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => {
                      setInput("Create a 5-day workout plan for me");
                      setShowWelcome(false);
                    }}
                  >
                    💪 Create a 5-day workout plan
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => {
                      setInput("I'm a beginner, help me get started");
                      setShowWelcome(false);
                    }}
                  >
                    🎯 I'm a beginner, help me start
                  </Badge>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowWelcome(false);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="flex-1 gap-2"
              >
                Just Browse
              </Button>
              <Button
                onClick={() => {
                  setShowWelcome(false);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="flex-1 gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Let's Get Started!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AIChatbot;
