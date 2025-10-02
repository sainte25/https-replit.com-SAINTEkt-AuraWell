import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface IntakeStage {
  stage: number;
  name: string;
  tone: string;
  questions: string[];
  prompt: string;
}

export interface IntakeResponse {
  stage: number;
  responses: string[];
  insights: string[];
  nextStage?: number;
  completed: boolean;
}

export class GoalFocusedIntakeService {
  private intakeStages: IntakeStage[] = [
    {
      stage: 1,
      name: "Personal Information",
      tone: "Grounded",
      questions: [
        "What should I call you?",
        "What's your birthday and best way to reach you?", 
        "Who should we contact in an emergency?",
        "Do you have ID, social, and key documents yet?"
      ],
      prompt: "Collect basic contact information and essential documents status. Keep it practical and grounded."
    },
    {
      stage: 2, 
      name: "Justice System History",
      tone: "Respectful + Factual",
      questions: [
        "Have you ever been involved with the justice system?",
        "Are you navigating probation, parole, or legal conditions now?", 
        "Is there anything legal we should keep in mind as we support you?"
      ],
      prompt: "Gather justice system context with respect and without judgment. Focus on practical support needs."
    },
    {
      stage: 3,
      name: "Immediate Needs", 
      tone: "Focused",
      questions: [
        "If we had to solve just the next 72 hours — what's most urgent?",
        "Do you have a safe place to sleep?",
        "Any food, meds, hygiene, or phone needs?",
        "What would make these next few days smoother?"
      ],
      prompt: "Identify immediate survival and stability needs. Be practical and solution-focused."
    },
    {
      stage: 4,
      name: "Self-Discovery Exercise",
      tone: "Expansive + Empowering", 
      questions: [
        "If time and money weren't an issue, what would you want to experience in life?",
        "How do you want to grow?",
        "What do you want to contribute to this world?",
        "Who are you? Why are you here?",
        "Where are you going? And how do you want to be remembered?",
        "If you achieved all your goals, how would that feel? Can we feel some of that now?",
        "What's most important in your life? What are you passionate about?"
      ],
      prompt: "Guide deep self-discovery and purpose exploration. Help them connect with their inner wisdom and potential."
    },
    {
      stage: 5,
      name: "Mission + Life Statement",
      tone: "Purpose-Driven",
      questions: [
        "What would your ideal life look like?",
        "How do you want to contribute to the world?", 
        "What's your mission — your reason for being?",
        "What's your personal life statement?"
      ],
      prompt: "Help crystallize their life mission and personal statement. Focus on their unique contribution and purpose."
    },
    {
      stage: 6,
      name: "Visioning + Goal Expansion", 
      tone: "Limitless",
      questions: [
        "Now let's zoom way out. If nothing could stop you, what would you do, be, or build in the next 20 years?",
        "Let's get at least 50 goals out of your head and into motion — speak them out loud by life area: Health, Relationships, Career/Business, Fun & Recreation, Money, Personal Growth, Spiritual Life"
      ],
      prompt: "Facilitate expansive goal generation across all life areas. Encourage big thinking and comprehensive life visioning."
    },
    {
      stage: 7,
      name: "Prioritization + Action",
      tone: "Focused + Confident", 
      questions: [
        "What are your top 5 most important goals for the year?",
        "What's your #1 goal in each life area — and why does it matter?",
        "What's one small step we could take today toward each one?",
        "What help, accountability, or resources might unlock momentum?"
      ],
      prompt: "Guide prioritization and immediate action planning. Help them identify the most important goals and next steps."
    },
    {
      stage: 8,
      name: "Strategy + Unblocking",
      tone: "Coaching-Style, Reflective",
      questions: [
        "What's a fear or mental block that still shows up for you?",
        "What's a story you've been telling yourself that keeps you stuck?",
        "What would a more powerful story sound like?",
        "What's distracting or draining you right now?",
        "What's one habit you know it's time to shift?",
        "What skill would make a difference if you mastered it?",
        "Who around you lifts you up? Who pulls you off track?",
        "Who can help keep you accountable this season?",
        "What task are you still trying to do alone — that you could delegate?",
        "What's a reward that would feel amazing when you hit your goals?"
      ],
      prompt: "Identify obstacles and create breakthrough strategies. Focus on mindset shifts and support systems."
    }
  ];

