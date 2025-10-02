import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Target, Heart, Brain, Lightbulb, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SianiAvatar from '@/components/siani-avatar';

interface IntakeStage {
  stage: number;
  name: string;
  tone: string;
  questions: string[];
  prompt: string;
}

interface IntakeResponse {
  stage: number;
  responses: string[];
  insights: string[];
  nextStage?: number;
  completed: boolean;
  stageInfo?: IntakeStage;
}

interface IntakeSession {
  message: string;
  stage: number;
  totalStages: number;
  stageInfo: IntakeStage;
}

export default function GoalFocusedIntake() {
  const [currentStage, setCurrentStage] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{type: 'ai' | 'user', message: string, stage?: number}>>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript.trim());
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  // Start intake session
  const startIntakeMutation = useMutation({
    mutationFn: async (): Promise<IntakeSession> => {
      const response = await fetch('/api/intake/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to start intake');
      return response.json();
    },
    onSuccess: (data) => {
      setSessionStarted(true);
      setCurrentStage(data.stage);
      setConversationHistory([{
        type: 'ai',
        message: data.message,
        stage: data.stage
      }]);
      
      // Speak the opening message
      speakText(data.message);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start intake session",
        variant: "destructive"
      });
    }
  });

  // Process intake input
  const processInputMutation = useMutation({
    mutationFn: async ({ userInput, stage }: { userInput: string, stage: number }): Promise<IntakeResponse> => {
      const response = await fetch('/api/intake/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput, currentStage: stage })
      });
      if (!response.ok) throw new Error('Failed to process input');
      return response.json();
    },
    onSuccess: (data) => {
      // Add AI response to conversation
      setConversationHistory(prev => [
        ...prev,
        { type: 'ai', message: data.responses[0], stage: data.nextStage }
      ]);
      
      // Update current stage
      if (data.nextStage && data.nextStage !== currentStage) {
        setCurrentStage(data.nextStage);
      }
      
      // Speak the response
      speakText(data.responses[0]);
      
      // Show insights if any
      if (data.insights.length > 0) {
        toast({
          title: "Insight Captured",
          description: data.insights[0],
          duration: 5000
        });
      }
      
      // Check if completed
      if (data.completed) {
        toast({
          title: "Intake Complete!",
          description: "Your goal-focused intake session is complete. Ready to build your action plan!",
          duration: 8000
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process your response",
        variant: "destructive"
      });
    }
  });

  const speakText = async (text: string) => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      } else {
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('TTS error:', error);
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      toast({
        title: "Voice not supported",
        description: "Please type your response instead",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognition.start();
      setIsListening(true);
    }
  };

  const submitResponse = () => {
    if (!transcript.trim()) return;
    
    // Add user response to conversation
    setConversationHistory(prev => [
      ...prev,
      { type: 'user', message: transcript }
    ]);
    
    // Process the input
    processInputMutation.mutate({
      userInput: transcript,
      stage: currentStage
    });
    
    setTranscript('');
  };

  const getStageIcon = (stage: number) => {
    switch (stage) {
      case 1: return <Target className="h-4 w-4" />;
      case 2: return <Heart className="h-4 w-4" />;
      case 3: return <Target className="h-4 w-4" />;
      case 4: return <Brain className="h-4 w-4" />;
      case 5: return <Lightbulb className="h-4 w-4" />;
      case 6: return <Target className="h-4 w-4" />;
      case 7: return <CheckCircle className="h-4 w-4" />;
      case 8: return <Lightbulb className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getStageName = (stage: number) => {
    const stageNames = [
      'Personal Information',
      'Justice System History', 
      'Immediate Needs',
      'Self-Discovery Exercise',
      'Mission + Life Statement',
      'Visioning + Goal Expansion',
      'Prioritization + Action',
      'Strategy + Unblocking'
    ];
    return stageNames[stage - 1] || 'Unknown Stage';
  };

  if (!sessionStarted) {
    return (
      <div className="space-y-6 bg-gradient-to-b from-[#55000A] to-black min-h-screen p-6">
        <Card className="bg-gradient-to-br from-[#55000A]/80 to-[#DD541C]/20 border-[#C65F58]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#EDCFB9]">
              <Target className="h-5 w-5 text-[#DD541C]" />
              Goal-Focused Intake & Needs Assessment
            </CardTitle>
            <CardDescription className="text-[#EDCFB9]/80">
              A 25-30 minute self-discovery workshop with SIANI to build a life that works for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-6">
              {/* SIANI Avatar */}
              <SianiAvatar size="lg" isActive={true} />
              
              <h3 className="text-xl font-semibold text-[#EDCFB9]">Ready to Reset and Reclaim Your Direction?</h3>
              <p className="text-[#EDCFB9]/80 max-w-md mx-auto">
                This isn't just an intake — it's a reset. A moment to get clear, discover who you are, 
                what you need, and what's possible.
              </p>
              <Button 
                onClick={() => startIntakeMutation.mutate()}
                disabled={startIntakeMutation.isPending}
                size="lg"
                className="bg-gradient-to-r from-[#DD541C] to-[#C65F58] hover:from-[#DD541C]/90 hover:to-[#C65F58]/90 text-white border-0"
              >
                {startIntakeMutation.isPending ? 'Starting...' : 'Begin Your Journey'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gradient-to-b from-[#55000A] to-black min-h-screen p-4">
      {/* Progress Header with SIANI Design */}
      <Card className="bg-gradient-to-br from-[#55000A]/80 to-[#DD541C]/20 border-[#C65F58]/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStageIcon(currentStage)}
              <CardTitle className="text-[#EDCFB9]">Stage {currentStage}: {getStageName(currentStage)}</CardTitle>
            </div>
            <Badge variant="outline" className="border-[#C65F58] text-[#EDCFB9]">{currentStage} of 8</Badge>
          </div>
          <Progress value={(currentStage / 8) * 100} className="mt-2" />
        </CardHeader>
      </Card>

      {/* SIANI Avatar - Always visible when speaking */}
      <div className="flex justify-center">
        <SianiAvatar 
          isActive={true}
          isSpeaking={processInputMutation.isPending}
          size="md"
        />
      </div>

      {/* Conversation History */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {conversationHistory.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}>
                  <p className="text-sm">{message.message}</p>
                  {message.stage && (
                    <div className="text-xs opacity-70 mt-1">
                      Stage {message.stage}: {getStageName(message.stage)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice Input Interface */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={toggleListening}
                variant={isListening ? "destructive" : "default"}
                size="lg"
                className="flex-shrink-0"
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isListening ? 'Stop' : 'Talk'}
              </Button>
              
              <div className="flex-1">
                <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 min-h-[60px]">
                  {transcript || (isListening ? 'Listening...' : 'Click Talk to respond')}
                </div>
              </div>
              
              <Button 
                onClick={submitResponse}
                disabled={!transcript.trim() || processInputMutation.isPending}
                size="lg"
              >
                {processInputMutation.isPending ? 'Processing...' : 'Send'}
              </Button>
            </div>
            
            {isListening && (
              <div className="flex justify-center">
                <div className="animate-pulse flex space-x-1">
                  <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                  <div className="w-2 h-6 bg-blue-400 rounded-full"></div>
                  <div className="w-2 h-10 bg-blue-600 rounded-full"></div>
                  <div className="w-2 h-4 bg-blue-300 rounded-full"></div>
                  <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Current Focus</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currentStage <= 3 && "We're getting grounded in your current reality and immediate needs."}
            {currentStage >= 4 && currentStage <= 5 && "Now we're exploring your deeper purpose and mission."}
            {currentStage >= 6 && currentStage <= 7 && "Time to expand your vision and prioritize your goals."}
            {currentStage === 8 && "Let's identify what might be blocking you and create breakthrough strategies."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}