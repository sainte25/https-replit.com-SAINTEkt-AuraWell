import OpenAI from "openai";
import { storage } from "../storage";
import { sccsReportingService } from "./sccsReporting";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MoodAnalysis {
  primaryMood: string;
  intensity: number; // 1-10 scale
  confidence: number; // 0-1 confidence in analysis
  emotionalTone: string;
  stressLevel: string;
  energyLevel: string;
  socialConnection: string;
  triggers?: string[];
  recommendations: string[];
  needsSupport: boolean;
}

export interface VoiceToneAnalysis {
  speechRate: 'slow' | 'normal' | 'fast';
  energyLevel: 'low' | 'moderate' | 'high';
  emotionalMarkers: string[];
  linguisticPatterns: string[];
}

export class MoodAnalysisService {
  
  // Main entry point for voice-activated mood analysis
  async analyzeMoodFromVoice(userId: string, transcript: string, context?: string): Promise<MoodAnalysis> {
    try {
      console.log('🎭 Analyzing mood from voice input');
      
      // Analyze the content and tone using AI
      const moodAnalysis = await this.performDeepMoodAnalysis(transcript, context);
      
      // Detect voice tone patterns from transcript content
      const toneAnalysis = this.analyzeSpeechPatterns(transcript);
      
      // Combine analyses for comprehensive mood assessment
      const finalAnalysis = this.combineMoodAndToneAnalysis(moodAnalysis, toneAnalysis);
      
      // Store mood entry in database
      await this.storeMoodEntry(userId, finalAnalysis);
      
      // Award SCCS points for mood awareness
      await this.awardMoodTrackingPoints(userId, finalAnalysis);
      
      // Generate contextual recommendations
      finalAnalysis.recommendations = await this.generateMoodRecommendations(finalAnalysis);
      
      console.log(`💭 Mood detected: ${finalAnalysis.primaryMood} (${finalAnalysis.intensity}/10 intensity)`);
      
      return finalAnalysis;
    } catch (error) {
      console.error('Mood analysis error:', error);
      return this.getDefaultMoodAnalysis();
    }
  }
  
