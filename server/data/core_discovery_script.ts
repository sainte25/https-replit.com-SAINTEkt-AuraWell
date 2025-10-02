// Core Discovery Session Script for SIANI
// 20-30 minute structured onboarding conversation

export interface CoreDiscoverySession {
  phase: 'welcome' | 'identity' | 'context' | 'goals' | 'wrap';
  currentStep: number;
  collectedData: {
    preferredName?: string;
    birthday?: string;
    contactPreference?: string;
    releaseDate?: string;
    timeAway?: string;
    supervisionStatus?: string;
    urgentNeeds?: string[];
    shortTermGoal?: string;
    motivation?: string;
    vision?: string;
    successDefinition?: string;
  };
}

export const coreDiscoveryPrompts = {
  welcome: {
    initial: "Hey. Thank you for being here. Before we start, I just want you to know—this isn't an intake. It's a conversation. A space to breathe, check in, and maybe start something new. Okay if we do that together?",
    grounding: "Alright. Let's get grounded. Take a slow breath. Let it out. You don't need to prove anything right now. You showed up—and that's already powerful.",
    basicInfo: "Let's start simple: What name feels best for me to call you? When's your birthday? How do you like to stay in touch—text, calls, email?"
  },

  identity: {
    intro: "Everyone has a story. I don't need all the details right now—just enough to understand where you're coming from.",
    timeline: "When did you come home, or when are you coming home? Where were you before that? How long were you away?",
    status: "Are you on parole, probation, anything like that?",
    urgentNeeds: "Let's also get you set up for the things that get overlooked: Do you have your ID? Social security card? Birth certificate? Is there anything urgent you need help with in the next 72 hours—like housing, food, hygiene, meds, or getting to appointments?"
  },

  goals: {
    intro: "Let's shift gears. I want to know what you want—not what's expected, not what's handed to you. Just real goals.",
    shortTerm: "In the next 30 days—what's one thing that would feel like progress?",
    motivation: "What are you most motivated to work on first?",
    vision: "If life could feel different three months from now—what would be different?",
    success: "What does success look like for you—not anyone else, just you?"
  },

  sparkPrompts: [
    "What's something you've overcome before that shows your strength?",
    "Who would be proud of you if you made that change?",
    "What's one thing people often misunderstand about you?",
    "If today could go right, what would that mean?"
  ],

  wrap: "You're not just surviving—you're starting to imagine something different. That matters. From here, I'm going to check in with you every day—quick, real check-ins. And we'll keep uncovering more together: housing, jobs, health, whatever's next. You're not broken. You're rebuilding. Let's do this together."
};

// Domain-specific coaching prompts from your training guide
export const domainPrompts = {
  housing: [
    "What's the energy like where you sleep at night?",
    "If housing wasn't a worry, what would you focus on instead?",
    "What would 'home' feel like for you—not just where, but how?",
    "What kind of space would feel safe and stable for you right now?",
    "Tell me about where you're sleeping these days. Is that working?",
    "If we could remove one housing stress this week, what would it be?"
  ],
  
  mental_health: [
    "When do you feel most like yourself?",
    "What helps you get through the hard days, even just a little?",
    "If we could set up one support for your mental peace, what would that be?",
    "What helps you stay grounded when things get heavy?",
    "Is there anyone who helps you feel calm or supported?",
    "If you had a safe place to talk, what would you want to share?"
  ],
  
  employment: [
    "What kind of work would make you proud to say, 'I do this'?",
    "What skills do you have that people might overlook?",
    "What's one step we could take together toward income today?",
    "Have you had a job you enjoyed before?",
    "Would working again feel like a relief or a pressure right now?"
  ],
  
  relationships: [
    "Who are the people you most want to show up for?",
    "Any relationships that are complicated but still matter to you?",
    "If you could reconnect with someone, who comes to mind?"
  ]
};

export const domainSequence = [
  { day: 0, domain: 'identity', title: 'Identity & Vision', duration: '20-30 min' },
  { day: 1, domain: 'immediate', title: 'Immediate Needs', duration: '5-10 min' },
  { day: 3, domain: 'housing', title: 'Housing Stability', duration: '10-15 min' },
  { day: 4, domain: 'employment', title: 'Work & Income', duration: '10-15 min' },
  { day: 5, domain: 'mental_health', title: 'Mental Health & Wellness', duration: '10-15 min' },
  { day: 6, domain: 'legal', title: 'Legal & Compliance', duration: '10-15 min' },
  { day: 7, domain: 'relationships', title: 'Relationships & Support', duration: '10-15 min' },
  { day: 8, domain: 'growth', title: 'Personal Growth', duration: '10-15 min' }
];

export const triggerTypes = {
  scheduled: 'Regular check-in based on day sequence',
  behavioral: 'User skips check-in or shows avoidance',
  life_event: 'User mentions specific event (court, job interview, etc)',
  emotional: 'Voice analysis detects stress, anger, or sadness'
};