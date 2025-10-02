// Customer.io integration for multi-touch delivery system
import { storage } from "../storage";

export interface TriggerEvent {
  userId: string;
  eventType: 'life_event' | 'emotional_tone_flag' | 'check_in_gap';
  eventData: any;
  priority: 'low' | 'medium' | 'high';
}

export interface CustomerIOSegment {
  name: string;
  entryCondition: string;
  action: string;
  messageTemplate: string;
}

export class CustomerIOService {
  
  // Define trigger types from user requirements
  private triggerTypes = {
    life_event: [
      "missed_po_appointment",
      "motel_eviction", 
      "jail_release",
      "shelter_intake",
      "job_loss",
      "child_reunification"
    ],
    emotional_tone_flag: [
      "hopeless",
      "overwhelmed", 
      "isolated",
      "burned_out"
    ],
    check_in_gap: [
      "no_reflection_48hrs",
      "no_app_login_3days"
    ]
  };

  // Message templates for different scenarios
  private messageTemplates = {
    warm_checkin: "Just checking in — you've been on my mind. Want to pause and take 2 minutes to reflect with me?",
    goal_nudge: "You set a goal that matters. Let's take one small step today. I'll guide you.",
    healing_prompt: "If a relationship has been heavy, we can talk about it — no judgment. I'll help you sort it out.",
    reentry_reset: "Fresh start moments can be messy. Let's build your plan together. You don't have to figure it all out alone."
  };

  // Segment logic for Customer.io targeting
  private segments: CustomerIOSegment[] = [
    {
      name: "Emotional Check Needed",
      entryCondition: "emotional_tone = 'hopeless' or 'burned_out'",
      action: "Send caring check-in prompt + offer SIAni journal session",
      messageTemplate: this.messageTemplates.warm_checkin
    },
    {
      name: "Post-Jail Release", 
      entryCondition: "life_event = 'jail_release'",
      action: "Send stabilization-focused SIAni prompts: housing, immediate needs, mindset",
      messageTemplate: this.messageTemplates.reentry_reset
    },
    {
      name: "Goal Reminder Needed",
      entryCondition: "no reflection or login in 72 hrs", 
      action: "Send nudge to revisit current goal and take a small step",
      messageTemplate: this.messageTemplates.goal_nudge
    },
    {
      name: "Relationship Stress Detected",
      entryCondition: "reflection_text includes 'fight', 'cut off', 'tired of people'",
      action: "Send reflection prompt on healing or boundaries", 
      messageTemplate: this.messageTemplates.healing_prompt
    }
  ];

  // Detect triggers from user interactions
  async detectTriggers(userId: string, transcript: string, emotionalTone: string): Promise<TriggerEvent[]> {
    const triggers: TriggerEvent[] = [];
    
    // Check emotional tone flags
    if (this.triggerTypes.emotional_tone_flag.includes(emotionalTone)) {
      triggers.push({
        userId,
        eventType: 'emotional_tone_flag',
        eventData: { tone: emotionalTone, transcript },
        priority: emotionalTone === 'hopeless' ? 'high' : 'medium'
      });
    }

    // Check for life events in transcript
    const lowerTranscript = transcript.toLowerCase();
    for (const lifeEvent of this.triggerTypes.life_event) {
      const eventKey = lifeEvent.replace('_', ' ');
      if (lowerTranscript.includes(eventKey) || 
          lowerTranscript.includes('just got out') ||
          lowerTranscript.includes('evicted') ||
          lowerTranscript.includes('lost my job')) {
        triggers.push({
          userId,
          eventType: 'life_event', 
          eventData: { event: lifeEvent, transcript },
          priority: 'high'
        });
      }
    }

    // Check relationship stress keywords
    if (lowerTranscript.includes('fight') || 
        lowerTranscript.includes('cut off') || 
        lowerTranscript.includes('tired of people')) {
      triggers.push({
        userId,
        eventType: 'emotional_tone_flag',
        eventData: { relationshipStress: true, transcript },
        priority: 'medium'
      });
    }

    return triggers;
  }

  // Check for activity gaps
  async checkActivityGaps(userId: string): Promise<TriggerEvent[]> {
    const triggers: TriggerEvent[] = [];
    
    try {
      // Check last reflection time
      const recentInteractions = await storage.getRecentVoiceInteractions(userId, 1);
      const lastInteraction = recentInteractions[0];
      
      if (!lastInteraction || this.isOlderThan(lastInteraction.timestamp, 48, 'hours')) {
        triggers.push({
          userId,
          eventType: 'check_in_gap',
          eventData: { type: 'no_reflection_48hrs' },
          priority: 'medium'
        });
      }

      // Check for 3+ day gaps (would integrate with login tracking)
      if (!lastInteraction || this.isOlderThan(lastInteraction.timestamp, 72, 'hours')) {
        triggers.push({
          userId,
          eventType: 'check_in_gap', 
          eventData: { type: 'no_app_login_3days' },
          priority: 'high'
        });
      }
    } catch (error) {
      console.error('Error checking activity gaps:', error);
    }

    return triggers;
  }

  // Send event to Customer.io (placeholder for actual API integration)
  async sendCustomerIOEvent(trigger: TriggerEvent): Promise<void> {
    const segment = this.getMatchingSegment(trigger);
    
    console.log(`🔔 Customer.io Event Triggered:`, {
      userId: trigger.userId,
      segment: segment?.name,
      priority: trigger.priority,
      message: segment?.messageTemplate,
      eventType: trigger.eventType,
      eventData: trigger.eventData
    });

    // Store event for tracking
    try {
      await this.logTriggerEvent(trigger, segment);
    } catch (error) {
      console.error('Error logging trigger event:', error);
    }
  }

  // Get matching segment for trigger
  private getMatchingSegment(trigger: TriggerEvent): CustomerIOSegment | null {
    switch (trigger.eventType) {
      case 'emotional_tone_flag':
        if (trigger.eventData.relationshipStress) {
          return this.segments.find(s => s.name === "Relationship Stress Detected") || null;
        }
        return this.segments.find(s => s.name === "Emotional Check Needed") || null;
      
      case 'life_event':
        if (trigger.eventData.event === 'jail_release') {
          return this.segments.find(s => s.name === "Post-Jail Release") || null;
        }
        return this.segments.find(s => s.name === "Emotional Check Needed") || null;
      
      case 'check_in_gap':
        return this.segments.find(s => s.name === "Goal Reminder Needed") || null;
      
      default:
        return null;
    }
  }

  // Log trigger events for analytics
  private async logTriggerEvent(trigger: TriggerEvent, segment: CustomerIOSegment | null): Promise<void> {
    // This would integrate with your analytics/logging system
    console.log('Logging trigger event:', {
      userId: trigger.userId,
      eventType: trigger.eventType,
      segmentMatched: segment?.name,
      timestamp: new Date().toISOString()
    });
  }

  // Helper to check if timestamp is older than specified duration
  private isOlderThan(timestamp: Date, amount: number, unit: 'hours' | 'days'): boolean {
    const now = new Date();
    const diffMs = now.getTime() - new Date(timestamp).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (unit === 'hours') {
      return diffHours >= amount;
    } else {
      return diffHours >= (amount * 24);
    }
  }
}

export const customerIOService = new CustomerIOService();