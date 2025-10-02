// Core Self-Discovery Session Implementation
import { sccsReportingService } from "./sccsReporting";
import { customerIOService } from "./customerio";
import { storage } from "../storage";

export interface SessionMemory {
  activeSession: string;
  domainsCovered: string[];
  lastPrompt: string;
  emotionalToneHistory: string[];
  currentGoal: string | null;
  firstActionStep: string | null;
  sccsTotal: number;
  identityKeywords: string[];
  immediateNeeds: string[];
  strengths: string[];
  barriers: string[];
  visionSummary: string;
}

export interface SessionResponse {
  response: string;
  isComplete: boolean;
  nextPrompt?: string;
  sccsPointsAwarded: number;
  memoryUpdate: Partial<SessionMemory>;
}

export class CoreSessionService {
  
  // Main entry point for processing user input in core session
  async processInput(transcript: string, userId: string): Promise<SessionResponse> {
    try {
      // Get or create session memory
      let sessionMemory = await this.getSessionMemory(userId);
      
      // Initialize new session if needed
      if (!sessionMemory.activeSession) {
        sessionMemory = await this.startNewSession(userId);
      }
      
      // Process the current response
      return await this.processSessionResponse(userId, sessionMemory, transcript);
    } catch (error) {
      console.error('Core session processing error:', error);
      return {
        response: "Let's take this step by step. What's most important to you right now?",
        isComplete: false,
        sccsPointsAwarded: 0,
        memoryUpdate: {}
      };
    }
  }
  
  // Get existing session memory or create default
  private async getSessionMemory(userId: string): Promise<SessionMemory> {
    try {
      // Try to get session from database storage
      const sessions = await storage.getRecentVoiceInteractions(userId, 20);
      
      // Look for active session markers in recent interactions
      const activeSessionMarker = sessions.find(s => 
        s.response.includes('core discovery session') || 
        s.response.includes('How would you describe yourself right now')
      );
      
      if (activeSessionMarker) {
        // Reconstruct session memory from interactions
        return this.reconstructSessionMemory(sessions);
      }
      
      // Return default empty session
      return this.createDefaultSessionMemory();
    } catch (error) {
      console.error('Error getting session memory:', error);
      return this.createDefaultSessionMemory();
    }
  }
  
  // Start a new core discovery session
  private async startNewSession(userId: string): Promise<SessionMemory> {
    const sessionMemory = this.createDefaultSessionMemory();
    sessionMemory.activeSession = 'core_discovery';
    
    console.log('🎯 Starting new core discovery session for user:', userId);
    return sessionMemory;
  }
  
  // Create default session memory structure
  private createDefaultSessionMemory(): SessionMemory {
    return {
      activeSession: '',
      domainsCovered: [],
      lastPrompt: '',
      emotionalToneHistory: [],
      currentGoal: null,
      firstActionStep: null,
      sccsTotal: 0,
      identityKeywords: [],
      immediateNeeds: [],
      strengths: [],
      barriers: [],
      visionSummary: ''
    };
  }
  
  // Reconstruct session memory from conversation history
  private reconstructSessionMemory(interactions: any[]): SessionMemory {
    const memory = this.createDefaultSessionMemory();
    memory.activeSession = 'core_discovery';
    
    // Count how many session steps have been covered
    const sessionKeywords = [
      'describe yourself', 'emotions', 'weighing on you', 'proud of', 
      'wake up 6 months', 'working toward', 'tiny step', 'get in the way'
    ];
    
    memory.domainsCovered = sessionKeywords.filter(keyword => 
      interactions.some(i => i.response.toLowerCase().includes(keyword))
    ).map((_, index) => this.sessionSteps[index]?.key).filter(Boolean);
    
    return memory;
  }
  
  // Core discovery session flow from user requirements
  private sessionSteps = [
    {
      key: 'identity',
      prompt: "How would you describe yourself right now — not your label, but what you feel or believe about who you are?",
      sccsPoints: 2,
      category: 'identity_reflection'
    },
    {
      key: 'emotion', 
      prompt: "What emotions have been showing up most for you lately? You can name more than one.",
      sccsPoints: 1,
      category: 'emotional_awareness'
    },
    {
      key: 'needs',
      prompt: "What's weighing on you most today? Any urgent needs (like housing, safety, childcare, legal issues)?",
      sccsPoints: 2,
      category: 'needs_identified'
    },
    {
      key: 'strengths',
      prompt: "What's something you've done before that you're proud of — or something people say you're good at?", 
      sccsPoints: 2,
      category: 'strength_insight'
    },
    {
      key: 'vision',
      prompt: "If you could wake up 6 months from now and feel proud — what would be different in your life?",
      sccsPoints: 3,
      category: 'vision_articulated'
    },
    {
      key: 'goal',
      prompt: "Let's pick one thing you'd want to start working toward — no pressure, just what feels important.",
      sccsPoints: 3, 
      category: 'goal_selected'
    },
    {
      key: 'action',
      prompt: "What's a tiny step you could take toward that goal? Something you could try today or this week?",
      sccsPoints: 2,
      category: 'action_step_defined'
    },
    {
      key: 'barriers',
      prompt: "What could get in the way — inside or outside? Be real, and I'll help you work through it.",
      sccsPoints: 2,
      category: 'barrier_insight'
    }
  ];

