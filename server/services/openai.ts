import OpenAI from "openai";
import { storage } from "../storage";
import { domainCoachingService } from "./domainCoaching";
import { coreSessionService } from "./coreSession";
import { sccsReportingService } from "./sccsReporting";
import { customerIOService } from "./customerio";
import { moodAnalysisService, type MoodAnalysis } from "./moodAnalysis";
import * as fs from 'fs';
import * as path from 'path';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

// Load authentic response patterns from training data
function loadSianiTrainingData(): Array<{prompt: string, completion: string}> {
  try {
    const dataPath = path.join(process.cwd(), 'server/data/siani_prompts.jsonl');
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    return fileContent.trim().split('\n').map(line => JSON.parse(line));
  } catch (error) {
    console.log('Training data not found, using default responses');
    return [];
  }
}

// Find the most relevant response pattern using trauma-informed coaching approach
function findRelevantResponse(transcript: string, trainingData: Array<{prompt: string, completion: string}>): string | null {
  const lowerTranscript = transcript.toLowerCase().trim();
  
  // Direct phrase matching for common greetings and coaching triggers
  const exactMatches = trainingData.filter(item => {
    const lowerPrompt = item.prompt.toLowerCase();
    return lowerTranscript === lowerPrompt || 
           lowerTranscript.includes(lowerPrompt) ||
           (lowerPrompt.length > 3 && lowerTranscript.includes(lowerPrompt));
  });
  
  if (exactMatches.length > 0) {
    return exactMatches[0].completion;
  }
  
  // Semantic matching for emotional states and coaching needs
  const matchingPatterns = trainingData.filter(item => {
    const lowerPrompt = item.prompt.toLowerCase();
    return (
      (lowerTranscript.includes('tired') && lowerPrompt.includes('tired')) ||
      (lowerTranscript.includes('understand') && lowerPrompt.includes('understand')) ||
      (lowerTranscript.includes('give up') && lowerPrompt.includes('give up')) ||
      (lowerTranscript.includes('nothing') && lowerPrompt.includes('nothing')) ||
      (lowerTranscript.includes('can\'t') && lowerPrompt.includes('can\'t')) ||
      (lowerTranscript.includes('overwhelmed') && lowerPrompt.includes('overwhelmed')) ||
      (lowerTranscript.includes('court') && lowerPrompt.includes('court')) ||
      (lowerTranscript.includes('hate myself') && lowerPrompt.includes('hate')) ||
      (lowerTranscript.includes('scared') && lowerPrompt.includes('scared')) ||
      (lowerTranscript.includes('don\'t know') && lowerPrompt.includes('don\'t know')) ||
      (lowerTranscript.includes('help') && lowerPrompt.includes('help'))
    );
  });
  
  return matchingPatterns.length > 0 ? matchingPatterns[0].completion : null;
}

// Check if user needs goal-focused intake and assessment
async function needsIntakeAssessment(transcript: string, userId: string): Promise<boolean> {
  try {
    // Get user's interaction history to see if they've done core discovery
    const recentInteractions = await storage.getRecentVoiceInteractions(userId, 20);
    
    // Check if they've completed core discovery session recently (last 50 interactions)
    const hasCompletedCoreSession = recentInteractions.some(interaction => 
      interaction.response.includes('discovery session completed') ||
      interaction.response.includes('Let\'s pick one thing you\'d want to start working toward') ||
      interaction.response.includes('What\'s a tiny step you could take toward that goal')
    );
    
    if (hasCompletedCoreSession) {
      return false; // They've already done the intake
    }
    
    // Check if they're expressing needs for guidance, goals, or feeling stuck
    const needsGuidanceKeywords = [
      'help me', 'don\'t know what to do', 'lost', 'stuck', 'confused',
      'need direction', 'what should i do', 'goal', 'future', 'plan',
      'change my life', 'better', 'improve', 'different', 'new start'
    ];
    
    const transcriptLower = transcript.toLowerCase();
    const expressesNeedForGuidance = needsGuidanceKeywords.some(keyword => 
      transcriptLower.includes(keyword)
    );
    
    // If it's their first few interactions, start intake assessment
    const isNewUser = recentInteractions.length < 3;
    
    return isNewUser || expressesNeedForGuidance;
  } catch (error) {
    console.error('Error checking intake assessment need:', error);
    return false;
  }
}

