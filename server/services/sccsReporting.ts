// SCCS Summary and Reporting System
import { storage } from "../storage";
import { customerIOService } from "./customerio";

export interface SCCSSummary {
  header: {
    userName: string;
    dateRange: string;
    sccsScore: number;
    avatar: string;
  };
  highlights: {
    goals: string[];
    actionStepsCompleted: string[];
  };
  insightSummary: {
    emotionalTrends: string;
    topDomains: string[];
    reflectionsSample: string[];
  };
  sccsBreakdown: {
    totalPoints: number;
    fromReflections: number;
    fromGoalProgress: number;
    fromResilienceMoments: number;
  };
  narrativeSummary: string;
}

export interface ReflectionData {
  userId: string;
  domain: string;
  reflectionText: string;
  tone: string;
  actionStep?: string;
  sccsPointsAwarded: number;
  createdAt: Date;
}

export interface SCCSContribution {
  userId: string;
  category: string;
  description: string;
  points: number;
  source: string;
  timestamp: Date;
}

export class SCCSReportingService {

  // Domain reflection framework from user requirements
  private reflectionDomains = [
    {
      name: "Housing",
      purpose: "Understand housing stability, needs, and progress",
      samplePrompts: [
        "How safe and stable is your current living situation?",
        "What would better housing look like for you?", 
        "Have you had to move recently or are worried about it?"
      ],
      sccsLogic: "+2 for completion, +3 for concrete steps taken (e.g. application, meeting)",
      triggers: ["every 4–5 days", "after housing-related notes", "new shelter/lease info"]
    },
    {
      name: "Employment", 
      purpose: "Track job goals, search efforts, stability, and barriers",
      samplePrompts: [
        "What kind of work would feel like a good fit right now?",
        "Are you looking for work, already working, or in between?",
        "What's one thing you could do to move forward this week?"
      ],
      sccsLogic: "+2 for insight, +3 for milestone (interview, resume, first day, etc.)",
      triggers: ["biweekly check", "after job search goal", "post-rejection support"]
    },
    {
      name: "Health",
      purpose: "Check in on physical and mental health needs + coping strategies", 
      samplePrompts: [
        "How's your body been feeling lately? Anything you're ignoring?",
        "What's been affecting your mood the most this week?",
        "Who supports you when you're not feeling okay?"
      ],
      sccsLogic: "+2 for emotional awareness, +3 for accessing support or health action",
      triggers: ["every 3 days", "after negative emotional tone detected"]
    },
    {
      name: "Legal & Justice",
      purpose: "Address supervision, court, paperwork, and related stress",
      samplePrompts: [
        "Any upcoming court or PO appointments this week?",
        "What's the most frustrating part of your justice involvement right now?", 
        "Need help figuring out any paperwork, fines, or documents?"
      ],
      sccsLogic: "+2 for honesty, +3 for resolution progress (e.g. completed appt, resolved barrier)",
      triggers: ["weekly if on parole", "new missed check-in", "flagged PO comment"]
    },
    {
      name: "Relationships",
      purpose: "Explore support networks, conflicts, family connections",
      samplePrompts: [
        "Who's been in your corner lately?",
        "Any tension or breakdowns in relationships this week?",
        "Want to work on trust, boundaries, or communication?"
      ],
      sccsLogic: "+2 for self-awareness, +3 for healthy boundary action or reconnection", 
      triggers: ["every 5 days", "post-crisis event", "user journaling signal"]
    }
  ];

  // Save reflection to database
  async saveReflection(data: Omit<ReflectionData, 'createdAt'>): Promise<void> {
    console.log('💭 Saving reflection:', {
      userId: data.userId,
      domain: data.domain, 
      tone: data.tone,
      sccsPoints: data.sccsPointsAwarded
    });

    // This would integrate with your actual database
    // For now, we'll log and trigger follow-up actions
    
    // Check for Customer.io triggers
    const triggers = await customerIOService.detectTriggers(
      data.userId, 
      data.reflectionText, 
      data.tone
    );

    // Send any triggered events
    for (const trigger of triggers) {
      await customerIOService.sendCustomerIOEvent(trigger);
    }
  }

