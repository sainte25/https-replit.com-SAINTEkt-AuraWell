import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  Moon, 
  Activity, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Watch,
  Thermometer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SianiAvatar from '@/components/siani-avatar';

interface BiometricEntry {
  heartRate?: number;
  heartRateVariability?: number;
  sleepDuration?: number;
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  stepCount?: number;
  activeMinutes?: number;
  stressLevel?: number;
  bloodOxygen?: number;
  bodyTemperature?: number;
  source: 'manual' | 'fitbit' | 'apple_health' | 'garmin' | 'samsung_health' | 'google_fit';
}

interface HealthInsight {
  type: 'sleep' | 'activity' | 'stress' | 'heart_health' | 'overall_wellness';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
  trendDirection: 'improving' | 'stable' | 'declining';
  correlatedMoods: string[];
}

interface MoodCorrelation {
  mood: string;
  correlationStrength: number;
  insights: string[];
  recommendations: string[];
  biometricFactors: {
    heartRate?: { value: number; impact: 'positive' | 'negative' | 'neutral' };
    sleep?: { quality: string; duration: number; impact: 'positive' | 'negative' | 'neutral' };
    activity?: { steps: number; activeMinutes: number; impact: 'positive' | 'negative' | 'neutral' };
    stress?: { level: number; impact: 'positive' | 'negative' | 'neutral' };
  };
}

