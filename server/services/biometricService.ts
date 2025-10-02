import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface BiometricData {
  heartRate?: number;
  heartRateVariability?: number;
  sleepDuration?: number; // hours
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  stepCount?: number;
  activeMinutes?: number;
  stressLevel?: number; // 1-10 scale
  bloodOxygen?: number; // percentage
  bodyTemperature?: number; // fahrenheit
  timestamp: string;
  source: 'manual' | 'fitbit' | 'apple_health' | 'garmin' | 'samsung_health' | 'google_fit';
}

export interface MoodCorrelation {
  mood: string;
  biometricFactors: {
    heartRate?: { value: number; impact: 'positive' | 'negative' | 'neutral' };
    sleep?: { quality: string; duration: number; impact: 'positive' | 'negative' | 'neutral' };
    activity?: { steps: number; activeMinutes: number; impact: 'positive' | 'negative' | 'neutral' };
    stress?: { level: number; impact: 'positive' | 'negative' | 'neutral' };
  };
  correlationStrength: number; // 0-1
  insights: string[];
  recommendations: string[];
}

export interface HealthInsight {
  type: 'sleep' | 'activity' | 'stress' | 'heart_health' | 'overall_wellness';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
  trendDirection: 'improving' | 'stable' | 'declining';
  correlatedMoods: string[];
}

export class BiometricService {
  async processBiometricData(data: BiometricData, userId: string): Promise<HealthInsight[]> {
    try {
      const insights: HealthInsight[] = [];

      // Heart rate analysis
      if (data.heartRate) {
        const heartInsight = await this.analyzeHeartRate(data.heartRate, data.heartRateVariability);
        if (heartInsight) insights.push(heartInsight);
      }

      // Sleep analysis
      if (data.sleepDuration || data.sleepQuality) {
        const sleepInsight = await this.analyzeSleep(data.sleepDuration, data.sleepQuality);
        if (sleepInsight) insights.push(sleepInsight);
      }

      // Activity analysis
      if (data.stepCount || data.activeMinutes) {
        const activityInsight = await this.analyzeActivity(data.stepCount, data.activeMinutes);
        if (activityInsight) insights.push(activityInsight);
      }

      // Stress analysis
      if (data.stressLevel) {
        const stressInsight = await this.analyzeStress(data.stressLevel);
        if (stressInsight) insights.push(stressInsight);
      }

      return insights;
    } catch (error) {
      console.error('Error processing biometric data:', error);
      return [];
    }
  }

  async correlateMoodWithBiometrics(
    mood: string, 
    recentBiometrics: BiometricData[], 
    userId: string
  ): Promise<MoodCorrelation> {
    try {
      // Analyze recent biometric trends
      const avgHeartRate = this.calculateAverage(recentBiometrics.map(b => b.heartRate).filter(Boolean));
      const avgSleep = this.calculateAverage(recentBiometrics.map(b => b.sleepDuration).filter(Boolean));
      const avgSteps = this.calculateAverage(recentBiometrics.map(b => b.stepCount).filter(Boolean));
      const avgStress = this.calculateAverage(recentBiometrics.map(b => b.stressLevel).filter(Boolean));

      // Generate AI-powered correlation analysis
      const correlationAnalysis = await this.generateCorrelationInsights(
        mood,
        { avgHeartRate, avgSleep, avgSteps, avgStress }
      );

      return {
        mood,
        biometricFactors: {
          heartRate: avgHeartRate ? {
            value: avgHeartRate,
            impact: this.assessHeartRateImpact(avgHeartRate, mood)
          } : undefined,
          sleep: avgSleep ? {
            quality: this.assessSleepQuality(avgSleep),
            duration: avgSleep,
            impact: this.assessSleepImpact(avgSleep, mood)
          } : undefined,
          activity: (avgSteps || recentBiometrics.some(b => b.activeMinutes)) ? {
            steps: avgSteps || 0,
            activeMinutes: this.calculateAverage(recentBiometrics.map(b => b.activeMinutes).filter(Boolean)) || 0,
            impact: this.assessActivityImpact(avgSteps, mood)
          } : undefined,
          stress: avgStress ? {
            level: avgStress,
            impact: this.assessStressImpact(avgStress, mood)
          } : undefined
        },
        correlationStrength: correlationAnalysis.strength,
        insights: correlationAnalysis.insights,
        recommendations: correlationAnalysis.recommendations
      };
    } catch (error) {
      console.error('Error correlating mood with biometrics:', error);
      return {
        mood,
        biometricFactors: {},
        correlationStrength: 0,
        insights: [],
        recommendations: []
      };
    }
  }

