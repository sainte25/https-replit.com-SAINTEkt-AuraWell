// Domain-specific coaching system for SIANI
import { domainPrompts } from "../data/core_discovery_script";

export interface CoachingResponse {
  response: string;
  domain?: string;
  emotionalTone: string;
  sccsPoints: number;
  suggestedReferral?: string;
}

export class DomainCoachingService {
  
  // Detect which domain the user is discussing
  detectDomain(transcript: string): string | null {
    const lowerTranscript = transcript.toLowerCase();
    
    // Housing keywords
    if (lowerTranscript.includes('housing') || lowerTranscript.includes('home') || 
        lowerTranscript.includes('sleep') || lowerTranscript.includes('apartment') ||
        lowerTranscript.includes('rent') || lowerTranscript.includes('shelter')) {
      return 'housing';
    }
    
    // Employment keywords
    if (lowerTranscript.includes('work') || lowerTranscript.includes('job') || 
        lowerTranscript.includes('employment') || lowerTranscript.includes('income') ||
        lowerTranscript.includes('career') || lowerTranscript.includes('skills')) {
      return 'employment';
    }
    
    // Mental health keywords
    if (lowerTranscript.includes('feel') || lowerTranscript.includes('stress') || 
        lowerTranscript.includes('anxiety') || lowerTranscript.includes('depression') ||
        lowerTranscript.includes('mental') || lowerTranscript.includes('therapy')) {
      return 'mental_health';
    }
    
    // Relationships keywords
    if (lowerTranscript.includes('family') || lowerTranscript.includes('friend') || 
        lowerTranscript.includes('relationship') || lowerTranscript.includes('people') ||
        lowerTranscript.includes('connect') || lowerTranscript.includes('support')) {
      return 'relationships';
    }
    
    return null;
  }
  
  // Analyze emotional tone from transcript
  analyzeEmotionalTone(transcript: string): string {
    const lowerTranscript = transcript.toLowerCase();
    
    // Hopeful/positive indicators
    if (lowerTranscript.includes('proud') || lowerTranscript.includes('excited') || 
        lowerTranscript.includes('good') || lowerTranscript.includes('better') ||
        lowerTranscript.includes('grateful')) {
      return 'hopeful';
    }
    
    // Overwhelmed indicators
    if (lowerTranscript.includes('overwhelmed') || lowerTranscript.includes('too much') || 
        lowerTranscript.includes('can\'t handle') || lowerTranscript.includes('stressed')) {
      return 'overwhelmed';
    }
    
    // Discouraged indicators  
    if (lowerTranscript.includes('tired') || lowerTranscript.includes('give up') || 
        lowerTranscript.includes('hopeless') || lowerTranscript.includes('nothing')) {
      return 'discouraged';
    }
    
    // Determined indicators
    if (lowerTranscript.includes('ready') || lowerTranscript.includes('will') || 
        lowerTranscript.includes('going to') || lowerTranscript.includes('determined')) {
      return 'determined';
    }
    
    return 'neutral';
  }
  
  // Calculate SCCS points based on emotional wins and domain progress
  calculateSCCSPoints(transcript: string, emotionalTone: string, domain?: string): number {
    let points = 0;
    
    // Base points for engagement
    points += 5;
    
    // Emotional tone bonuses
    switch (emotionalTone) {
      case 'hopeful':
        points += 15; // Confidence voice tone after goal reflection
        break;
      case 'determined':
        points += 20; // Breakthrough moment
        break;
      case 'overwhelmed':
        points += 10; // Showing vulnerability
        break;
    }
    
    // Domain-specific progress indicators
    if (domain && transcript.toLowerCase().includes('goal')) {
      points += 20; // Naming a specific goal for the first time
    }
    
    // First-time breakthroughs
    if (transcript.toLowerCase().includes('first time') || 
        transcript.toLowerCase().includes('never thought')) {
      points += 30; // Major breakthrough
    }
    
    return points;
  }
  
  // Generate domain-specific coaching response
  generateDomainResponse(transcript: string, domain: string, emotionalTone: string): string {
    const prompts = domainPrompts[domain as keyof typeof domainPrompts];
    if (!prompts) return "I hear you. Tell me more about what's on your mind.";
    
    // Select appropriate prompt based on emotional tone
    let selectedPrompt: string;
    
    switch (emotionalTone) {
      case 'overwhelmed':
        // Use grounding, supportive prompts
        selectedPrompt = prompts[0] || "What feels most manageable right now?";
        break;
      case 'hopeful':
      case 'determined':
        // Use forward-moving, vision-building prompts
        selectedPrompt = prompts[1] || "What would success look like for you?";
        break;
      default:
        // Use open, exploratory prompts
        selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    }
    
    return selectedPrompt;
  }
  
  // Main coaching response generation
  generateCoachingResponse(transcript: string): CoachingResponse {
    const domain = this.detectDomain(transcript);
    const emotionalTone = this.analyzeEmotionalTone(transcript);
    const sccsPoints = this.calculateSCCSPoints(transcript, emotionalTone, domain);
    
    let response: string;
    
    if (domain) {
      response = this.generateDomainResponse(transcript, domain, emotionalTone);
    } else {
      // General supportive response
      response = this.generateGeneralResponse(transcript, emotionalTone);
    }
    
    return {
      response,
      domain,
      emotionalTone,
      sccsPoints,
      suggestedReferral: this.getSuggestedReferral(domain, emotionalTone)
    };
  }
  
  private generateGeneralResponse(transcript: string, emotionalTone: string): string {
    switch (emotionalTone) {
      case 'overwhelmed':
        return "Let's just pause right there... take one breath with me. You don't have to figure everything out today. Just this one step.";
      case 'discouraged':
        return "A lot of people feel like this at the beginning. It doesn't mean anything's wrong with you. What's one thing you're proud of or grateful for today?";
      case 'hopeful':
        return "I can hear that energy in your voice. That's powerful. What would you like to focus on first?";
      case 'determined':
        return "That's the voice of someone who's ready to build something different. What feels most important to tackle?";
      default:
        return "I'm here with you. What feels most real for you right now?";
    }
  }
  
  private getSuggestedReferral(domain?: string, emotionalTone?: string): string | undefined {
    if (domain === 'housing' && emotionalTone === 'overwhelmed') {
      return 'supportive_housing_partner';
    }
    if (domain === 'mental_health' && (emotionalTone === 'discouraged' || emotionalTone === 'overwhelmed')) {
      return 'mental_health_clinic';
    }
    if (domain === 'employment' && emotionalTone === 'determined') {
      return 'job_training_program';
    }
    return undefined;
  }
}

export const domainCoachingService = new DomainCoachingService();