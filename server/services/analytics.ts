import OpenAI from "openai";
import { storage } from "../storage";
import { moodEntries, dailyActions, voiceInteractions, analyticsInsights, mlPredictions, userBehaviorPatterns } from "../../shared/schema";
import { eq, desc, gte, sql } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface MoodPattern {
  pattern: string;
  frequency: number;
  triggers: string[];
  recommendation: string;
}

interface WellnessTrend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  confidence: number;
  timeframe: string;
}

interface MLInsight {
  type: string;
  title: string;
  description: string;
  confidence: number;
  data: any;
  recommendations: string[];
}

export class AnalyticsService {
  
  // Generate ML-powered mood pattern analysis
  async analyzeMoodPatterns(userId: string): Promise<MLInsight[]> {
    try {
      // Get last 30 days of mood data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const moods = await storage.getUserMoods(userId);

      if (moods.length < 5) {
        return [{
          type: 'mood_pattern',
          title: 'Building Your Mood Profile',
          description: 'Keep tracking your moods to unlock personalized insights about your emotional patterns.',
          confidence: 0.3,
          data: { moodCount: moods.length },
          recommendations: ['Continue daily mood tracking', 'Notice what influences your mood']
        }];
      }

      // Use OpenAI to analyze patterns
      const moodData = moods.map(m => ({
        mood: m.mood,
        date: m.timestamp?.toISOString().split('T')[0],
        notes: m.notes
      }));

      const analysis = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{
          role: "system",
          content: `You are an AI wellness analyst. Analyze mood patterns and provide insights in JSON format.
          
          Return analysis as JSON with:
          {
            "patterns": [
              {
                "type": "weekly_cycle" | "trigger_based" | "seasonal" | "stress_response",
                "description": "Clear description of the pattern",
                "confidence": 0.0-1.0,
                "frequency": "daily|weekly|monthly",
                "triggers": ["list of identified triggers"],
                "recommendations": ["actionable suggestions"]
              }
            ],
            "trends": [
              {
                "metric": "overall_mood|mood_stability|positive_ratio",
                "direction": "improving|declining|stable",
                "confidence": 0.0-1.0,
                "timeframe": "last_week|last_month"
              }
            ]
          }`
        }, {
          role: "user",
          content: `Analyze these mood entries: ${JSON.stringify(moodData)}`
        }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(analysis.choices[0].message.content || '{}');
      
      const insights: MLInsight[] = [];
      
      // Convert patterns to insights
      if (result.patterns) {
        for (const pattern of result.patterns) {
          insights.push({
            type: 'mood_pattern',
            title: `${pattern.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Pattern Detected`,
            description: pattern.description,
            confidence: pattern.confidence,
            data: {
              patternType: pattern.type,
              frequency: pattern.frequency,
              triggers: pattern.triggers
            },
            recommendations: pattern.recommendations
          });
        }
      }

      // Convert trends to insights
      if (result.trends) {
        for (const trend of result.trends) {
          insights.push({
            type: 'wellness_trend',
            title: `${trend.metric.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Trend`,
            description: `Your ${trend.metric} has been ${trend.direction} over the ${trend.timeframe}`,
            confidence: trend.confidence,
            data: {
              metric: trend.metric,
              direction: trend.direction,
              timeframe: trend.timeframe
            },
            recommendations: this.getTrendRecommendations(trend.direction, trend.metric)
          });
        }
      }

      return insights;
      
    } catch (error) {
      console.error('Error analyzing mood patterns:', error);
      return [{
        type: 'mood_pattern',
        title: 'Analysis Unavailable',
        description: 'Unable to analyze mood patterns at this time. Keep tracking for future insights.',
        confidence: 0.1,
        data: {},
        recommendations: ['Continue mood tracking', 'Try evening reflections']
      }];
    }
  }

