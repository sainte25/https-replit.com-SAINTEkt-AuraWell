import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  Heart, 
  Zap, 
  AlertCircle, 
  Smile, 
  Frown, 
  Meh, 
  Sun, 
  Cloud, 
  CloudRain,
  Star,
  Shield,
  Target,
  Flame
} from 'lucide-react';

interface MoodEntry {
  date: string;
  mood: string;
  notes?: string;
}

interface MoodInsights {
  totalEntries: number;
  dominantMood: string;
  moodDistribution: Record<string, number>;
  weeklyAverage: number;
  lastWeekCount: number;
}

const moodIcons = {
  happy: Smile,
  calm: Shield,
  energetic: Flame,
  grateful: Heart,
  anxious: CloudRain,
  sad: Cloud,
  frustrated: AlertCircle,
  overwhelmed: Brain,
  hopeful: Star,
  determined: Target,
  neutral: Meh
};

const getMoodIcon = (mood: string) => {
  const IconComponent = moodIcons[mood as keyof typeof moodIcons] || Meh;
  return <IconComponent className="h-5 w-5" style={{ color: '#FAC358' }} />;
};

export default function MoodTracker() {
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  
  const { data: moodTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['mood-trends', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/mood/trends/${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch mood trends');
      return response.json() as Promise<MoodEntry[]>;
    }
  });

  const { data: currentMood } = useQuery({
    queryKey: ['mood-current'],
    queryFn: async () => {
      const response = await fetch('/api/mood/current');
      if (!response.ok) throw new Error('Failed to fetch current mood');
      return response.json() as Promise<MoodEntry | null>;
    }
  });

  const { data: insights } = useQuery({
    queryKey: ['mood-insights'],
    queryFn: async () => {
      const response = await fetch('/api/mood/insights');
      if (!response.ok) throw new Error('Failed to fetch mood insights');
      return response.json() as Promise<MoodInsights>;
    }
  });

  const getMoodTrend = () => {
    if (!moodTrends || moodTrends.length < 2) return 'stable';
    
    const recentMoods = moodTrends.slice(-3);
    const positiveMoods = ['happy', 'calm', 'energetic', 'grateful', 'hopeful', 'determined'];
    
    const recentPositive = recentMoods.filter(entry => 
      positiveMoods.includes(entry.mood)
    ).length;
    
    const ratio = recentPositive / recentMoods.length;
    return ratio > 0.6 ? 'up' : ratio < 0.3 ? 'down' : 'stable';
  };

  const getTrendIcon = () => {
    const trend = getMoodTrend();
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4" style={{ color: '#FAC358' }} />;
      case 'down': return <AlertCircle className="h-4 w-4" style={{ color: '#DD541C' }} />;
      default: return <Heart className="h-4 w-4" style={{ color: '#C65F58' }} />;
    }
  };

  if (trendsLoading) {
    return (
      <div className="space-y-6 p-4" style={{ 
        background: 'linear-gradient(135deg, #2A1810 0%, #8B4513 50%, #DD541C 100%)',
        minHeight: '100vh'
      }}>
        <Card className="border-0 shadow-2xl" style={{ 
          background: 'rgba(42, 24, 16, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(250, 195, 88, 0.3)'
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#EDCFB9' }}>
              <Brain className="h-5 w-5" style={{ color: '#FAC358' }} />
              Voice-Activated Mood Tracking
            </CardTitle>
            <CardDescription style={{ color: 'rgba(237, 207, 185, 0.85)' }}>
              AI-powered mood analysis from your voice conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-20 rounded" style={{ background: 'rgba(250, 195, 88, 0.12)' }}></div>
              <div className="h-32 rounded" style={{ background: 'rgba(250, 195, 88, 0.12)' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4" style={{ 
      background: 'linear-gradient(135deg, #2A1810 0%, #8B4513 50%, #DD541C 100%)',
      minHeight: '100vh'
    }}>
      {/* Header with SIANI sunset styling */}
      <Card className="border-0 shadow-2xl" style={{ 
        background: 'rgba(42, 24, 16, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(250, 195, 88, 0.3)'
      }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: '#EDCFB9' }}>
            <Brain className="h-5 w-5" style={{ color: '#FAC358' }} />
            Voice-Activated Mood Tracking
          </CardTitle>
          <CardDescription style={{ color: 'rgba(237, 207, 185, 0.85)' }}>
            AI analyzes your voice tone, speech patterns, and emotional content to automatically track your mood
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Current Mood */}
      {currentMood && (
        <Card className="border-0 shadow-2xl" style={{ 
          background: 'rgba(42, 24, 16, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(250, 195, 88, 0.3)'
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#EDCFB9' }}>
              <Zap className="h-5 w-5" style={{ color: '#FAC358' }} />
              Current Mood
              {getTrendIcon()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full" style={{ 
                background: 'linear-gradient(45deg, #FAC358, #DD541C)',
                boxShadow: '0 0 20px rgba(250, 195, 88, 0.4)'
              }}>
                {getMoodIcon(currentMood.mood)}
              </div>
              <div className="flex-1">
                <Badge style={{ 
                  background: 'linear-gradient(45deg, #FAC358, #DD541C)',
                  color: '#2A1810',
                  border: 'none'
                }}>
                  {currentMood.mood.charAt(0).toUpperCase() + currentMood.mood.slice(1)}
                </Badge>
                {currentMood.notes && (
                  <p className="text-sm mt-2" style={{ color: 'rgba(237, 207, 185, 0.85)' }}>
                    {currentMood.notes}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Period Selector */}
      <div className="flex gap-2">
        {[7, 14, 30].map(days => (
          <Button
            key={days}
            size="sm"
            onClick={() => setSelectedPeriod(days)}
            style={selectedPeriod === days ? {
              background: 'linear-gradient(45deg, #FAC358, #DD541C)',
              color: '#2A1810',
              border: 'none'
            } : {
              background: 'transparent',
              color: '#EDCFB9',
              border: '1px solid rgba(250, 195, 88, 0.3)'
            }}
          >
            {days} days
          </Button>
        ))}
      </div>

      {/* Mood Trends */}
      <Card className="border-0 shadow-2xl" style={{ 
        background: 'rgba(42, 24, 16, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(250, 195, 88, 0.3)'
      }}>
        <CardHeader>
          <CardTitle style={{ color: '#EDCFB9' }}>Mood Trends ({selectedPeriod} days)</CardTitle>
          <CardDescription style={{ color: 'rgba(237, 207, 185, 0.85)' }}>
            Automatically detected from your voice conversations with SIANI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {moodTrends && moodTrends.length > 0 ? (
            <div className="space-y-3">
              {moodTrends.slice(-10).reverse().map((entry, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    background: 'rgba(250, 195, 88, 0.12)',
                    border: '1px solid rgba(250, 195, 88, 0.2)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ 
                      background: 'linear-gradient(45deg, rgba(250, 195, 88, 0.3), rgba(221, 84, 28, 0.3))',
                      border: '1px solid rgba(250, 195, 88, 0.5)'
                    }}>
                      {getMoodIcon(entry.mood)}
                    </div>
                    <div>
                      <Badge style={{ 
                        background: 'linear-gradient(45deg, #FAC358, #DD541C)',
                        color: '#2A1810',
                        border: 'none'
                      }}>
                        {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                      </Badge>
                      {entry.notes && (
                        <p className="text-xs mt-1" style={{ color: 'rgba(237, 207, 185, 0.85)' }}>
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm" style={{ color: 'rgba(237, 207, 185, 0.65)' }}>
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto mb-4" style={{ color: '#FAC358' }} />
              <p style={{ color: 'rgba(237, 207, 185, 0.85)' }}>
                Start talking with SIANI to begin automatic mood tracking
              </p>
              <p className="text-sm mt-2" style={{ color: 'rgba(237, 207, 185, 0.65)' }}>
                AI will analyze your voice tone and emotional patterns
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      {insights && insights.totalEntries > 0 && (
        <Card className="border-0 shadow-2xl" style={{ 
          background: 'rgba(42, 24, 16, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(250, 195, 88, 0.3)'
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#EDCFB9' }}>
              <Brain className="h-5 w-5" style={{ color: '#FAC358' }} />
              Mood Insights
            </CardTitle>
            <CardDescription style={{ color: 'rgba(237, 207, 185, 0.85)' }}>
              Patterns from {insights.totalEntries} voice-analyzed mood entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg" style={{ 
                background: 'rgba(250, 195, 88, 0.12)',
                border: '1px solid rgba(250, 195, 88, 0.2)'
              }}>
                <div className="text-2xl font-bold" style={{ color: '#FAC358' }}>
                  {insights.dominantMood}
                </div>
                <div className="text-sm" style={{ color: 'rgba(237, 207, 185, 0.65)' }}>
                  Most Common
                </div>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ 
                background: 'rgba(250, 195, 88, 0.12)',
                border: '1px solid rgba(250, 195, 88, 0.2)'
              }}>
                <div className="text-2xl font-bold" style={{ color: '#DD541C' }}>
                  {insights.weeklyAverage}
                </div>
                <div className="text-sm" style={{ color: 'rgba(237, 207, 185, 0.65)' }}>
                  Weekly Average
                </div>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ 
                background: 'rgba(250, 195, 88, 0.12)',
                border: '1px solid rgba(250, 195, 88, 0.2)'
              }}>
                <div className="text-2xl font-bold" style={{ color: '#C65F58' }}>
                  {insights.lastWeekCount}
                </div>
                <div className="text-sm" style={{ color: 'rgba(237, 207, 185, 0.65)' }}>
                  This Week
                </div>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ 
                background: 'rgba(250, 195, 88, 0.12)',
                border: '1px solid rgba(250, 195, 88, 0.2)'
              }}>
                <div className="text-2xl font-bold" style={{ color: '#EDCFB9' }}>
                  {insights.totalEntries}
                </div>
                <div className="text-sm" style={{ color: 'rgba(237, 207, 185, 0.65)' }}>
                  Total Entries
                </div>
              </div>
            </div>

            {/* Mood Distribution */}
            <div>
              <h4 className="text-sm font-medium mb-4" style={{ color: '#EDCFB9' }}>Mood Distribution</h4>
              <div className="space-y-3">
                {Object.entries(insights.moodDistribution)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([mood, count]) => (
                  <div key={mood} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full" style={{ 
                        background: 'linear-gradient(45deg, rgba(250, 195, 88, 0.3), rgba(221, 84, 28, 0.3))',
                        border: '1px solid rgba(250, 195, 88, 0.5)'
                      }}>
                        {getMoodIcon(mood)}
                      </div>
                      <span className="capitalize" style={{ color: '#EDCFB9' }}>{mood}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 rounded-full" style={{ background: 'rgba(250, 195, 88, 0.2)' }}>
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            background: 'linear-gradient(45deg, #FAC358, #DD541C)',
                            width: `${(count / insights.totalEntries) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm w-8 text-right" style={{ color: '#EDCFB9' }}>
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card className="border-0 shadow-2xl" style={{ 
        background: 'rgba(42, 24, 16, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(250, 195, 88, 0.3)'
      }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: '#EDCFB9' }}>
            <Zap className="h-5 w-5" style={{ color: '#FAC358' }} />
            How Voice Mood Tracking Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" style={{ color: 'rgba(237, 207, 185, 0.85)' }}>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ 
                background: 'linear-gradient(45deg, #FAC358, #DD541C)',
                color: '#2A1810'
              }}>1</div>
              <div>
                <strong style={{ color: '#EDCFB9' }}>Voice Analysis:</strong> AI analyzes your speech patterns, tone, and emotional content when you talk with SIANI
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ 
                background: 'linear-gradient(45deg, #FAC358, #DD541C)',
                color: '#2A1810'
              }}>2</div>
              <div>
                <strong style={{ color: '#EDCFB9' }}>Emotion Detection:</strong> Advanced algorithms identify emotional markers, stress levels, and energy patterns
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ 
                background: 'linear-gradient(45deg, #FAC358, #DD541C)',
                color: '#2A1810'
              }}>3</div>
              <div>
                <strong style={{ color: '#EDCFB9' }}>Automatic Tracking:</strong> Mood entries are created automatically - no manual input required
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ 
                background: 'linear-gradient(45deg, #FAC358, #DD541C)',
                color: '#2A1810'
              }}>4</div>
              <div>
                <strong style={{ color: '#EDCFB9' }}>Insights & Support:</strong> System provides personalized recommendations and triggers support when needed
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}