  private async analyzeHeartRate(heartRate: number, hrv?: number): Promise<HealthInsight | null> {
    if (heartRate < 60) {
      return {
        type: 'heart_health',
        title: 'Low Resting Heart Rate',
        description: 'Your heart rate is below normal range. This could indicate excellent fitness or potential health concerns.',
        severity: 'medium',
        recommendations: [
          'Monitor for symptoms like dizziness or fatigue',
          'Consider consulting a healthcare provider if persistent',
          'Continue regular cardiovascular exercise'
        ],
        trendDirection: 'stable',
        correlatedMoods: ['calm', 'relaxed']
      };
    } else if (heartRate > 100) {
      return {
        type: 'heart_health',
        title: 'Elevated Resting Heart Rate',
        description: 'Your heart rate is above normal range, which may indicate stress, dehydration, or overtraining.',
        severity: 'high',
        recommendations: [
          'Practice deep breathing and relaxation techniques',
          'Ensure adequate hydration and rest',
          'Consider reducing intense activities temporarily',
          'Monitor caffeine and stimulant intake'
        ],
        trendDirection: 'declining',
        correlatedMoods: ['anxious', 'stressed', 'overwhelmed']
      };
    }
    return null;
  }

  private async analyzeSleep(duration?: number, quality?: string): Promise<HealthInsight | null> {
    if (duration && duration < 6) {
      return {
        type: 'sleep',
        title: 'Insufficient Sleep Duration',
        description: 'You\'re getting less than the recommended 7-9 hours of sleep, which can impact mood, cognition, and physical health.',
        severity: 'high',
        recommendations: [
          'Establish a consistent bedtime routine',
          'Limit screen time 1 hour before bed',
          'Create a cool, dark sleeping environment',
          'Avoid caffeine after 2 PM'
        ],
        trendDirection: 'declining',
        correlatedMoods: ['tired', 'irritable', 'stressed', 'overwhelmed']
      };
    } else if (quality === 'poor') {
      return {
        type: 'sleep',
        title: 'Poor Sleep Quality',
        description: 'Poor sleep quality can significantly impact your emotional well-being and daily functioning.',
        severity: 'medium',
        recommendations: [
          'Practice relaxation techniques before bed',
          'Consider meditation or gentle stretching',
          'Evaluate your sleep environment for comfort',
          'Track potential sleep disruptors'
        ],
        trendDirection: 'stable',
        correlatedMoods: ['groggy', 'unfocused', 'moody']
      };
    }
    return null;
  }

  private async analyzeActivity(steps?: number, activeMinutes?: number): Promise<HealthInsight | null> {
    if (steps && steps < 5000) {
      return {
        type: 'activity',
        title: 'Low Daily Activity',
        description: 'Your step count is below recommended levels. Regular movement can significantly boost mood and energy.',
        severity: 'medium',
        recommendations: [
          'Take short walks throughout the day',
          'Use stairs instead of elevators when possible',
          'Set hourly movement reminders',
          'Find enjoyable physical activities'
        ],
        trendDirection: 'stable',
        correlatedMoods: ['lethargic', 'unmotivated', 'low']
      };
    } else if (steps && steps > 15000) {
      return {
        type: 'activity',
        title: 'High Activity Level',
        description: 'Excellent activity level! High movement is strongly correlated with improved mood and mental health.',
        severity: 'low',
        recommendations: [
          'Maintain your excellent activity routine',
          'Ensure adequate recovery and rest',
          'Stay hydrated during active periods',
          'Listen to your body for signs of overexertion'
        ],
        trendDirection: 'improving',
        correlatedMoods: ['energetic', 'accomplished', 'positive']
      };
    }
    return null;
  }