  // Predict future wellness scores
  async generateWellnessPredictions(userId: string): Promise<MLInsight[]> {
    try {
      // Get comprehensive user data
      const [moods, actions, interactions] = await Promise.all([
        storage.getUserMoods(userId),
        storage.getUserActions(userId, new Date().toISOString().split('T')[0]),
        storage.getVoiceInteractions(userId)
      ]);

      // Calculate current wellness metrics
      const moodScore = this.calculateMoodScore(moods);
      const actionCompletionRate = actions.length > 0 ? actions.filter(a => a.completed).length / actions.length : 0;
      const voiceEngagement = interactions.length;

      // Generate predictions using ML logic
      const predictions = await this.generateMLPredictions(userId, {
        moodScore,
        actionCompletionRate,
        voiceEngagement,
        dataPoints: moods.length + actions.length + interactions.length
      });

      return predictions;
      
    } catch (error) {
      console.error('Error generating predictions:', error);
      return [{
        type: 'prediction',
        title: 'Predictions Unavailable',
        description: 'Keep engaging with SIANI to unlock predictive insights about your wellness journey.',
        confidence: 0.2,
        data: {},
        recommendations: ['Continue daily check-ins', 'Track mood regularly', 'Complete daily actions']
      }];
    }
  }

  // Detect behavioral patterns using ML
  async detectBehaviorPatterns(userId: string): Promise<MLInsight[]> {
    try {
      // For now, return empty patterns as we're building this feature
      const patterns: any[] = [];

      // If no patterns exist, analyze and create them
      if (patterns.length === 0) {
        return await this.identifyNewPatterns(userId);
      }

      // Convert stored patterns to insights
      return patterns.map(pattern => ({
        type: 'behavior_pattern',
        title: `${pattern.pattern_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Pattern`,
        description: this.getPatternDescription(pattern.pattern_type, pattern.pattern_data),
        confidence: parseFloat(pattern.strength.toString()),
        data: pattern.pattern_data,
        recommendations: this.getPatternRecommendations(pattern.pattern_type)
      }));

    } catch (error) {
      console.error('Error detecting behavior patterns:', error);
      return [];
    }
  }

  // Store insights in database (simplified for demo)
  async storeInsight(insight: MLInsight): Promise<string> {
    try {
      // For demo purposes, just return a mock ID
      return `insight-${Date.now()}`;
    } catch (error) {
      console.error('Error storing insight:', error);
      throw error;
    }
  }

  // Get all insights for dashboard
  async getInsights(userId: string): Promise<MLInsight[]> {
    try {
      const [moodInsights, predictions, behaviorInsights] = await Promise.all([
        this.analyzeMoodPatterns(userId),
        this.generateWellnessPredictions(userId),
        this.detectBehaviorPatterns(userId)
      ]);

      const allInsights = [...moodInsights, ...predictions, ...behaviorInsights];

      // Store new insights
      for (const insight of allInsights) {
        try {
          await this.storeInsight(insight);
        } catch (error) {
          console.warn('Failed to store insight:', error);
        }
      }

      return allInsights.sort((a, b) => b.confidence - a.confidence);
      
    } catch (error) {
      console.error('Error getting insights:', error);
      return [];
    }
  }

  // Helper methods
  private calculateMoodScore(moods: any[]): number {
    if (moods.length === 0) return 0.5;
    
    const moodValues = {
      'happy': 1.0,
      'grateful': 0.9,
      'calm': 0.8,
      'energetic': 0.7,
      'sad': 0.3,
      'anxious': 0.2
    };

    const total = moods.reduce((sum, mood) => sum + (moodValues[mood.mood as keyof typeof moodValues] || 0.5), 0);
    return total / moods.length;
  }