export default function BiometricTracker() {
  const [activeTab, setActiveTab] = useState('input');
  const [biometricEntry, setBiometricEntry] = useState<BiometricEntry>({
    source: 'manual'
  });
  const [showSianiInsights, setShowSianiInsights] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recent biometric data
  const { data: recentData, isLoading: dataLoading } = useQuery({
    queryKey: ['/api/biometrics/recent'],
    queryFn: async () => {
      const response = await fetch('/api/biometrics/recent');
      if (!response.ok) throw new Error('Failed to fetch biometric data');
      return response.json();
    }
  });

  // Fetch health insights
  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/biometrics/insights'],
    queryFn: async () => {
      const response = await fetch('/api/biometrics/insights');
      if (!response.ok) throw new Error('Failed to fetch health insights');
      return response.json();
    }
  });

  // Fetch mood correlations
  const { data: correlations, isLoading: correlationsLoading } = useQuery({
    queryKey: ['/api/biometrics/mood-correlations'],
    queryFn: async () => {
      const response = await fetch('/api/biometrics/mood-correlations');
      if (!response.ok) throw new Error('Failed to fetch mood correlations');
      return response.json();
    }
  });

  // Submit biometric data
  const submitBiometricMutation = useMutation({
    mutationFn: async (data: BiometricEntry) => {
      const response = await fetch('/api/biometrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to submit biometric data');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Biometric Data Saved",
        description: "Your health data has been recorded and analyzed.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/biometrics/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/biometrics/insights'] });
      queryClient.invalidateQueries({ queryKey: ['/api/biometrics/mood-correlations'] });
      
      // Reset form
      setBiometricEntry({ source: 'manual' });
      
      // Show SIANI insights if available
      if (data.insights && data.insights.length > 0) {
        setShowSianiInsights(true);
        setTimeout(() => setShowSianiInsights(false), 10000);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save biometric data. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setBiometricEntry(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    // Validate that at least one biometric field is filled
    const hasData = Object.keys(biometricEntry).some(key => 
      key !== 'source' && biometricEntry[key as keyof BiometricEntry] !== undefined && biometricEntry[key as keyof BiometricEntry] !== ''
    );
    
    if (!hasData) {
      toast({
        title: "No Data Entered",
        description: "Please enter at least one biometric measurement.",
        variant: "destructive"
      });
      return;
    }

    submitBiometricMutation.mutate(biometricEntry);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-[#DD541C]" />;
      case 'medium': return <TrendingUp className="h-4 w-4 text-[#C65F58]" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-[#EDCFB9]" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
      default: return null;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'apple_health': return '🍎';
      case 'fitbit': return '⌚';
      case 'garmin': return '🏃';
      case 'samsung_health': return '📱';
      case 'google_fit': return '🔍';
      case 'manual': return '✋';
      default: return '📊';
    }
  };

  return (
    <div className="space-y-6 p-4" style={{ 
      background: 'transparent',
      minHeight: '100vh',
      color: '#EDCFB9'
    }}>
      {/* Header */}
      <Card className="border-0 shadow-2xl" style={{ 
        background: 'rgba(42, 24, 16, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(250, 195, 88, 0.3)'
      }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: '#EDCFB9' }}>
            <Heart className="h-5 w-5" style={{ color: '#FAC358' }} />
            Biometric Health Tracking
          </CardTitle>
          <CardDescription style={{ color: 'rgba(237, 207, 185, 0.85)' }}>
            Track your health metrics and discover connections with your mood and wellness
          </CardDescription>
        </CardHeader>
      </Card>

      {/* SIANI Insights Panel - Shows when analyzing data */}
      {showSianiInsights && (
        <Card className="border-0 shadow-2xl" style={{ 
          background: 'linear-gradient(135deg, rgba(221, 84, 28, 0.2), rgba(198, 95, 88, 0.1))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(221, 84, 28, 0.5)'
        }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <SianiAvatar size="md" isActive={true} isSpeaking={true} />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold" style={{ color: '#EDCFB9' }}>
                  Analyzing Your Health Patterns
                </h3>
                <p style={{ color: 'rgba(237, 207, 185, 0.8)' }}>
                  I'm connecting your biometric data with your mood patterns to provide personalized insights...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <div className="w-full">
        <div className="grid w-full grid-cols-4 gap-2 p-1" style={{
          background: 'rgba(42, 24, 16, 0.95)',
          border: '1px solid rgba(250, 195, 88, 0.3)',
          borderRadius: '8px',
          backdropFilter: 'blur(20px)'
        }}>
          <button
            onClick={() => setActiveTab('input')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'input' ? '' : ''
            }`}
            style={activeTab === 'input' ? {
              background: 'linear-gradient(45deg, #FAC358, #DD541C)',
              color: '#2A1810',
              fontWeight: '600'
            } : {
              color: '#EDCFB9',
              background: 'transparent'
            }}
          >
            📊 Input
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'insights' ? '' : ''
            }`}
            style={activeTab === 'insights' ? {
              background: 'linear-gradient(45deg, #FAC358, #DD541C)',
              color: '#2A1810',
              fontWeight: '600'
            } : {
              color: '#EDCFB9',
              background: 'transparent'
            }}
          >
            🧠 Insights
          </button>
          <button
            onClick={() => setActiveTab('correlations')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'correlations' ? '' : ''
            }`}
            style={activeTab === 'correlations' ? {
              background: 'linear-gradient(45deg, #FAC358, #DD541C)',
              color: '#2A1810',
              fontWeight: '600'
            } : {
              color: '#EDCFB9',
              background: 'transparent'
            }}
          >
            💭 Mood Links
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'trends' ? '' : ''
            }`}
            style={activeTab === 'trends' ? {
              background: 'linear-gradient(45deg, #FAC358, #DD541C)',
              color: '#2A1810',
              fontWeight: '600'
            } : {
              color: '#EDCFB9',
              background: 'transparent'
            }}
          >
            📈 Trends
          </button>
        </div>
      </div>

      <div className="w-full">
        {activeTab === 'input' && (

          <div className="space-y-4">
          <Card className="border-0 shadow-2xl" style={{ 
            background: 'rgba(42, 24, 16, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(250, 195, 88, 0.3)'
          }}>
            <CardHeader>
              <CardTitle style={{ color: '#EDCFB9' }}>Enter Your Health Data</CardTitle>
              <CardDescription style={{ color: 'rgba(237, 207, 185, 0.85)' }}>
                Add biometric measurements manually or connect your health devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Source */}
              <div className="space-y-2">
                <Label style={{ color: '#EDCFB9' }}>Data Source</Label>
                <Select 
                  value={biometricEntry.source} 
                  onValueChange={(value) => handleInputChange('source', value)}
                >
                  <SelectTrigger style={{
                    background: 'rgba(250, 195, 88, 0.12)',
                    border: '1px solid rgba(250, 195, 88, 0.3)',
                    color: '#EDCFB9'
                  }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{
                    background: 'rgba(42, 24, 16, 0.95)',
                    border: '1px solid rgba(250, 195, 88, 0.3)',
                    color: '#EDCFB9'
                  }}>
                    <SelectItem value="manual">Manual Entry ✋</SelectItem>
                    <SelectItem value="apple_health">Apple Health 🍎</SelectItem>
                    <SelectItem value="fitbit">Fitbit ⌚</SelectItem>
                    <SelectItem value="garmin">Garmin 🏃</SelectItem>
                    <SelectItem value="samsung_health">Samsung Health 📱</SelectItem>
                    <SelectItem value="google_fit">Google Fit 🔍</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Heart Health */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: '#EDCFB9' }} className="flex items-center gap-2">
                    <Heart className="h-4 w-4" style={{ color: '#FAC358' }} />
                    Heart Rate (BPM)
                  </Label>
                  <Input
                    type="number"
                    placeholder="72"
                    value={biometricEntry.heartRate || ''}
                    onChange={(e) => handleInputChange('heartRate', parseInt(e.target.value) || undefined)}
                    style={{
                      background: 'rgba(250, 195, 88, 0.12)',
                      border: '1px solid rgba(250, 195, 88, 0.3)',
                      color: '#EDCFB9'
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: '#EDCFB9' }}>Heart Rate Variability (ms)</Label>
                  <Input
                    type="number"
                    placeholder="45"
                    value={biometricEntry.heartRateVariability || ''}
                    onChange={(e) => handleInputChange('heartRateVariability', parseInt(e.target.value) || undefined)}
                    style={{
                      background: 'rgba(250, 195, 88, 0.12)',
                      border: '1px solid rgba(250, 195, 88, 0.3)',
                      color: '#EDCFB9'
                    }}
                  />
                </div>
              </div>

              {/* Sleep */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: '#EDCFB9' }} className="flex items-center gap-2">
                    <Moon className="h-4 w-4" style={{ color: '#FAC358' }} />
                    Sleep Duration (hours)
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="7.5"
                    value={biometricEntry.sleepDuration || ''}
                    onChange={(e) => handleInputChange('sleepDuration', parseFloat(e.target.value) || undefined)}
                    style={{
                      background: 'rgba(250, 195, 88, 0.12)',
                      border: '1px solid rgba(250, 195, 88, 0.3)',
                      color: '#EDCFB9'
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: '#EDCFB9' }}>Sleep Quality</Label>
                  <Select value={biometricEntry.sleepQuality || ''} onValueChange={(value) => handleInputChange('sleepQuality', value)}>
                    <SelectTrigger style={{
                      background: 'rgba(250, 195, 88, 0.12)',
                      border: '1px solid rgba(250, 195, 88, 0.3)',
                      color: '#EDCFB9'
                    }}>
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent style={{
                      background: 'rgba(42, 24, 16, 0.95)',
                      border: '1px solid rgba(250, 195, 88, 0.3)',
                      color: '#EDCFB9'
                    }}>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Activity */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: '#EDCFB9' }} className="flex items-center gap-2">
                    <Activity className="h-4 w-4" style={{ color: '#FAC358' }} />
                    Step Count
                  </Label>
                  <Input
                    type="number"
                    placeholder="8000"
                    value={biometricEntry.stepCount || ''}
                    onChange={(e) => handleInputChange('stepCount', parseInt(e.target.value) || undefined)}
                    style={{
                      background: 'rgba(250, 195, 88, 0.12)',
                      border: '1px solid rgba(250, 195, 88, 0.3)',
                      color: '#EDCFB9'
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: '#EDCFB9' }}>Active Minutes</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={biometricEntry.activeMinutes || ''}
                    onChange={(e) => handleInputChange('activeMinutes', parseInt(e.target.value) || undefined)}
                    style={{
                      background: 'rgba(250, 195, 88, 0.12)',
                      border: '1px solid rgba(250, 195, 88, 0.3)',
                      color: '#EDCFB9'
                    }}
                  />
                </div>
              </div>

              {/* Stress & Vitals */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: '#EDCFB9' }} className="flex items-center gap-2">
                    <Brain className="h-4 w-4" style={{ color: '#FAC358' }} />
                    Stress Level (1-10)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="5"
                    value={biometricEntry.stressLevel || ''}
                    onChange={(e) => handleInputChange('stressLevel', parseInt(e.target.value) || undefined)}
                    style={{
                      background: 'rgba(250, 195, 88, 0.12)',
                      border: '1px solid rgba(250, 195, 88, 0.3)',
                      color: '#EDCFB9'
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: '#EDCFB9' }}>Blood Oxygen (%)</Label>
                  <Input
                    type="number"
                    min="80"
                    max="100"
                    placeholder="98"
                    value={biometricEntry.bloodOxygen || ''}
                    onChange={(e) => handleInputChange('bloodOxygen', parseInt(e.target.value) || undefined)}
                    style={{
                      background: 'rgba(250, 195, 88, 0.12)',
                      border: '1px solid rgba(250, 195, 88, 0.3)',
                      color: '#EDCFB9'
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: '#EDCFB9' }} className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4" style={{ color: '#FAC358' }} />
                    Temperature (°F)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    value={biometricEntry.bodyTemperature || ''}
                    onChange={(e) => handleInputChange('bodyTemperature', parseFloat(e.target.value) || undefined)}
                    style={{
                      background: 'rgba(250, 195, 88, 0.12)',
                      border: '1px solid rgba(250, 195, 88, 0.3)',
                      color: '#EDCFB9'
                    }}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={submitBiometricMutation.isPending}
                style={{
                  background: 'linear-gradient(45deg, #FAC358, #DD541C)',
                  color: '#2A1810',
                  fontWeight: '600',
                  border: 'none',
                  width: '100%'
                }}
                className="transition-all duration-300 hover:opacity-90"
              >
                {submitBiometricMutation.isPending ? 'Analyzing...' : 'Save & Analyze Health Data'}
              </Button>
            </CardContent>
          </Card>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4">
            {insights && insights.length > 0 ? (
              insights.map((insight: HealthInsight, index: number) => (
                <Card key={index} className="border-0 shadow-2xl" style={{ 
                  background: 'rgba(42, 24, 16, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(250, 195, 88, 0.3)'
                }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2" style={{ color: '#EDCFB9' }}>
                        {getSeverityIcon(insight.severity)}
                        {insight.title}
                      </CardTitle>
                      <Badge style={{ 
                        background: 'linear-gradient(45deg, #FAC358, #DD541C)',
                        color: '#2A1810',
                        border: 'none'
                      }}>
                        {insight.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p style={{ color: 'rgba(237, 207, 185, 0.85)' }}>{insight.description}</p>
                    
                    {insight.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold" style={{ color: '#EDCFB9' }}>Recommendations:</h4>
                        <ul className="space-y-1">
                          {insight.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2" style={{ color: 'rgba(237, 207, 185, 0.85)' }}>
                              <span style={{ color: '#DD541C' }} className="mt-1">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
          ) : (
              <Card className="border-0 shadow-2xl" style={{ 
                background: 'rgba(42, 24, 16, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(250, 195, 88, 0.3)'
              }}>
                <CardContent className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto mb-4" style={{ color: '#FAC358' }} />
                  <p style={{ color: 'rgba(237, 207, 185, 0.85)' }}>
                    Add some biometric data to see personalized health insights
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'correlations' && (
          <div className="space-y-4">
            <Card className="border-0 shadow-2xl" style={{ 
              background: 'rgba(42, 24, 16, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(250, 195, 88, 0.3)'
            }}>
              <CardContent className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto mb-4" style={{ color: '#FAC358' }} />
                <p style={{ color: 'rgba(237, 207, 185, 0.85)' }}>
                  Mood correlation insights will appear as you track both mood and biometric data
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-4">
            <Card className="border-0 shadow-2xl" style={{ 
              background: 'rgba(42, 24, 16, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(250, 195, 88, 0.3)'
            }}>
              <CardContent className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto mb-4" style={{ color: '#FAC358' }} />
                <p style={{ color: 'rgba(237, 207, 185, 0.85)' }}>
                  Health trend analysis will appear as you continue tracking your biometric data
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}