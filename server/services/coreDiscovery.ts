import { storage } from "../storage";
import { coreDiscoveryPrompts, domainSequence, domainPrompts } from "../data/core_discovery_script";
import type { CoreDiscoverySession } from "../../shared/schema";

export class CoreDiscoveryService {
  
  // Check if user needs to start core discovery session
  async shouldStartCoreDiscovery(userId: string): Promise<boolean> {
    const sessions = await storage.getCoreDiscoverySessions(userId);
    const hasCompletedSession = sessions.some(s => s.completed);
    return !hasCompletedSession;
  }

  // Get or create core discovery session
  async getOrCreateSession(userId: string): Promise<CoreDiscoverySession> {
    try {
      const sessions = await storage.getCoreDiscoverySessions(userId);
      const activeSession = sessions.find(s => !s.completed);
      
      if (activeSession) {
        return activeSession;
      }

      // Create new session
      return await storage.createCoreDiscoverySession({
        userId,
        phase: 'welcome',
        currentStep: 0,
        collectedData: {},
        completed: false
      });
    } catch (error) {
      console.error('Error in getOrCreateSession:', error);
      // Return a basic session structure for fallback
      return {
        id: `temp-${Date.now()}`,
        userId,
        phase: 'welcome',
        currentStep: 0,
        collectedData: {},
        completed: false,
        startedAt: new Date(),
        completedAt: null
      };
    }
  }

  // Process voice input during core discovery
  async processDiscoveryInput(userId: string, transcript: string): Promise<{
    response: string;
    phase: string;
    isComplete: boolean;
    nextPrompt?: string;
  }> {
    const session = await this.getOrCreateSession(userId);
    
    // Store the user's response
    await this.updateSessionData(session.id, transcript);
    
    // Generate contextual response based on phase
    const response = await this.generatePhaseResponse(session, transcript);
    
    // Check if we should advance to next phase
    const shouldAdvance = await this.shouldAdvancePhase(session, transcript);
    
    if (shouldAdvance) {
      const nextPhase = this.getNextPhase(session.phase);
      if (nextPhase === 'complete') {
        await storage.updateCoreDiscoverySession(session.id, { 
          completed: true, 
          completedAt: new Date() 
        });
        return {
          response: coreDiscoveryPrompts.wrap,
          phase: 'complete',
          isComplete: true
        };
      } else {
        await storage.updateCoreDiscoverySession(session.id, { 
          phase: nextPhase, 
          currentStep: 0 
        });
        return {
          response,
          phase: nextPhase,
          isComplete: false,
          nextPrompt: this.getPhasePrompt(nextPhase)
        };
      }
    }

    return {
      response,
      phase: session.phase,
      isComplete: false
    };
  }

  private async generatePhaseResponse(session: CoreDiscoverySession, transcript: string): Promise<string> {
    const phase = session.phase;
    
    // Use pre-written prompts for structure, but allow natural conversation
    switch (phase) {
      case 'welcome':
        if (transcript.toLowerCase().includes('yes') || transcript.toLowerCase().includes('okay')) {
          return coreDiscoveryPrompts.welcome.grounding + " " + coreDiscoveryPrompts.welcome.basicInfo;
        }
        return "I hear you. Take your time. This is your space. When you're ready, just let me know.";
        
      case 'identity':
        // Parse responses and acknowledge them
        if (transcript.includes('name') || session.currentStep === 0) {
          return "Thank you for sharing that with me. " + coreDiscoveryPrompts.identity.intro;
        }
        return coreDiscoveryPrompts.identity.timeline;
        
      case 'context':
        return "I appreciate you being open about that. " + coreDiscoveryPrompts.identity.urgentNeeds;
        
      case 'goals':
        if (session.currentStep === 0) {
          return coreDiscoveryPrompts.goals.intro + " " + coreDiscoveryPrompts.goals.shortTerm;
        }
        return "That's powerful. " + coreDiscoveryPrompts.goals.success;
        
      default:
        return "I'm here with you. Keep sharing.";
    }
  }

  private async updateSessionData(sessionId: string, transcript: string): Promise<void> {
    try {
      // Extract meaningful data from transcript and update session
      const session = await storage.getCoreDiscoverySession(sessionId);
      if (session) {
        await storage.updateCoreDiscoverySession(sessionId, {
          currentStep: session.currentStep + 1
        });
      }
    } catch (error) {
      console.error('Error updating session data:', error);
      // Continue without breaking the flow
    }
  }

  private async shouldAdvancePhase(session: CoreDiscoverySession, transcript: string): Promise<boolean> {
    // Logic to determine when to move to next phase
    // Could be based on step count, keyword detection, or conversation flow
    return session.currentStep >= 2; // Simple logic for now
  }

  private getNextPhase(currentPhase: string): string {
    const phases = ['welcome', 'identity', 'context', 'goals', 'complete'];
    const currentIndex = phases.indexOf(currentPhase);
    return phases[currentIndex + 1] || 'complete';
  }

  private getPhasePrompt(phase: string): string {
    switch (phase) {
      case 'identity':
        return coreDiscoveryPrompts.identity.intro;
      case 'context':
        return coreDiscoveryPrompts.identity.urgentNeeds;
      case 'goals':
        return coreDiscoveryPrompts.goals.intro;
      default:
        return "Let's continue our conversation.";
    }
  }

  // Schedule domain check-ins based on completion
  async scheduleDomainCheckins(userId: string): Promise<void> {
    try {
      // Create scheduled check-ins for each domain
      for (const domain of domainSequence) {
        await storage.createDomainCheckin({
          userId,
          domain: domain.domain,
          scheduledDay: domain.day,
          triggerType: 'scheduled',
          completed: false
        });
      }
    } catch (error) {
      console.error('Error scheduling domain checkins:', error);
      // Continue without breaking the flow
    }
  }
}

export const coreDiscoveryService = new CoreDiscoveryService();