  private async generateMLPredictions(userId: string, metrics: any): Promise<MLInsight[]> {
    // Simple ML prediction logic - in production, this would use actual ML models
    const predictions: MLInsight[] = [];

    // Mood trend prediction
    if (metrics.dataPoints > 10) {
      const moodTrend = metrics.moodScore > 0.6 ? 'improving' : metrics.moodScore < 0.4 ? 'declining' : 'stable';
      predictions.push({
        type: 'prediction',
        title: 'Mood Forecast',
        description: `Based on your patterns, your mood is likely to continue ${moodTrend} over the next week.`,
        confidence: Math.min(0.9, metrics.dataPoints / 30),
        data: {
          prediction_type: 'mood_forecast',
          predicted_trend: moodTrend,
          current_score: metrics.moodScore
        },
        recommendations: this.getMoodForecastRecommendations(moodTrend)
      });
    }

    // Goal completion prediction
    if (metrics.actionCompletionRate > 0) {
      const goalSuccess = metrics.actionCompletionRate > 0.7 ? 'high' : metrics.actionCompletionRate > 0.4 ? 'moderate' : 'low';
      predictions.push({
        type: 'prediction',
        title: 'Goal Success Likelihood',
        description: `You have a ${goalSuccess} likelihood of achieving your wellness goals this week.`,
        confidence: 0.8,
        data: {
          prediction_type: 'goal_success',
          success_probability: goalSuccess,
          completion_rate: metrics.actionCompletionRate
        },
        recommendations: this.getGoalRecommendations(goalSuccess)
      });
    }

    return predictions;
  }

  private async identifyNewPatterns(userId: string): Promise<MLInsight[]> {
    // Analyze user data to identify new patterns
    return [{
      type: 'behavior_pattern',
      title: 'Pattern Analysis in Progress',
      description: 'SIANI is learning your patterns. Continue using the app to unlock personalized insights.',
      confidence: 0.4,
      data: { status: 'learning' },
      recommendations: ['Keep tracking daily', 'Use voice features regularly', 'Complete evening reflections']
    }];
  }

  private getPatternDescription(patternType: string, patternData: any): string {
    switch (patternType) {
      case 'interaction_frequency':
        return 'You tend to engage with SIANI during specific times of day.';
      case 'mood_cycles':
        return 'Your moods follow recognizable weekly patterns.';
      case 'goal_completion':
        return 'You have consistent patterns in how you approach daily goals.';
      default:
        return 'A behavioral pattern has been identified in your wellness journey.';
    }
  }

  private getTrendRecommendations(direction: string, metric: string): string[] {
    if (direction === 'improving') {
      return ['Keep up the great work!', 'Consider what factors are contributing to this positive trend'];
    } else if (direction === 'declining') {
      return ['Focus on self-care activities', 'Consider talking with your care team', 'Try new wellness resources'];
    } else {
      return ['Maintain your current wellness practices', 'Look for small improvements to try'];
    }
  }

  private getMoodForecastRecommendations(trend: string): string[] {
    switch (trend) {
      case 'improving':
        return ['Continue current wellness practices', 'Build on positive momentum', 'Share your success with your care team'];
      case 'declining':
        return ['Prioritize self-care this week', 'Reach out for support', 'Try stress-reduction techniques'];
      default:
        return ['Focus on consistency', 'Try one new wellness activity', 'Pay attention to mood triggers'];
    }
  }

  private getGoalRecommendations(successLevel: string): string[] {
    switch (successLevel) {
      case 'high':
        return ['Set slightly more challenging goals', 'Help others with their goals', 'Celebrate your consistency'];
      case 'moderate':
        return ['Break goals into smaller steps', 'Focus on one goal at a time', 'Track what helps you succeed'];
      default:
        return ['Start with very small, achievable goals', 'Get support from your care team', 'Focus on progress, not perfection'];
    }
  }

  private getPatternRecommendations(patternType: string): string[] {
    switch (patternType) {
      case 'interaction_frequency':
        return ['Optimize your check-in times', 'Set reminders for peak engagement periods'];
      case 'mood_cycles':
        return ['Plan self-care for difficult days', 'Leverage your naturally positive periods'];
      case 'goal_completion':
        return ['Align goals with your natural patterns', 'Adjust timing based on when you succeed most'];
      default:
        return ['Use this pattern to optimize your wellness routine'];
    }
  }
}

export const analyticsService = new AnalyticsService();