export class VoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private onTranscriptCallback?: (transcript: string) => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
    }

    if (this.recognition) {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');

        if (this.onTranscriptCallback && event.results[event.results.length - 1].isFinal) {
          this.onTranscriptCallback(transcript);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Don't treat "aborted" as a real error since it's often intentional
        if (event.error !== 'aborted' && this.onErrorCallback) {
          // More friendly error messages
          if (event.error === 'no-speech') {
            this.onErrorCallback("I'm listening... please speak when you're ready");
          } else if (event.error === 'network') {
            this.onErrorCallback("Connection issue. Let me try again...");
          } else {
            this.onErrorCallback("Let me try that again...");
          }
        }
        
        // For aborted errors, just log and continue
        if (event.error === 'aborted') {
          console.log('Speech recognition was aborted (likely intentional)');
        }
      };

      this.recognition.onend = () => {
        console.log('🔚 Speech recognition ended, isListening:', this.isListening);
        if (this.isListening) {
          // Restart recognition to maintain continuous listening with longer delay
          setTimeout(() => {
            if (this.isListening && this.recognition) {
              try {
                console.log('🔄 Auto-restarting speech recognition...');
                this.recognition.start();
              } catch (error: any) {
                // If already running, that's fine
                if (error.name !== 'InvalidStateError') {
                  console.error('❌ Failed to restart recognition:', error);
                  // Stop listening on persistent errors
                  this.isListening = false;
                }
              }
            }
          }, 300); // Increased delay to prevent rapid restart issues
        }
      };
    }
  }

  async startListening(
    onTranscript: (transcript: string) => void,
    onError?: (error: string) => void
  ) {
    if (!this.recognition) {
      const error = 'Speech recognition not supported in this browser';
      console.error(error);
      onError?.(error);
      return;
    }

    // Request microphone permission explicitly
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
    } catch (permissionError) {
      console.error('Microphone permission denied:', permissionError);
      onError?.("Please allow microphone access to use voice features. Check your browser settings.");
      return;
    }

    this.onTranscriptCallback = onTranscript;
    this.onErrorCallback = onError;
    this.isListening = true;

    try {
      // Only start if not already running
      if (this.recognition) {
        this.recognition.start();
        console.log('Voice recognition started successfully');
      }
    } catch (error: any) {
      // If already running, that's fine - just continue
      if (error.name === 'InvalidStateError') {
        console.log('Voice recognition already running');
      } else {
        console.error('Failed to start speech recognition:', error);
        onError?.('Failed to start speech recognition');
      }
    }
  }

  stopListening() {
    console.log('🛑 Stopping voice recognition, isListening:', this.isListening);
    if (this.recognition && this.isListening) {
      this.isListening = false;
      try {
        this.recognition.stop();
      } catch (error) {
        console.log('Voice recognition stop error (likely already stopped):', error);
      }
    }
  }

  isCurrentlyListening() {
    return this.isListening;
  }

  speak(text: string, onEnd?: () => void) {
    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Enhanced settings for more natural, human-like speech
    utterance.rate = 0.9;     // Slightly faster, more conversational pace
    utterance.pitch = 1.0;    // Natural pitch, not artificially high
    utterance.volume = 0.95;  // Clear volume for deployment consistency

    // Wait for voices to load, then find the best voice
    const selectVoice = () => {
      const voices = this.synthesis.getVoices();
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      
      // Prefer high-quality female English voices that sound natural and human-like
      const preferredVoice = voices.find(voice => 
        // Premium quality voices (typically more natural)
        (voice.name.includes('Samantha') ||     // macOS high-quality voice
         voice.name.includes('Alex') ||         // macOS natural voice
         voice.name.includes('Karen') ||        // Windows natural voice
         voice.name.includes('Zira') ||         // Windows clear voice
         voice.name.includes('Victoria') ||     // Clear pronunciation
         voice.name.includes('Allison') ||      // Warm tone
         voice.name.includes('Ava') ||          // Natural cadence
         voice.name.includes('Serena') ||       // Smooth delivery
         voice.name.includes('Google US English') || // Google's natural voice
         voice.name.includes('Microsoft') ||    // Microsoft enhanced voices
         (voice.name.toLowerCase().includes('female') && voice.localService)) &&
        voice.lang.startsWith('en')
      ) || 
      // Fallback to any quality English voice
      voices.find(voice => voice.lang.startsWith('en') && voice.localService) ||
      voices.find(voice => voice.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log('Using voice:', preferredVoice.name);
      } else {
        console.log('Using default voice');
      }
    };

    // Handle voice loading
    if (this.synthesis.getVoices().length === 0) {
      this.synthesis.addEventListener('voiceschanged', selectVoice, { once: true });
    } else {
      selectVoice();
    }

    // Add error handling
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      if (onEnd) onEnd();
    };

    if (onEnd) {
      utterance.onend = () => {
        console.log('Speech synthesis completed');
        onEnd();
      };
    }

    console.log('Starting speech synthesis:', text);
    
    // Fix for iOS/Safari speech synthesis
    setTimeout(() => {
      this.synthesis.speak(utterance);
      console.log('Speech synthesis utterance queued');
    }, 100);
    
    // Fallback timeout in case speech doesn't trigger onend
    if (onEnd) {
      setTimeout(() => {
        if (this.synthesis.speaking) {
          console.log('Still speaking, waiting...');
          return; // Still speaking
        }
        console.log('Speech synthesis timeout fallback');
        onEnd();
      }, Math.max(text.length * 80 + 3000, 5000)); // More generous timeout
    }
  }

  isSupported(): boolean {
    return !!this.recognition && 'speechSynthesis' in window;
  }

  getCurrentListeningState(): boolean {
    return this.isListening;
  }
}

export const voiceService = new VoiceService();