  async processIntakeInput(userInput: string, currentStage: number = 1): Promise<IntakeResponse> {
    try {
      const stage = this.intakeStages.find(s => s.stage === currentStage);
      if (!stage) {
        throw new Error(`Invalid stage: ${currentStage}`);
      }

      // Generate contextual response based on stage and user input
      const response = await this.generateIntakeResponse(userInput, stage);
      
      // Determine if we should move to next stage or continue current stage
      const shouldAdvance = await this.shouldAdvanceStage(userInput, stage);
      
      return {
        stage: currentStage,
        responses: [response],
        insights: await this.extractInsights(userInput, stage),
        nextStage: shouldAdvance ? Math.min(currentStage + 1, 8) : currentStage,
        completed: currentStage === 8 && shouldAdvance
      };

    } catch (error) {
      console.error('Goal-focused intake error:', error);
      return {
        stage: currentStage,
        responses: ["Let's take a moment to center ourselves. Tell me what's on your mind right now."],
        insights: [],
        nextStage: currentStage,
        completed: false
      };
    }
  }

  private async generateIntakeResponse(userInput: string, stage: IntakeStage): Promise<string> {
    const messages = [
      {
        role: "system" as const,
        content: `You are SIANI conducting a goal-focused intake and needs assessment. This is a 25-30 minute self-discovery workshop, NOT just an intake.

CURRENT STAGE: ${stage.name} (${stage.tone})
STAGE PURPOSE: ${stage.prompt}

YOUR OPENING STYLE:
"Hey. I'm SIAni. You're not just here to survive — we're here to build a life that actually works for you. This isn't an intake. It's a reset. A moment to get clear, to reclaim your direction, and decide what really matters next."

CONVERSATION APPROACH:
- ${stage.tone} tone throughout
- Ask one meaningful question at a time
- Listen deeply and reflect back what you hear
- Guide them toward self-discovery, not just information gathering
- Keep responses conversational but purposeful (15-25 words)
- Build on their responses with follow-up questions

AVOID:
- Sounding clinical or robotic
- Rushing through questions
- Multiple questions at once
- Forgetting the empowering, asset-based approach

This is about helping them discover who they are, what they need, and what's possible.`
      },
      {
        role: "user" as const,
        content: userInput
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 60,
      temperature: 0.8,
      frequency_penalty: 0.3,
      presence_penalty: 0.2
    });

    return response.choices[0].message.content || "Tell me more about that.";
  }

  private async shouldAdvanceStage(userInput: string, stage: IntakeStage): Promise<boolean> {
    // Simple logic to determine stage advancement
    // In a full implementation, this could use AI to assess completion
    const wordCount = userInput.split(' ').length;
    
    // Advance if user has given substantial response (10+ words)
    // and we're not in the goal expansion stage (which needs more time)
    if (stage.stage === 6) {
      // Goal expansion stage - needs more interaction
      return wordCount > 30;
    }
    
    return wordCount > 10;
  }

  private async extractInsights(userInput: string, stage: IntakeStage): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Extract key insights from this ${stage.name} intake response. Focus on:
- Strengths and assets
- Support needs
- Goal themes
- Growth opportunities
Return as a JSON array of 2-3 concise insights.`
          },
          {
            role: "user", 
            content: userInput
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 150
      });

      const result = JSON.parse(response.choices[0].message.content || '{"insights": []}');
      return result.insights || [];
    } catch (error) {
      console.error('Insight extraction error:', error);
      return [];
    }
  }

  getOpeningMessage(): string {
    return "Hey. I'm SIAni. You're not just here to survive — we're here to build a life that actually works for you. This isn't an intake. It's a reset. A moment to get clear, to reclaim your direction, and decide what really matters next. I'm going to ask a few things to help us figure out what's next and what support might make the biggest difference right now. You don't need to have it all figured out — this is just the starting point. Let's start with what's real right now, and then we'll open the lens wider. What should I call you?";
  }

  getCurrentStageInfo(stage: number): IntakeStage | null {
    return this.intakeStages.find(s => s.stage === stage) || null;
  }

  getTotalStages(): number {
    return this.intakeStages.length;
  }
}

export const goalFocusedIntakeService = new GoalFocusedIntakeService();