  private async analyzeStress(stressLevel: number): Promise<HealthInsight | null> {
    if (stressLevel >= 7) {
      return {
        type: 'stress',
        title: 'Elevated Stress Levels',
        description: 'High stress levels can significantly impact your mood, sleep, and overall well-being.',
        severity: 'high',
        recommendations: [
          'Practice deep breathing exercises',
          'Try meditation or mindfulness techniques',
          'Consider talking to SIANI about stress management',
          'Prioritize self-care activities',
          'Evaluate current stressors and coping strategies'
        ],
        trendDirection: 'declining',
        correlatedMoods: ['anxious', 'overwhelmed', 'tense', 'irritable']
      };
    } else if (stressLevel <= 3) {
      return {
        type: 'stress',
        title: 'Low Stress Levels',
        description: 'Great job managing stress! Low stress levels support better mood and overall wellness.',
        severity: 'low',
        recommendations: [
          'Continue your effective stress management strategies',
          'Share your techniques with others who might benefit',
          'Maintain work-life balance',
          'Keep practicing preventive wellness habits'
        ],
        trendDirection: 'improving',
        correlatedMoods: ['calm', 'peaceful', 'balanced', 'content']
      };
    }
    return null;
  }

  private async generateCorrelationInsights(
    mood: string, 
    biometrics: { avgHeartRate?: number; avgSleep?: number; avgSteps?: number; avgStress?: number }
  ): Promise<{ strength: number; insights: string[]; recommendations: string[] }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are SIANI, analyzing the correlation between biometric data and mood patterns. Provide trauma-informed, empowering insights that help users understand their mind-body connection.

Focus on:
- Identifying meaningful patterns between physical health and emotional states
- Providing actionable, compassionate recommendations
- Emphasizing the user's agency and ability to influence their wellness
- Using supportive, non-judgmental language

Return a JSON object with:
- strength: correlation strength (0-1)
- insights: array of 2-3 key observations
- recommendations: array of 2-3 actionable suggestions`
          },
          {
            role: "user",
            content: `Analyze the correlation between mood "${mood}" and recent biometrics:
- Average heart rate: ${biometrics.avgHeartRate || 'N/A'}
- Average sleep: ${biometrics.avgSleep || 'N/A'} hours
- Average steps: ${biometrics.avgSteps || 'N/A'}
- Average stress level: ${biometrics.avgStress || 'N/A'}/10`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 400
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        strength: result.strength || 0.5,
        insights: result.insights || [],
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error('Error generating correlation insights:', error);
      return {
        strength: 0.3,
        insights: ['Your biometric data provides valuable insights into your wellness patterns.'],
        recommendations: ['Continue monitoring your health metrics to better understand your mind-body connection.']
      };
    }
  }

  private calculateAverage(values: number[]): number | undefined {
    if (values.length === 0) return undefined;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private assessHeartRateImpact(heartRate: number, mood: string): 'positive' | 'negative' | 'neutral' {
    if (mood === 'anxious' || mood === 'stressed') {
      return heartRate > 80 ? 'negative' : 'positive';
    }
    if (mood === 'calm' || mood === 'relaxed') {
      return heartRate < 70 ? 'positive' : 'neutral';
    }
    return 'neutral';
  }

  private assessSleepQuality(duration: number): string {
    if (duration < 6) return 'poor';
    if (duration < 7) return 'fair';
    if (duration < 9) return 'good';
    return 'excellent';
  }

  private assessSleepImpact(duration: number, mood: string): 'positive' | 'negative' | 'neutral' {
    if (duration < 6) return 'negative';
    if (duration >= 7 && duration <= 9) return 'positive';
    return 'neutral';
  }

  private assessActivityImpact(steps?: number, mood?: string): 'positive' | 'negative' | 'neutral' {
    if (!steps) return 'neutral';
    if (steps < 5000) return 'negative';
    if (steps > 8000) return 'positive';
    return 'neutral';
  }

  private assessStressImpact(stress: number, mood: string): 'positive' | 'negative' | 'neutral' {
    if (stress >= 7) return 'negative';
    if (stress <= 3) return 'positive';
    return 'neutral';
  }
}

export const biometricService = new BiometricService();