  // Log SCCS contribution
  async logSCCSContribution(contribution: Omit<SCCSContribution, 'timestamp'>): Promise<void> {
    console.log('🏆 SCCS Contribution logged:', {
      userId: contribution.userId,
      category: contribution.category,
      points: contribution.points,
      source: contribution.source
    });

    // This would save to your SCCS log table
    // Check for milestone achievements
    await this.checkMilestones(contribution.userId, contribution.points);
  }

  // Check for SCCS milestones and trigger rewards
  private async checkMilestones(userId: string, newPoints: number): Promise<void> {
    // This would calculate total SCCS score and check for milestones
    const totalScore = 27; // Example - would query from database
    
    // Milestone rewards at 25, 50, 75, 100 points
    const milestones = [25, 50, 75, 100];
    const previousScore = totalScore - newPoints;
    
    for (const milestone of milestones) {
      if (previousScore < milestone && totalScore >= milestone) {
        console.log(`🎉 Milestone achieved: ${milestone} SCCS points!`);
        
        // Trigger celebration message
        await customerIOService.sendCustomerIOEvent({
          userId,
          eventType: 'life_event',
          eventData: { milestone, totalScore },
          priority: 'medium'
        });
      }
    }
  }

  // Generate SCCS summary for sharing
  async generateSCCSSummary(userId: string, dateRange: string): Promise<SCCSSummary> {
    // This is a template based on user requirements
    // In production, this would query real data from database
    
    const mockSummary: SCCSSummary = {
      header: {
        userName: "User", // Would get from user table
        dateRange: dateRange,
        sccsScore: 27,
        avatar: "auto-generated-visual-id" 
      },
      highlights: {
        goals: [
          "Secure stable housing",
          "Reconnect with daughter", 
          "Improve coping strategies"
        ],
        actionStepsCompleted: [
          "Submitted 2 housing applications",
          "Reached out to local mentor",
          "Started journaling nightly with SIAni"
        ]
      },
      insightSummary: {
        emotionalTrends: "Mostly calm with moments of fear and isolation",
        topDomains: ["Housing", "Relationships", "Health"],
        reflectionsSample: [
          "\"Even though I don't feel like I deserve it, I want to try to show up for my daughter.\"",
          "\"I stayed sober this weekend, which is a win for me.\""
        ]
      },
      sccsBreakdown: {
        totalPoints: 27,
        fromReflections: 14,
        fromGoalProgress: 9, 
        fromResilienceMoments: 4
      },
      narrativeSummary: "This person has engaged consistently and vulnerably with SIAni, setting meaningful goals and completing action steps tied to personal growth. Their progress reflects emotional maturity, commitment to change, and emerging stability in key areas like housing and relationships."
    };

    return mockSummary;
  }

  // Get domain-specific reflection prompts
  getDomainPrompts(domain: string): string[] {
    const domainConfig = this.reflectionDomains.find(d => 
      d.name.toLowerCase() === domain.toLowerCase()
    );
    
    return domainConfig?.samplePrompts || [
      "How are things going in this area?",
      "What's one step you could take this week?",
      "Any support or resources you need?"
    ];
  }

  // Calculate SCCS points for domain reflection
  calculateDomainSCCS(domain: string, hasActionStep: boolean, emotionalTone: string): number {
    let points = 2; // Base points for reflection
    
    if (hasActionStep) {
      points += 3; // Concrete action taken
    }
    
    // Bonus points for positive emotional breakthroughs
    if (emotionalTone === 'hopeful' || emotionalTone === 'determined') {
      points += 2;
    }
    
    return points;
  }

  // Trigger domain check-in based on schedule or events
  async triggerDomainCheckin(userId: string, domain: string, triggerType: string): Promise<void> {
    console.log(`🔄 Domain check-in triggered:`, {
      userId,
      domain,
      triggerType,
      timestamp: new Date().toISOString()
    });

    const prompts = this.getDomainPrompts(domain);
    const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    // This would send the prompt via Customer.io or in-app notification
    console.log(`📝 Sending domain prompt: "${selectedPrompt}"`);
  }
}

export const sccsReportingService = new SCCSReportingService();