  // Process user response in core discovery session
  async processSessionResponse(
    userId: string, 
    sessionMemory: SessionMemory, 
    userResponse: string
  ): Promise<SessionResponse> {
    
    const currentStepIndex = sessionMemory.domainsCovered.length;
    const currentStep = this.sessionSteps[currentStepIndex];
    
    // If first interaction, start with the first session step
    if (currentStepIndex === 0 && sessionMemory.domainsCovered.length === 0) {
      const firstStep = this.sessionSteps[0];
      console.log('🌟 Starting core discovery session with identity step');
      
      return {
        response: `I want to really get to know you so I can support you better. ${firstStep.prompt}`,
        isComplete: false,
        nextPrompt: firstStep.prompt,
        sccsPointsAwarded: 0,
        memoryUpdate: { activeSession: 'core_discovery' }
      };
    }
    
    if (!currentStep) {
      // Session complete
      return this.completeSession(userId, sessionMemory, userResponse);
    }

    // Process the response for current step
    const updatedMemory = this.processStepResponse(currentStep, userResponse, sessionMemory);
    
    // Award SCCS points
    await sccsReportingService.logSCCSContribution({
      userId,
      category: currentStep.category,
      description: `Core session: ${currentStep.key}`,
      points: currentStep.sccsPoints,
      source: 'core_discovery_session'
    });

    // Check for triggers
    const emotionalTone = this.detectEmotionalTone(userResponse);
    const triggers = await customerIOService.detectTriggers(userId, userResponse, emotionalTone);
    
    // Send any triggered events
    for (const trigger of triggers) {
      await customerIOService.sendCustomerIOEvent(trigger);
    }

    // Get next prompt
    const nextStepIndex = currentStepIndex + 1;
    const nextStep = this.sessionSteps[nextStepIndex];
    const isComplete = !nextStep;

    if (isComplete) {
      return this.completeSession(userId, updatedMemory, userResponse);
    }

    // Generate response acknowledging their answer and asking next question
    const acknowledgment = this.generateStepResponse(currentStep.key, userResponse);
    const nextQuestion = nextStep.prompt;

    return {
      response: `${acknowledgment} ${nextQuestion}`,
      isComplete: false,
      nextPrompt: nextStep.prompt,
      sccsPointsAwarded: currentStep.sccsPoints,
      memoryUpdate: updatedMemory
    };
  }

  // Process response for specific session step
  private processStepResponse(
    step: any, 
    response: string, 
    memory: SessionMemory
  ): Partial<SessionMemory> {
    
    const updates: Partial<SessionMemory> = {
      domainsCovered: [...memory.domainsCovered, step.key],
      lastPrompt: step.prompt,
      sccsTotal: memory.sccsTotal + step.sccsPoints
    };

    // Extract data based on step type
    switch (step.key) {
      case 'identity':
        updates.identityKeywords = response.toLowerCase().split(' ').filter(word => word.length > 3);
        break;
        
      case 'emotion':
        const emotionalTone = this.detectEmotionalTone(response);
        updates.emotionalToneHistory = [...memory.emotionalToneHistory, emotionalTone];
        break;
        
      case 'needs':
        updates.immediateNeeds = response.toLowerCase().split(',').map(need => need.trim());
        break;
        
      case 'strengths':
        updates.strengths = response.toLowerCase().split(',').map(strength => strength.trim());
        break;
        
      case 'vision':
        updates.visionSummary = response;
        break;
        
      case 'goal':
        updates.currentGoal = response;
        break;
        
      case 'action':
        updates.firstActionStep = response;
        break;
        
      case 'barriers':
        updates.barriers = response.toLowerCase().split(',').map(barrier => barrier.trim());
        break;
    }

    return updates;
  }

  // Generate contextual response for each step
  private generateStepResponse(stepKey: string, userResponse: string): string {
    const responses = {
      identity: "I hear you. That's real.",
      emotion: "Thank you for sharing that with me.",
      needs: "That's a lot to carry. We'll work through this together.",
      strengths: "That matters. That's something to build on.",
      vision: "I can feel the possibility in that. That's powerful.",
      goal: "That feels right. Let's focus there.",
      action: "That's doable. Small steps count.",
      barriers: "Being real about obstacles shows wisdom. We'll navigate this."
    };

    return responses[stepKey as keyof typeof responses] || "I'm with you. Keep going.";
  }

