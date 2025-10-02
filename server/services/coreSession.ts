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
      // Try to get sessions - handle missing column gracefully
      let sessions = [];
      try {
        sessions = await storage.getRecentVoiceInteractions(userId, 20);
      } catch (error) {
        console.log('Using fallback method for interactions:', error.message);
        sessions = await storage.getVoiceInteractions(userId);
        sessions = sessions.slice(-20); // Get last 20
      }
      
      const activeSessionMarker = sessions.find(s => 
        s.response.includes('core discovery session') || 
        s.response.includes('How would you describe yourself right now') ||
        s.response.includes('what would you like me to call you')
      );
      
      if (activeSessionMarker) {
        return this.reconstructSessionMemory(sessions);
      }
      
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
    
    // Count domains covered based on comprehensive intake phases
    const allSteps = this.getAllStepsInSequence();
    const sessionKeywords = [
      'call you', 'legal stuff', 'staying right now', 'experience in life',
      'housing situation', 'talk about work', 'learning or education',
      'mental health', 'people who matter', 'version of you', 'build, give, or create',
      'in your corner', 'next 30 days', 'connect you'
    ];
    
    memory.domainsCovered = sessionKeywords.filter(keyword => 
      interactions.some(i => i.response.toLowerCase().includes(keyword))
    ).map((_, index) => allSteps[index]?.key).filter(Boolean);
    
    return memory;
  }
  
  // Enhanced 4-phase intake system based on comprehensive coaching model
  private sessionPhases = [
    {
      phase: 'self_discovery',
      title: 'Self-Discovery',
      description: 'Ground the user in purpose, identity, and possibility',
      steps: [
        {
          key: 'personal_basics',
          prompt: "Let's start with the basics—what would you like me to call you, and what are the top 3 things you care about right now?",
          sccsPoints: 1,
          category: 'personal_info',
          fields: ['preferred_name', 'core_values']
        },
        {
          key: 'justice_context',
          prompt: "Can you tell me about where you're at with any legal stuff—are you on parole, probation, or dealing with court dates?",
          sccsPoints: 2,
          category: 'justice_history',
          fields: ['legal_supervision', 'outstanding_legal_issues']
        },
        {
          key: 'immediate_needs',
          prompt: "Let's talk about your first priorities. Where are you staying right now, and do you have what you need—food, phone, transportation?",
          sccsPoints: 2,
          category: 'immediate_needs',
          fields: ['housing_now', 'basic_needs_met', 'transportation_needs']
        },
        {
          key: 'identity_purpose',
          prompt: "What would you want to experience in life if time and money weren't an issue? Who are you doing this for?",
          sccsPoints: 3,
          category: 'identity_reflection',
          fields: ['life_vision', 'motivation_source']
        }
      ]
    },
    {
      phase: 'goal_mapping',
      title: 'Goal Mapping',
      description: 'Explore each life area to identify current state, desired future, and 30-day step',
      domains: ['housing', 'employment', 'education', 'mental_health', 'physical_health', 'family', 'legal', 'finance', 'life_skills', 'identity'],
      steps: [
        {
          key: 'housing',
          prompt: "Tell me about your housing situation—where you are now and where you'd love to be. What would stable housing look like for you?",
          sccsPoints: 3,
          category: 'housing_goals',
          fields: ['current_housing', 'housing_vision', 'housing_barriers', 'housing_30day_goal']
        },
        {
          key: 'employment',
          prompt: "Let's talk about work. What kind of work have you done before, and what kind of job would light you up now?",
          sccsPoints: 3,
          category: 'employment_goals',
          fields: ['work_history', 'dream_job', 'employment_barriers', 'work_30day_goal']
        },
        {
          key: 'education',
          prompt: "What about learning or education—anything you've always wanted to study or skills you want to build?",
          sccsPoints: 2,
          category: 'education_goals',
          fields: ['education_interests', 'learning_goals', 'education_barriers']
        },
        {
          key: 'health_mental',
          prompt: "How's your mental health and emotional wellbeing? What would feeling your best look like?",
          sccsPoints: 3,
          category: 'mental_health_goals',
          fields: ['mental_health_state', 'wellness_vision', 'therapy_needs']
        },
        {
          key: 'family_relationships',
          prompt: "Tell me about the people who matter to you—family, friends, relationships. What do you want there?",
          sccsPoints: 2,
          category: 'relationship_goals',
          fields: ['important_relationships', 'relationship_goals', 'family_support']
        }
      ]
    },
    {
      phase: 'vision_activation',
      title: 'Vision Activation',
      description: 'Help the user envision their future in vivid detail',
      steps: [
        {
          key: 'future_self',
          prompt: "Imagine the version of you who's already living the life you want. What's different? How do you feel, what are you doing, who's around you?",
          sccsPoints: 4,
          category: 'vision_articulated',
          fields: ['future_self_description', 'daily_life_vision', 'emotional_state']
        },
        {
          key: 'purpose_mission',
          prompt: "What are you excited to build, give, or create in the world? What's your why?",
          sccsPoints: 3,
          category: 'purpose_defined',
          fields: ['life_mission', 'contribution_goals']
        }
      ]
    },
    {
      phase: 'support_momentum',
      title: 'Support & Momentum Building',
      description: 'Align on support, connection preferences, and next steps',
      steps: [
        {
          key: 'support_network',
          prompt: "Who's in your corner right now—people, organizations, or mentors? And what kind of support would make the biggest difference?",
          sccsPoints: 2,
          category: 'support_assessment',
          fields: ['current_support', 'needed_support', 'referral_preferences']
        },
        {
          key: 'action_commitment',
          prompt: "What's one thing you'd love to get done in the next 30 days that would make you feel proud?",
          sccsPoints: 3,
          category: 'action_commitment',
          fields: ['primary_30day_goal', 'first_weekly_step']
        },
        {
          key: 'connection_consent',
          prompt: "Would you like me to connect you with people or resources? And how would you like me to check in with you?",
          sccsPoints: 1,
          category: 'engagement_preferences',
          fields: ['wants_referrals', 'contact_preferences', 'check_in_frequency']
        }
      ]
    }
  ];

  // Process user response in comprehensive intake session
  async processSessionResponse(
    userId: string, 
    sessionMemory: SessionMemory, 
    userResponse: string
  ): Promise<SessionResponse> {
    
    // Get all steps from all phases in sequence
    const allSteps = this.getAllStepsInSequence();
    
    // If first interaction, start with welcome and first step
    if (sessionMemory.domainsCovered.length === 0) {
      const firstStep = allSteps[0];
      console.log('🌟 Starting comprehensive intake session');
      
      return {
        response: `I want to really get to know you so I can support you better. This isn't about paperwork—it's about your dreams and what you need to get there. ${firstStep.prompt}`,
        isComplete: false,
        nextPrompt: firstStep.prompt,
        sccsPointsAwarded: 0,
        memoryUpdate: { 
          activeSession: 'comprehensive_intake',
          domainsCovered: [firstStep.key],
          lastPrompt: firstStep.prompt
        }
      };
    }
    
    // Get the step that was just answered (previous step)
    const answeredStepIndex = sessionMemory.domainsCovered.length - 1;
    const nextStepIndex = sessionMemory.domainsCovered.length;
    
    const answeredStep = allSteps[answeredStepIndex];
    const nextStep = allSteps[nextStepIndex];
    
    // If no next step, complete the session
    if (!nextStep) {
      return this.completeSession(userId, sessionMemory, userResponse);
    }

    // Process the response for the step that was just answered
    if (answeredStep) {
      console.log(`📋 Processing response for: ${answeredStep.key} → ${nextStep.key}`);
      
      // Save intake response to database
      await this.saveIntakeResponse(userId, answeredStep, userResponse);
      
      // Award SCCS points
      await sccsReportingService.logSCCSContribution({
        userId,
        category: answeredStep.category,
        description: `Intake: ${answeredStep.key}`,
        points: answeredStep.sccsPoints,
        source: 'comprehensive_intake'
      });
    }

    // Generate empathetic response and transition to next question
    const acknowledgment = answeredStep ? this.generateCoachingResponse(answeredStep, userResponse) : "";
    const phaseTransition = answeredStep && nextStep ? this.getPhaseTransition(answeredStep, nextStep) : "";
    const nextQuestion = nextStep.prompt;

    return {
      response: `${acknowledgment} ${phaseTransition}${nextQuestion}`,
      isComplete: false,
      nextPrompt: nextStep.prompt,
      sccsPointsAwarded: answeredStep?.sccsPoints || 0,
      memoryUpdate: { 
        domainsCovered: [...sessionMemory.domainsCovered, nextStep.key],
        lastPrompt: nextStep.prompt
      }
    };
  }

  // Get all steps from all phases in sequence
  private getAllStepsInSequence(): any[] {
    const allSteps: any[] = [];
    
    for (const phase of this.sessionPhases) {
      if (phase.steps) {
        allSteps.push(...phase.steps);
      }
    }
    
    return allSteps;
  }

  // Save structured intake response
  private async saveIntakeResponse(userId: string, step: any, response: string): Promise<void> {
    try {
      // Extract referral tags based on response content
      const referralTags = this.extractReferralTags(step, response);
      const severity = this.assessSeverity(step, response);
      
      // Store each field from the step
      for (const field of step.fields || []) {
        await storage.createIntakeResponse({
          userId,
          domain: step.category,
          field: field,
          response: response,
          referralTags: referralTags,
          severity: severity,
          timestamp: new Date()
        });
      }
      
      console.log(`💾 Saved intake response for ${step.key}: ${referralTags.length} referral tags`);
    } catch (error) {
      console.error('Error saving intake response:', error);
    }
  }

  // Extract referral tags based on content
  private extractReferralTags(step: any, response: string): string[] {
    const tags: string[] = [];
    const lowerResponse = response.toLowerCase();
    
    // Housing-related tags
    if (step.key === 'housing' || step.key === 'immediate_needs') {
      if (lowerResponse.includes('homeless') || lowerResponse.includes('couch surfing') || lowerResponse.includes('no place')) {
        tags.push('emergency_housing', 'housing_referral');
      }
      if (lowerResponse.includes('eviction') || lowerResponse.includes('landlord')) {
        tags.push('landlord_mediation', 'legal_housing_support');
      }
    }
    
    // Employment tags
    if (step.key === 'employment') {
      if (lowerResponse.includes('no job') || lowerResponse.includes('unemployed')) {
        tags.push('employment_referral');
      }
      if (lowerResponse.includes('tools') || lowerResponse.includes('equipment')) {
        tags.push('work_equipment_support');
      }
      if (lowerResponse.includes('resume') || lowerResponse.includes('interview')) {
        tags.push('job_search_support');
      }
    }
    
    // Mental health tags
    if (step.key === 'health_mental') {
      if (lowerResponse.includes('therapy') || lowerResponse.includes('counseling')) {
        tags.push('mental_health_referral');
      }
      if (lowerResponse.includes('depression') || lowerResponse.includes('anxiety')) {
        tags.push('mental_health_support');
      }
    }
    
    // Legal tags
    if (step.key === 'justice_context') {
      if (lowerResponse.includes('court') || lowerResponse.includes('legal')) {
        tags.push('legal_support');
      }
      if (lowerResponse.includes('parole') || lowerResponse.includes('probation')) {
        tags.push('supervision_support');
      }
    }
    
    return tags;
  }

  // Assess severity level
  private assessSeverity(step: any, response: string): string {
    const lowerResponse = response.toLowerCase();
    
    // High severity indicators
    if (lowerResponse.includes('homeless') || 
        lowerResponse.includes('suicidal') || 
        lowerResponse.includes('emergency') ||
        lowerResponse.includes('no food') ||
        lowerResponse.includes('unsafe')) {
      return 'high';
    }
    
    // Medium severity indicators
    if (lowerResponse.includes('struggling') || 
        lowerResponse.includes('worried') || 
        lowerResponse.includes('need help') ||
        lowerResponse.includes('unstable')) {
      return 'medium';
    }
    
    return 'low';
  }

  // Generate phase transition messages
  private getPhaseTransition(currentStep: any, nextStep: any): string {
    if (!nextStep) return '';
    
    const currentPhase = this.getStepPhase(currentStep);
    const nextPhase = this.getStepPhase(nextStep);
    
    if (currentPhase !== nextPhase) {
      const transitions = {
        'self_discovery_to_goal_mapping': "Now let's explore what you want to build in different areas of your life. ",
        'goal_mapping_to_vision_activation': "You've shared so much. Now let's step into your future vision. ",
        'vision_activation_to_support_momentum': "Beautiful. Let's make sure you have the support to make this real. "
      };
      
      const transitionKey = `${currentPhase}_to_${nextPhase}`;
      return transitions[transitionKey] || '';
    }
    
    return '';
  }

  // Get phase for a step
  private getStepPhase(step: any): string {
    for (const phase of this.sessionPhases) {
      if (phase.steps && phase.steps.some((s: any) => s.key === step.key)) {
        return phase.phase;
      }
    }
    return '';
  }

  // Process response for specific session step
  private processStepResponse(step: any, response: string, memory: SessionMemory): Partial<SessionMemory> {
    const updates: Partial<SessionMemory> = {
      domainsCovered: [...memory.domainsCovered, step.key],
      lastPrompt: step.prompt,
    };

    switch (step.key) {
      case 'personal_basics':
        updates.identityKeywords = response.toLowerCase().split(' ').filter(word => word.length > 3);
        break;
      case 'justice_context':
        const legalContext = response.toLowerCase();
        if (legalContext.includes('parole') || legalContext.includes('probation')) {
          updates.immediateNeeds = [...memory.immediateNeeds, 'legal_supervision'];
        }
        break;
      case 'immediate_needs':
        updates.immediateNeeds = response.toLowerCase().split(',').map(need => need.trim());
        break;
      case 'identity_purpose':
        updates.visionSummary = response;
        break;
      case 'housing':
      case 'employment':
      case 'education':
      case 'health_mental':
      case 'family_relationships':
        // These are captured in structured database storage
        const emotionalTone = this.detectEmotionalTone(response);
        updates.emotionalToneHistory = [...memory.emotionalToneHistory, emotionalTone];
        break;
      case 'future_self':
        updates.visionSummary = response;
        break;
      case 'purpose_mission':
        updates.visionSummary = memory.visionSummary + ' ' + response;
        break;
      case 'support_network':
        updates.strengths = response.toLowerCase().split(',').map(support => support.trim());
        break;
      case 'action_commitment':
        updates.currentGoal = response;
        break;
      case 'connection_consent':
        updates.firstActionStep = response;
        break;
    }

    return updates;
  }

  // Generate empathetic coaching response based on step and content
  private generateCoachingResponse(step: any, userResponse: string): string {
    const responses = {
      personal_basics: "I'm glad to meet you.",
      justice_context: "Thanks for being real about that.",
      immediate_needs: "That's a lot to navigate. You're handling it.",
      identity_purpose: "I can feel the possibility in that. That's powerful.",
      housing: "Housing is everything. I hear you.",
      employment: "Work that lights you up—that matters.",
      education: "Learning and growing, I love that.",
      health_mental: "Taking care of your mind is strength.",
      family_relationships: "The people who matter most.",
      future_self: "I can see that version of you already.",
      purpose_mission: "That's your why. That's everything.",
      support_network: "Having people in your corner matters.",
      action_commitment: "That's something you can be proud of.",
      connection_consent: "I'm here to support you however works best."
    };

    return responses[step.key as keyof typeof responses] || "I hear you. Keep going.";
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
    
    // Award completion bonus points
    await sccsReportingService.logSCCSContribution({
      userId,
      category: 'session_completion',
      description: 'Completed core discovery session',
      points: 5,
      source: 'core_discovery_session'
    });

    const completionResponse = `
You showed up. You got real about your life, your dreams, and what you need. That's everything.

Your 30-day goal: ${memory.currentGoal}
Your next step: ${memory.firstActionStep}

I've saved everything you shared. This isn't just information—it's your roadmap. I'll be here to walk with you, step by step, as you build the life you described.

You're not carrying this alone anymore.
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
}

// Export singleton instance
export const coreSessionService = new CoreSessionService();