  // Deep AI-powered mood analysis using GPT-4o
  private async performDeepMoodAnalysis(transcript: string, context?: string): Promise<MoodAnalysis> {
    const systemPrompt = `You are an expert trauma-informed emotional wellness coach analyzing voice input for mood tracking. 

Analyze the following transcript for:
1. Primary mood state (happy, calm, energetic, sad, anxious, grateful, frustrated, hopeful, overwhelmed, determined)
2. Emotional intensity (1-10 scale)
3. Stress indicators
4. Energy levels
5. Social connection needs
6. Potential triggers mentioned
7. Whether they need immediate support

Consider:
- Word choice and emotional language
- Topics discussed and their emotional weight
- Expression of needs, fears, or hopes
- Mentions of relationships, challenges, or victories
- Signs of resilience or struggle

Respond with JSON only in this exact format:
{
  "primaryMood": "mood_name",
  "intensity": number,
  "confidence": number,
  "emotionalTone": "description",
  "stressLevel": "low|moderate|high",
  "energyLevel": "low|moderate|high", 
  "socialConnection": "isolated|neutral|connected",
  "triggers": ["trigger1", "trigger2"],
  "needsSupport": boolean
}`;

    const userContent = context ? 
      `Context: ${context}\n\nCurrent transcript: ${transcript}` : 
      transcript;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content);
  }
  
  // Analyze speech patterns and linguistic cues
  private analyzeSpeechPatterns(transcript: string): VoiceToneAnalysis {
    const words = transcript.toLowerCase().split(/\s+/);
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Analyze speech rate indicators
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const speechRate = avgWordsPerSentence > 15 ? 'fast' : avgWordsPerSentence < 8 ? 'slow' : 'normal';
    
    // Detect emotional markers in language
    const emotionalMarkers = [];
    const energyIndicators = [];
    
    // High energy indicators
    if (/really|super|amazing|excited|can't wait|love|awesome/.test(transcript.toLowerCase())) {
      energyIndicators.push('high_energy_words');
    }
    
    // Low energy indicators  
    if (/tired|exhausted|drained|can't|struggling|hard|difficult/.test(transcript.toLowerCase())) {
      energyIndicators.push('low_energy_words');
    }
    
    // Stress indicators
    if (/stressed|worried|anxious|overwhelmed|pressure|deadline/.test(transcript.toLowerCase())) {
      emotionalMarkers.push('stress_language');
    }
    
    // Positive indicators
    if (/grateful|thankful|proud|accomplished|happy|good|better/.test(transcript.toLowerCase())) {
      emotionalMarkers.push('positive_language');
    }
    
    // Determine energy level
    const energyLevel = energyIndicators.includes('high_energy_words') ? 'high' :
                      energyIndicators.includes('low_energy_words') ? 'low' : 'moderate';
    
    return {
      speechRate,
      energyLevel,
      emotionalMarkers,
      linguisticPatterns: [...energyIndicators, ...emotionalMarkers]
    };
  }
  
  // Combine AI analysis with speech pattern analysis
  private combineMoodAndToneAnalysis(moodAnalysis: MoodAnalysis, toneAnalysis: VoiceToneAnalysis): MoodAnalysis {
    // Adjust confidence based on consistent patterns
    if (toneAnalysis.emotionalMarkers.includes('positive_language') && 
        ['happy', 'grateful', 'hopeful', 'energetic'].includes(moodAnalysis.primaryMood)) {
      moodAnalysis.confidence = Math.min(1.0, moodAnalysis.confidence + 0.1);
    }
    
    if (toneAnalysis.emotionalMarkers.includes('stress_language') && 
        ['anxious', 'overwhelmed', 'frustrated'].includes(moodAnalysis.primaryMood)) {
      moodAnalysis.confidence = Math.min(1.0, moodAnalysis.confidence + 0.1);
    }
    
    // Adjust energy level based on speech patterns
    if (toneAnalysis.energyLevel === 'low' && moodAnalysis.energyLevel === 'high') {
      moodAnalysis.energyLevel = 'moderate'; // Balance conflicting signals
    }
    
    return moodAnalysis;
  }
  
  // Store mood entry in database
  private async storeMoodEntry(userId: string, analysis: MoodAnalysis): Promise<void> {
    try {
      await storage.createMoodEntry({
        userId,
        mood: analysis.primaryMood,
        notes: `Intensity: ${analysis.intensity}/10, Energy: ${analysis.energyLevel}, Stress: ${analysis.stressLevel}`
      });
      
      console.log(`💾 Mood entry stored: ${analysis.primaryMood}`);
    } catch (error) {
      console.error('Error storing mood entry:', error);
    }
  }
  
  // Award SCCS points for mood tracking engagement
  private async awardMoodTrackingPoints(userId: string, analysis: MoodAnalysis): Promise<void> {
    try {
      let points = 3; // Base points for mood awareness
      
      // Bonus points for self-reflection and emotional awareness
      if (analysis.intensity >= 7 || analysis.needsSupport) {
        points += 2; // Extra points for being honest about difficult emotions
      }
      
      if (analysis.confidence >= 0.8) {
        points += 1; // Clear emotional expression
      }
      
      await sccsReportingService.logSCCSContribution({
        userId,
        category: 'emotional_awareness',
        description: `Mood tracking: ${analysis.primaryMood} (intensity ${analysis.intensity})`,
        points,
        source: 'voice_mood_tracking'
      });
      
      console.log(`🏆 Awarded ${points} SCCS points for mood tracking`);
    } catch (error) {
      console.error('Error awarding mood tracking points:', error);
    }
  }
  
  // Generate contextual recommendations based on mood
  private async generateMoodRecommendations(analysis: MoodAnalysis): Promise<string[]> {
    const recommendations = [];
    
    // Recommendations based on primary mood
    switch (analysis.primaryMood) {
      case 'anxious':
      case 'overwhelmed':
        recommendations.push(
          'Try a 5-minute breathing exercise',
          'Take a short walk outside',
          'Write down 3 things you can control right now'
        );
        break;
        
      case 'sad':
      case 'frustrated':
        recommendations.push(
          'Reach out to someone who cares about you',
          'Do something kind for yourself',
          'Remember: this feeling will pass'
        );
        break;
        
      case 'happy':
      case 'grateful':
        recommendations.push(
          'Share this positive energy with someone',
          'Write down what you\'re grateful for',
          'Plan something to look forward to'
        );
        break;
        
      case 'energetic':
      case 'determined':
        recommendations.push(
          'Channel this energy into your goals',
          'Tackle a task you\'ve been putting off',
          'Plan your next steps forward'
        );
        break;
    }
    
    // Stress-level specific recommendations
    if (analysis.stressLevel === 'high') {
      recommendations.push(
        'Consider setting boundaries for today',
        'Practice saying "no" to non-essential requests'
      );
    }
    
    // Energy-level specific recommendations  
    if (analysis.energyLevel === 'low') {
      recommendations.push(
        'Honor your need for rest',
        'Do something nourishing for your body'
      );
    }
    
    return recommendations.slice(0, 3); // Return top 3 recommendations
  }
  
  // Get user's recent mood patterns
  async getMoodTrends(userId: string, days: number = 7): Promise<any[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const moodEntries = await storage.getMoodEntries(userId, startDate, endDate);
      
      return moodEntries.map(entry => ({
        date: entry.timestamp,
        mood: entry.mood,
        notes: entry.notes
      }));
    } catch (error) {
      console.error('Error getting mood trends:', error);
      return [];
    }
  }
  
  // Check if immediate support is needed
  async checkForSupportNeeds(analysis: MoodAnalysis): Promise<boolean> {
    return analysis.needsSupport || 
           (analysis.intensity >= 8 && ['anxious', 'sad', 'overwhelmed'].includes(analysis.primaryMood)) ||
           analysis.stressLevel === 'high';
  }
  
  // Default mood analysis for error cases
  private getDefaultMoodAnalysis(): MoodAnalysis {
    return {
      primaryMood: 'neutral',
      intensity: 5,
      confidence: 0.5,
      emotionalTone: 'balanced',
      stressLevel: 'moderate',
      energyLevel: 'moderate',
      socialConnection: 'neutral',
      triggers: [],
      recommendations: ['Take a moment to check in with yourself'],
      needsSupport: false
    };
  }
}

export const moodAnalysisService = new MoodAnalysisService();