  // Detect emotional tone from user response
  private detectEmotionalTone(response: string): string {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('angry') || lowerResponse.includes('pissed') || lowerResponse.includes('mad')) {
      return 'angry';
    } else if (lowerResponse.includes('sad') || lowerResponse.includes('depressed') || lowerResponse.includes('down')) {
      return 'sad';
    } else if (lowerResponse.includes('anxious') || lowerResponse.includes('worried') || lowerResponse.includes('scared')) {
      return 'anxious';
    } else if (lowerResponse.includes('hope') || lowerResponse.includes('better') || lowerResponse.includes('good')) {
      return 'hopeful';
    } else if (lowerResponse.includes('overwhelmed') || lowerResponse.includes('too much') || lowerResponse.includes('can\'t handle')) {
      return 'overwhelmed';
    }
    
    return 'neutral';
  }

  // Complete the core discovery session
  private async completeSession(
    userId: string, 
    memory: SessionMemory, 
    finalResponse: string
  ): Promise<SessionResponse> {
    
    const sessionSummary = this.generateSessionSummary(memory);
    
    // Award completion bonus points
    await sccsReportingService.logSCCSContribution({
      userId,
      category: 'session_completion',
      description: 'Completed core discovery session',
      points: 5,
      source: 'core_discovery_session'
    });

    // Generate summary response
    const completionResponse = `
You showed up. You got real. That's what matters. 

Your goal: ${memory.currentGoal}
Your first step: ${memory.firstActionStep}

I've saved what you shared so we can keep building your plan together — step by step.
    `.trim();

    return {
      response: completionResponse,
      isComplete: true,
      sccsPointsAwarded: 5,
      memoryUpdate: {
        activeSession: '',
        sccsTotal: memory.sccsTotal + 5
      }
    };
  }

  // Generate session summary for completion
  private generateSessionSummary(memory: SessionMemory): any {
    return {
      identityInsights: memory.identityKeywords,
      emotionalJourney: memory.emotionalToneHistory,
      immediateNeeds: memory.immediateNeeds,
      coreStrengths: memory.strengths,
      visionStatement: memory.visionSummary,
      primaryGoal: memory.currentGoal,
      firstActionStep: memory.firstActionStep,
      anticipatedBarriers: memory.barriers,
      totalSCCSPoints: memory.sccsTotal
    };
  }
}

// Export singleton instance
export const coreSessionService = new CoreSessionService();
    userId: string, 
    memory: SessionMemory, 
    finalResponse: string
  ): Promise<SessionResponse> {
    
    const sessionSummary = this.generateSessionSummary(memory);
    
    // Award completion bonus points
    await sccsReportingService.logSCCSContribution({
      userId,
      category: 'session_completion',
      description: 'Completed core discovery session',
      points: 5,
      source: 'core_discovery_session'
    });

    // Generate summary response
    const completionResponse = `
You showed up. You got real. That's what matters. 

Your goal: ${memory.currentGoal}
Your first step: ${memory.firstActionStep}

I've saved what you shared so we can keep building your plan together — step by step.
    `.trim();

    return {
      response: completionResponse,
      isComplete: true,
      sccsPointsAwarded: 5,
      memoryUpdate: {
        activeSession: '',
        sccsTotal: memory.sccsTotal + 5
      }
    };
  }

  // Generate session summary
  private generateSessionSummary(memory: SessionMemory): any {
    return {
      goal: memory.currentGoal,
      firstStep: memory.firstActionStep,
      tone: memory.emotionalToneHistory[memory.emotionalToneHistory.length - 1],
      score: memory.sccsTotal,
      narrative: `You've reflected on ${memory.domainsCovered.length} areas with honesty. Let's keep building.`
    };
  }

  // Detect emotional tone from response
  private detectEmotionalTone(response: string): string {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('hopeless') || lowerResponse.includes('give up')) {
      return 'hopeless';
    }
    if (lowerResponse.includes('overwhelmed') || lowerResponse.includes('stressed')) {
      return 'overwhelmed';
    }
    if (lowerResponse.includes('excited') || lowerResponse.includes('hopeful')) {
      return 'hopeful';
    }
    if (lowerResponse.includes('ready') || lowerResponse.includes('determined')) {
      return 'determined';
    }
    if (lowerResponse.includes('tired') || lowerResponse.includes('drained')) {
      return 'exhausted';
    }
    
    return 'neutral';
  }

  // Initialize new core session
  initializeSession(userId: string): SessionMemory {
    return {
      activeSession: `session_${Date.now()}`,
      domainsCovered: [],
      lastPrompt: '',
      emotionalToneHistory: [],
      currentGoal: null,
      firstActionStep: null,
      sccsTotal: 0,
      identityKeywords: [],
      immediateNeeds: [],
      strengths: [],
      barriers: [],
      visionSummary: ''
    };
  }

  // Get welcome message for core session
  getWelcomeMessage(): string {
    return "Hey, I'm SIAni. This isn't a test or an intake. It's a conversation — about you, your goals, and where you want to go. Let's start when you're ready.";
  }
}

export const coreSessionService = new CoreSessionService();