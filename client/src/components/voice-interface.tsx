import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mic, MicOff, AlertTriangle, Wifi, WifiOff, Volume2, VolumeX, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { voiceService } from "@/lib/voice";
import { processVoiceInput } from "@/lib/openai";
import SianiAvatar from "@/components/siani-avatar";
import DebugOverlay from "@/components/debug-overlay";
import sianiPortrait from "@assets/F3FA47B8-35EC-49A8-9B1E-729A9F42D6FE_1753793540318.jpeg";

interface VoiceInterfaceProps {
  personalizedGreeting?: string;
  coachingStyle?: string;
  userPreferences?: any;
}

// Enhanced error types for better handling
type VoiceErrorType = 
  | 'permission_denied' 
  | 'network_error' 
  | 'not_supported' 
  | 'audio_context_error' 
  | 'speech_synthesis_error'
  | 'recognition_error'
  | 'timeout_error'
  | 'quota_exceeded'
  | 'unknown_error';

interface VoiceError {
  type: VoiceErrorType;
  message: string;
  canRetry: boolean;
  suggestedAction?: string;
}

export default function VoiceInterface({ personalizedGreeting, coachingStyle, userPreferences }: VoiceInterfaceProps = {}) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(personalizedGreeting || "Hi! I'm SIANI - here to remind you of who you already are. When life gets chaotic, I'll walk with you and help you remember your inner strength. Ready?");
  const [currentError, setCurrentError] = useState<VoiceError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const portraitRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const maxRetries = 3;

  // Enhanced error classification function
  const classifyVoiceError = (error: any): VoiceError => {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorLower = errorMessage.toLowerCase();

    if (errorLower.includes('permission') || errorLower.includes('not-allowed')) {
      return {
        type: 'permission_denied',
        message: 'Microphone access is needed for voice conversations',
        canRetry: true,
        suggestedAction: 'Please allow microphone access in your browser settings'
      };
    }

    if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('connection')) {
      return {
        type: 'network_error',
        message: 'Network connection issue affecting voice services',
        canRetry: true,
        suggestedAction: 'Check your internet connection and try again'
      };
    }

    if (errorLower.includes('not supported') || errorLower.includes('unsupported')) {
      return {
        type: 'not_supported',
        message: 'Voice features are not supported in this browser',
        canRetry: false,
        suggestedAction: 'Please use Chrome, Safari, or Firefox for voice features'
      };
    }

    if (errorLower.includes('audio') || errorLower.includes('audiocontext')) {
      return {
        type: 'audio_context_error',
        message: 'Audio system initialization failed',
        canRetry: true,
        suggestedAction: 'Try interacting with the page first, then restart voice'
      };
    }

    if (errorLower.includes('speech') || errorLower.includes('synthesis')) {
      return {
        type: 'speech_synthesis_error',
        message: 'Voice playback system encountered an issue',
        canRetry: true,
        suggestedAction: 'Voice will continue with text-only responses'
      };
    }

    if (errorLower.includes('quota') || errorLower.includes('rate limit')) {
      return {
        type: 'quota_exceeded',
        message: 'Voice service temporarily unavailable',
        canRetry: false,
        suggestedAction: 'Please wait a moment before trying again'
      };
    }

    if (errorLower.includes('timeout') || errorLower.includes('time')) {
      return {
        type: 'timeout_error',
        message: 'Voice recognition timed out',
        canRetry: true,
        suggestedAction: 'Speak clearly and try again'
      };
    }

    if (errorLower.includes('recognition') || errorLower.includes('no-speech')) {
      return {
        type: 'recognition_error',
        message: 'Could not understand speech clearly',
        canRetry: true,
        suggestedAction: 'Speak clearly and ensure your microphone is working'
      };
    }

    return {
      type: 'unknown_error',
      message: 'An unexpected error occurred with voice services',
      canRetry: true,
      suggestedAction: 'Try restarting the voice conversation'
    };
  };

  // Enhanced error recovery function
  const handleVoiceError = async (error: any, context: 'recognition' | 'synthesis' | 'processing') => {
    console.error(`Voice error in ${context}:`, error);
    
    const voiceError = classifyVoiceError(error);
    setCurrentError(voiceError);

    // Provide context-specific user feedback
    const contextualMessage = {
      recognition: `I had trouble hearing you. ${voiceError.message}`,
      synthesis: `I'm having trouble speaking right now. ${voiceError.message}`,
      processing: `I encountered an issue processing your message. ${voiceError.message}`
    }[context];

    setVoiceStatus(contextualMessage);

    // Show appropriate toast notification
    toast({
      title: "Voice System Notice",
      description: voiceError.suggestedAction || voiceError.message,
      variant: voiceError.type === 'permission_denied' ? "destructive" : "default",
      duration: 5000,
    });

    // Attempt automatic recovery for retryable errors
    if (voiceError.canRetry && retryCount < maxRetries && !isRecovering) {
      setIsRecovering(true);
      setRetryCount(prev => prev + 1);

      // Delay before retry based on error type
      const retryDelay = {
        permission_denied: 2000,
        network_error: 3000,
        not_supported: 5000,
        audio_context_error: 1500,
        speech_synthesis_error: 1000,
        recognition_error: 1000,
        timeout_error: 2000,
        quota_exceeded: 5000,
        unknown_error: 2000
      }[voiceError.type] || 2000;

      setTimeout(async () => {
        try {
          console.log(`Attempting recovery for ${voiceError.type}, retry ${retryCount + 1}/${maxRetries}`);
          
          if (context === 'recognition' && isVoiceActive) {
            setVoiceStatus("Trying to reconnect... I'm still here with you.");
            await attemptVoiceRecovery();
          } else if (context === 'synthesis') {
            setVoiceStatus("Voice restored. How can I support you today?");
          }
          
          setCurrentError(null);
          setIsRecovering(false);
        } catch (recoveryError) {
          console.error('Recovery attempt failed:', recoveryError);
          setIsRecovering(false);
          
          if (retryCount >= maxRetries - 1) {
            setVoiceStatus("Voice features are temporarily unavailable. You can still interact through text or try refreshing the page.");
            setIsVoiceActive(false);
          }
        }
      }, retryDelay);
    } else if (!voiceError.canRetry) {
      // For non-retryable errors, provide alternative guidance
      setVoiceStatus("Let's continue our conversation. Voice may not be available right now, but I'm still here to support you.");
      setIsVoiceActive(false);
    }
  };

  // Voice recovery function
  const attemptVoiceRecovery = async () => {
    if (!voiceService.isSupported()) {
      throw new Error('Voice not supported');
    }

    // Test microphone access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Clean up test stream
    } catch (permError) {
      throw new Error('Microphone permission required');
    }

    // Restart voice recognition
    voiceService.startListening(
      (transcript) => {
        if (transcript.trim()) {
          setVoiceStatus("Processing your message...");
          voiceMutation.mutate(transcript);
        }
      },
      (error) => handleVoiceError(error, 'recognition')
    );
  };

  // Manual retry function for user-initiated recovery
  const retryVoiceConnection = async () => {
    setCurrentError(null);
    setRetryCount(0);
    setIsRecovering(true);
    
    try {
      setVoiceStatus("Reconnecting voice services...");
      await attemptVoiceRecovery();
      setVoiceStatus("Voice connection restored! I'm listening...");
      setIsRecovering(false);
      
      toast({
        title: "Voice Restored",
        description: "Voice conversation is ready to continue",
        variant: "default",
      });
    } catch (error) {
      handleVoiceError(error, 'recognition');
    }
  };

  const voiceMutation = useMutation({
    mutationFn: processVoiceInput,
    onSuccess: async (response) => {
      console.log('AI response received:', response);
      setVoiceStatus("Speaking...");
      
      // Test speech synthesis first
      if (!window.speechSynthesis) {
        console.error('Speech synthesis not supported');
        setVoiceStatus("Voice playback not supported in this browser");
        return;
      }

      // Try ElevenLabs first, fallback to browser TTS
      try {
        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: response })
        });

        if (ttsResponse.ok) {
          console.log('Using ElevenLabs premium voice synthesis');
          // Use ElevenLabs premium voice with enhanced quality
          const audioBlob = await ttsResponse.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          // Optimize audio playback for warmth and clarity
          audio.volume = 0.9;  // Increased volume for deployment consistency
          audio.preload = 'auto';
          
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            if (isVoiceActive) {
              setVoiceStatus("I'm here, listening with you...");
              // Restart listening for continuous conversation
              setTimeout(() => {
                if (isVoiceActive) {
                  console.log('🎧 ElevenLabs audio ended, restarting voice for continuous conversation');
                  startListeningAgain();
                }
              }, 1200); // Longer delay for more natural conversation rhythm
            } else {
              setVoiceStatus("I'm here when you need a gentle reminder of your strength.");
            }
          };
          
          audio.onerror = (audioError) => {
            console.log('ElevenLabs audio failed, falling back to browser TTS:', audioError);
            handleVoiceError(audioError, 'synthesis');
            voiceService.speak(response, () => {
              if (isVoiceActive) {
                setVoiceStatus("I'm here, listening with you...");
                // Restart listening for continuous conversation
                setTimeout(() => {
                  if (isVoiceActive) {
                    console.log('🎧 Browser TTS ended, restarting voice for continuous conversation');
                    startListeningAgain();
                  }
                }, 1200); // Consistent delay for natural conversation
              } else {
                setVoiceStatus("I'm here when you need a gentle reminder of your strength.");
              }
            });
          };
          
          await audio.play();
          console.log('Using ElevenLabs premium voice synthesis');
        } else {
          // Enhanced fallback to browser TTS with better voice settings
          const errorData = await ttsResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.log('ElevenLabs failed:', errorData.error, '- Using enhanced browser TTS fallback');
          handleVoiceError(new Error(`ElevenLabs TTS failed: ${errorData.error}`), 'synthesis');
          
          voiceService.speak(response, () => {
            if (isVoiceActive) {
              setVoiceStatus("I'm here, listening with you...");
              // Restart listening for continuous conversation
              setTimeout(() => {
                if (isVoiceActive) {
                  console.log('🎧 Browser TTS fallback ended, restarting voice');
                  startListeningAgain();
                }
              }, 1200);
            } else {
              setVoiceStatus("I'm here when you need a gentle reminder of your strength.");
            }
          });
        }
      } catch (error) {
        console.error('TTS error, using fallback:', error);
        handleVoiceError(error, 'synthesis');
        voiceService.speak(response, () => {
          if (isVoiceActive) {
            setVoiceStatus("I'm here, listening with you...");
            // Restart listening for continuous conversation
            setTimeout(() => {
              if (isVoiceActive) {
                console.log('🎧 TTS error fallback ended, restarting voice');
                startListeningAgain();
              }
            }, 1200);
          } else {
            setVoiceStatus("I'm here when you need a gentle reminder of your strength.");
          }
        });
      }
    },
    onError: (error) => {
      console.error("Voice processing failed:", error);
      handleVoiceError(error, 'processing');
      setIsVoiceActive(false);
    },
  });

  const startListeningAgain = () => {
    console.log('🔄 startListeningAgain called - isActive:', isVoiceActive, 'isSupported:', voiceService.isSupported(), 'isListening:', voiceService.isCurrentlyListening(), 'isPending:', voiceMutation.isPending);
    
    if (!isVoiceActive || !voiceService.isSupported()) {
      console.log('❌ Voice not active or not supported, skipping restart');
      return;
    }

    // Stop current listening session first to ensure clean restart
    if (voiceService.isCurrentlyListening()) {
      console.log('🛑 Stopping current voice session before restart');
      voiceService.stopListening();
    }

    // Wait a moment for cleanup, then restart - ignore pending state for conversation continuity
    setTimeout(() => {
      if (isVoiceActive) {
        console.log('✅ Starting fresh voice listening session...');
        
        try {
          voiceService.startListening(
            (transcript) => {
              console.log('🎯 New transcript received:', transcript);
              if (transcript.trim()) {
                setVoiceStatus("Processing your message...");
                voiceMutation.mutate(transcript);
              }
            },
            (error) => {
              console.error("🚨 Voice error during conversation:", error);
              
              // Handle specific errors more gracefully
              if (error.includes('not-allowed') || error.includes('permission')) {
                setVoiceStatus("Please allow microphone access in your browser settings to continue our conversation");
                setIsVoiceActive(false);
                toast({
                  title: "Microphone Permission Needed",
                  description: "Please allow microphone access in your browser settings to continue talking with SIANI.",
                  variant: "destructive",
                });
              } else if (error.includes('audio-capture')) {
                // Audio capture errors are common - retry after a moment
                console.log('⚠️ Audio capture issue, retrying in 2 seconds...');
                setTimeout(() => {
                  if (isVoiceActive) {
                    startListeningAgain();
                  }
                }, 2000);
              } else {
                console.log('🔄 Other voice error, will retry in 1 second...');
                setTimeout(() => {
                  if (isVoiceActive) {
                    startListeningAgain();
                  }
                }, 1000);
              }
            }
          );
        } catch (error) {
          console.error('❌ Failed to restart voice recognition:', error);
          setTimeout(() => {
            if (isVoiceActive) {
              startListeningAgain();
            }
          }, 2000);
        }
      } else {
        console.log('⏸️ Not restarting voice - voice inactive');
      }
    }, 500); // Increased cleanup time
  };

  const toggleVoice = () => {
    console.log('🎤 toggleVoice called - isVoiceActive:', isVoiceActive, 'isSupported:', voiceService.isSupported());
    
    if (!voiceService.isSupported()) {
      console.log('❌ Voice not supported in this browser');
      toast({
        title: "Voice Not Supported",
        description: "Your browser doesn't support voice recognition. Please use Chrome, Safari, or Firefox.",
        variant: "destructive",
      });
      return;
    }

    // Test speech synthesis when activating voice for the first time
    if (!isVoiceActive && window.speechSynthesis) {
      // Quick speech test to activate audio context in mobile browsers
      const testUtterance = new SpeechSynthesisUtterance('');
      testUtterance.volume = 0;
      window.speechSynthesis.speak(testUtterance);
    }

    if (isVoiceActive) {
      // Stop voice interaction
      voiceService.stopListening();
      setIsVoiceActive(false);
      setVoiceStatus("I'm here when you need a gentle reminder of your strength.");
      portraitRef.current?.classList.remove("voice-active");
    } else {
      // Start voice interaction
      setIsVoiceActive(true);
      setVoiceStatus("I'm here, listening with you...");
      portraitRef.current?.classList.add("voice-active");

      voiceService.startListening(
        (transcript) => {
          if (transcript.trim()) {
            setVoiceStatus("Processing your message...");
            voiceMutation.mutate(transcript);
          }
        },
        (error) => {
          console.error("Initial voice recognition error:", error);
          if (error.includes('not-allowed') || error.includes('permission')) {
            setVoiceStatus("Please allow microphone access in your browser settings");
            setIsVoiceActive(false);
            portraitRef.current?.classList.remove("voice-active");
            toast({
              title: "Microphone Permission Required",
              description: "SIANI needs microphone access to have voice conversations with you. Please allow access in your browser settings.",
              variant: "destructive",
            });
          } else {
            handleVoiceError(error, 'recognition');
            setIsVoiceActive(false);
            portraitRef.current?.classList.remove("voice-active");
          }
        }
      );
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup: stop listening when component unmounts
      voiceService.stopListening();
    };
  }, []);

  return (
    <div className="voice-interface flex flex-col items-center justify-center min-h-[70vh] space-y-8 px-6 relative">
      {/* Interactive SIANI Portrait with Pulsing Glow */}
      <div className="relative">
        {/* Outer glow rings */}
        <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
          isVoiceActive ? 'animate-ping opacity-20' : 'opacity-0'
        }`}>
          <div className="w-72 h-72 border border-white/20 rounded-full absolute -inset-8"></div>
        </div>
        <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
          isVoiceActive ? 'animate-pulse opacity-30' : 'opacity-0'
        }`}>
          <div className="w-64 h-64 border border-white/30 rounded-full absolute -inset-4"></div>
        </div>
        
        {/* SIANI Avatar with Glowing Circle */}
        <div ref={portraitRef}>
          <SianiAvatar 
            isActive={isVoiceActive}
            isSpeaking={voiceMutation.isPending || voiceStatus === "Speaking..."}
            size="xl"
          />
          
          {/* Interactive overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent transition-opacity duration-500 ${
            isVoiceActive ? 'opacity-60' : 'opacity-20'
          }`}></div>
        </div>
      </div>

      {/* Dynamic SIANI Name with Glow */}
      <div className="relative">
        <h1 className={`text-title-1 font-bold text-white tracking-tight transition-all duration-500 ${
          isVoiceActive ? 'text-shadow-lg text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : ''
        }`}>
          SIANI
        </h1>
      </div>

      {/* Enhanced Voice Status with Visual Feedback */}
      <div className="text-center space-y-4">
        <p className={`text-body transition-all duration-300 ${
          isVoiceActive ? 'text-white' : 'text-white/80'
        }`}>
          {voiceStatus}
        </p>
        
        {/* Error State UI */}
        {currentError && (
          <div className="mt-4 p-4 rounded-lg bg-black/40 border border-orange-500/30 backdrop-blur-sm max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              {currentError.type === 'network_error' && <WifiOff className="w-5 h-5 text-orange-400" />}
              {currentError.type === 'permission_denied' && <MicOff className="w-5 h-5 text-red-400" />}
              {currentError.type === 'audio_context_error' && <VolumeX className="w-5 h-5 text-yellow-400" />}
              {(currentError.type === 'unknown_error' || currentError.type === 'timeout_error') && <AlertTriangle className="w-5 h-5 text-orange-400" />}
              <span className="text-sm font-medium text-orange-200">Voice System Notice</span>
            </div>
            <p className="text-sm text-orange-300 mb-3">{currentError.suggestedAction}</p>
            
            {/* Recovery Controls */}
            {currentError.canRetry && !isRecovering && (
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => retryVoiceConnection()}
                  variant="outline"
                  size="sm"
                  className="bg-orange-500/20 border-orange-400/50 text-orange-200 hover:bg-orange-500/30 active:scale-95"
                  style={{ touchAction: 'manipulation' }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Connection
                </Button>
                {retryCount > 0 && (
                  <Button
                    onClick={() => {
                      setCurrentError(null);
                      setRetryCount(0);
                      setVoiceStatus("I'm here when you need a gentle reminder of your strength.");
                    }}
                    onTouchStart={() => console.log('👆 Dismiss button touched')}
                    variant="outline"
                    size="sm"
                    className="bg-gray-500/20 border-gray-400/50 text-gray-300 hover:bg-gray-500/30 active:scale-95"
                    style={{ touchAction: 'manipulation' }}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            )}
            
            {isRecovering && (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                <span className="text-sm text-orange-300">Attempting recovery...</span>
              </div>
            )}
          </div>
        )}
        
        {/* Listening Animation */}
        {isVoiceActive && (
          <div className="flex items-center justify-center space-x-3 animate-fade-in">
            <div className="flex space-x-1">
              <div className="w-1 h-8 bg-white/60 rounded-full animate-pulse"></div>
              <div className="w-1 h-6 bg-white/50 rounded-full animate-pulse delay-75"></div>
              <div className="w-1 h-10 bg-white/70 rounded-full animate-pulse delay-150"></div>
              <div className="w-1 h-4 bg-white/40 rounded-full animate-pulse delay-300"></div>
              <div className="w-1 h-7 bg-white/60 rounded-full animate-pulse delay-500"></div>
            </div>
            <span className="text-callout text-white/90 font-medium">Listening...</span>
          </div>
        )}
        
        {/* Processing Animation */}
        {voiceMutation.isPending && (
          <div className="flex items-center justify-center space-y-2 animate-fade-in">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-callout text-white/90 font-medium">Processing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Luxury Voice Activation Button with SIANI's Signature Style */}
      <button
        onClick={() => toggleVoice()}
        disabled={voiceMutation.isPending || isRecovering}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 group cursor-pointer ${
          isVoiceActive
            ? "scale-110"
            : "hover:scale-105 active:scale-95"
        }`}
        style={{
          background: isVoiceActive ? '#FAC358' : '#DD541C',
          border: 'none',
          touchAction: 'manipulation',
          fontSize: '16px'
        }}
      >
        {isRecovering ? (
          <RefreshCw className="w-8 h-8 text-white animate-spin" />
        ) : currentError && !currentError.canRetry ? (
          <AlertTriangle className="w-8 h-8 text-white" />
        ) : isVoiceActive ? (
          <MicOff className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </button>

      {/* Voice Support Warning */}
      {!voiceService.isSupported() && (
        <div className="glassmorphic p-4 rounded-xl border border-yellow-500/30 mt-4">
          <p className="text-yellow-400 text-sm text-center">
            Voice features require a supported browser. Please use Chrome, Safari, or Firefox.
          </p>
        </div>
      )}

      {/* Debug Overlay - Disabled for production */}
      <DebugOverlay isVisible={false} />
    </div>
  );
}