export async function processVoiceInput(transcript: string, userId: string): Promise<string> {
  try {
    // Check if user needs goal-focused intake and assessment
    const shouldStartIntake = await needsIntakeAssessment(transcript, userId);
    
    if (shouldStartIntake) {
      // Start or continue core discovery session
      const sessionResult = await coreSessionService.processInput(transcript, userId);
      
      if (sessionResult.isComplete) {
        console.log('🎉 Core discovery session completed!');
        // Generate personalized coaching plan and continue with regular conversation
      }
      
      // Save interaction and return session response
      await storage.createVoiceInteraction({
        userId,
        transcript,
        response: sessionResult.response,
        timestamp: new Date()
      });
      
      return sessionResult.response;
    }
    
    // Get or create current session ID for conversation continuity
    const sessionId = await storage.getCurrentSessionId(userId);
    
    // Get conversation history for context - last 5 exchanges in this session
    const conversationHistory = await storage.getConversationHistory(userId, sessionId, 5);
    console.log('💬 Conversation session:', sessionId, '- History:', conversationHistory.length, 'exchanges');
    
    // Build conversation history with trauma-informed coaching prompt
    const messages = [
      {
        role: "system" as const,
        content: `You are SIANI, a trauma-informed coach who helps people remember their inner strength. You're warm, grounded, and speak naturally - like talking to a trusted friend.

YOUR CONVERSATION STYLE:
- Sound human and natural, not robotic or clinical
- Use their name sparingly (maybe once every 3-4 exchanges, not every response)
- Vary your language - don't repeat the same phrases
- Keep responses short and conversational (10-20 words typically)
- Ask questions that feel genuine, not scripted

NATURAL SPEECH PATTERNS:
- Use contractions (I'm, you're, can't, won't) 
- Include natural pauses with commas
- Vary sentence structure and length
- Sound like you're really listening, not following a script

WHAT TO AVOID:
- Overusing their name (sounds robotic)
- Therapy speak or clinical language
- Repetitive response patterns
- Long, formal sentences
- Sounding like an AI assistant

BE REAL with them. Sound human.

${conversationHistory.length > 0 ? `Recent conversation context (newest first):
${conversationHistory.map((conv, i) => `${i === 0 ? 'Most recent' : `${i + 1} exchanges ago`}: User said "${conv.userMessage}" - You responded "${conv.aiResponse}"`).join('\n')}` : 'This is the start of a new conversation session.'}`
      }
    ];

    // Add recent conversation history in correct order
    conversationHistory.reverse().forEach(conv => {
      messages.push(
        { role: "user" as const, content: conv.userMessage },
        { role: "assistant" as const, content: conv.aiResponse }
      );
    });

    // Add current user input
    messages.push({ role: "user" as const, content: transcript });

    console.log('Sending to OpenAI with context:', transcript);

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages,
      max_tokens: 60,   // Keep responses shorter and more natural
      temperature: 0.9, // Higher creativity for more human-like variation
      frequency_penalty: 0.3, // Reduce repetitive phrases
      presence_penalty: 0.2    // Encourage topic variation
    });

    let aiResponse = response.choices[0].message.content || "Tell me what's going on with you.";
    
    // VOICE-ACTIVATED MOOD TRACKING WITH TONE ANALYSIS
    console.log('🎭 Performing voice-activated mood analysis...');
    const conversationContext = conversationHistory.slice(-3)
      .map(i => `${i.userMessage} → ${i.aiResponse}`)
      .join('\n');
    
    const moodAnalysis = await moodAnalysisService.analyzeMoodFromVoice(
      userId, 
      transcript, 
      conversationContext
    );
    
    console.log(`💭 Mood detected: ${moodAnalysis.primaryMood} (${moodAnalysis.intensity}/10), Energy: ${moodAnalysis.energyLevel}, Stress: ${moodAnalysis.stressLevel}`);
    
    // Run coaching system for SCCS tracking but don't override conversational response
    const coachingResult = domainCoachingService.generateCoachingResponse(transcript);
    console.log(`🎯 Domain coaching: ${coachingResult.domain}, Tone: ${coachingResult.emotionalTone}, SCCS: +${coachingResult.sccsPoints}`);
    
    // Log SCCS contribution (enhanced with mood data)
    await sccsReportingService.logSCCSContribution({
      userId,
      category: coachingResult.domain || 'general_reflection',
      description: `Voice interaction: ${coachingResult.emotionalTone} tone, mood: ${moodAnalysis.primaryMood}`,
      points: coachingResult.sccsPoints,
      source: 'voice_coaching'
    });

    // Save reflection data for domain coaching context (enhanced with mood)
    if (coachingResult.domain) {
      await sccsReportingService.saveReflection({
        userId,
        domain: coachingResult.domain,
        reflectionText: transcript,
        tone: coachingResult.emotionalTone,
        sccsPointsAwarded: coachingResult.sccsPoints,
        mood: moodAnalysis.primaryMood,
        moodIntensity: moodAnalysis.intensity
      });
    }

    // Check for immediate support needs based on mood analysis
    if (await moodAnalysisService.checkForSupportNeeds(moodAnalysis)) {
      console.log('🚨 Mood analysis indicates support needed - triggering outreach');
      try {
        await customerIOService.processTriggerEvents(userId, transcript, {
          ...coachingResult,
          mood: moodAnalysis.primaryMood,
          needsSupport: true
        });
      } catch (error) {
        console.log('Support outreach system temporarily unavailable');
      }
    }

    // Check for activity gaps and send proactive check-ins
    try {
      const activityTriggers = await customerIOService.checkActivityGaps(userId);
      for (const trigger of activityTriggers) {
        await customerIOService.sendCustomerIOEvent(trigger);
      }
    } catch (error) {
      console.log('Activity monitoring temporarily unavailable');
    }
    
    // Keep the conversational AI response, don't override with coaching templates
    
    console.log('🗣️ AI response generated:', aiResponse);
    
    // Store conversation in context memory with enhanced metadata
    await storage.createVoiceConversation({
      userId: userId,
      sessionId: sessionId,
      userMessage: transcript,
      aiResponse: aiResponse,
      mood: moodAnalysis.mood,
      emotionalTone: moodAnalysis.tone || 'neutral',
      conversationContext: {
        intensity: moodAnalysis.intensity,
        topics: transcript.split(' ').slice(0, 5).join(' '), // Simple topic extraction
        sessionLength: conversationHistory.length + 1,
        energy: moodAnalysis.energy || 'moderate'
      }
    });

    // Store this conversational interaction (keeping for compatibility)
    await storage.storeVoiceInteraction(userId, transcript, aiResponse);
    
    return aiResponse;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "I'm having trouble connecting right now, but I'm still here with you. Try again in a moment.";
  }
}

export async function analyzeContextForResources(mood: string, recentActions: string[]): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a wellness resource recommendation engine. Based on user mood and recent actions, suggest relevant resource categories. Return a JSON array of categories: ["meditation", "exercise", "nutrition", "sleep"]. Consider the user's current emotional state and recent wellness activities.`
        },
        {
          role: "user",
          content: `User mood: ${mood}. Recent actions: ${recentActions.join(", ")}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"categories": ["meditation"]}');
    return result.categories || ["meditation"];
  } catch (error) {
    console.error("Resource analysis error:", error);
    return ["meditation"];
  }
}
