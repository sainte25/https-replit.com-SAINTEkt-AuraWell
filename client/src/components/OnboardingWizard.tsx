import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Shield, Users, Target, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
  icon: React.ReactNode;
  characterMessage: string;
  characterEmotion: 'welcoming' | 'understanding' | 'encouraging' | 'empowering' | 'celebrating';
}

interface OnboardingWizardProps {
  onComplete: (preferences: any) => void;
  onSkip: () => void;
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState({
    preferredName: '',
    primaryGoals: [] as string[],
    supportAreas: [] as string[],
    communicationStyle: 'gentle',
    hasCompletedBefore: false
  });

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to SIANI',
      subtitle: 'I\'m here to walk alongside you',
      icon: <Heart className="w-8 h-8 text-[#DD541C]" />,
      characterMessage: "Hey there. I'm SIANI, and I'm genuinely glad you're here. This isn't about fixing you or changing who you are – you're already whole. I'm just here to remind you of the strength you already carry when life gets overwhelming.",
      characterEmotion: 'welcoming',
      content: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#DD541C] to-[#C65F58] rounded-full mx-auto flex items-center justify-center">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-medium text-[#EDCFB9] mb-2">You at Your Best</h3>
              <p className="text-[#EDCFB9]/80 leading-relaxed">
                SIANI isn't just another app – I'm a gentle reminder of who you already are. 
                When daily life stressors and chaos make you forget your inner strength, 
                I'm here to help you remember.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'understanding',
      title: 'I Get It',
      subtitle: 'Your journey matters',
      icon: <Shield className="w-8 h-8 text-[#DD541C]" />,
      characterMessage: "I know this might feel like just another system asking you questions. I want you to know – this is different. I'm trauma-informed, which means I understand that your experiences matter and your responses make sense. You're in control here.",
      characterEmotion: 'understanding',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <Card className="border-0 shadow-lg" style={{
              background: 'rgba(42, 24, 16, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(221, 84, 28, 0.3)'
            }}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#DD541C' }} />
                  <div>
                    <h4 className="font-medium mb-1" style={{ color: '#EDCFB9' }}>Trauma-Informed</h4>
                    <p className="text-sm" style={{ color: 'rgba(237, 207, 185, 0.8)' }}>I understand that your reactions and responses make sense given what you've been through.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#55000A]/20 border-[#DD541C]/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-[#DD541C] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-[#EDCFB9] font-medium mb-1">Built for You</h4>
                    <p className="text-[#EDCFB9]/80 text-sm">Specifically designed with the reentry journey in mind – housing, work, relationships, healing.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#55000A]/20 border-[#DD541C]/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Heart className="w-5 h-5 text-[#DD541C] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-[#EDCFB9] font-medium mb-1">No Judgment</h4>
                    <p className="text-[#EDCFB9]/80 text-sm">This is a space where you can be real about where you are and where you want to go.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'goals',
      title: 'What Matters to You?',
      subtitle: 'Let\'s focus on your priorities',
      icon: <Target className="w-8 h-8 text-[#DD541C]" />,
      characterMessage: "What matters most to you right now? There's no wrong answer here. Whether it's housing, reconnecting with family, finding work, or just getting through each day – your priorities are valid and important.",
      characterEmotion: 'encouraging',
      content: (
        <div className="space-y-6">
          <p className="text-[#EDCFB9]/80 text-center">Select what feels most important right now (choose as many as you want):</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              'Stable Housing', 'Employment/Work', 'Family Relationships', 'Mental Health',
              'Physical Health', 'Legal/Court Issues', 'Education/Skills', 'Financial Stability',
              'Sobriety/Recovery', 'Community Connection', 'Personal Growth', 'Daily Stability'
            ].map((goal) => (
              <Button
                key={goal}
                variant={preferences.primaryGoals.includes(goal) ? "default" : "outline"}
                size="sm"
                className={`h-auto p-3 text-left justify-start ${
                  preferences.primaryGoals.includes(goal) 
                    ? 'bg-[#DD541C] text-white border-[#DD541C]' 
                    : 'bg-transparent border-[#DD541C]/40 text-[#EDCFB9] hover:bg-[#DD541C]/20'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🎯 Goal selected:', goal);
                  const newGoals = preferences.primaryGoals.includes(goal)
                    ? preferences.primaryGoals.filter(g => g !== goal)
                    : [...preferences.primaryGoals, goal];
                  setPreferences({...preferences, primaryGoals: newGoals});
                }}
                style={{
                  pointerEvents: 'auto',
                  touchAction: 'manipulation',
                  cursor: 'pointer'
                }}
              >
                <span className="text-xs leading-tight">{goal}</span>
              </Button>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'support',
      title: 'How Can I Support You?',
      subtitle: 'Your communication preferences',
      icon: <Users className="w-8 h-8 text-[#DD541C]" />,
      characterMessage: "Everyone needs support differently. Some people want direct guidance, others prefer gentle encouragement. Some need accountability, others need space to figure things out. What style feels right for you?",
      characterEmotion: 'understanding',
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-[#EDCFB9] text-sm mb-3">How would you like me to communicate with you?</p>
              <div className="space-y-2">
                {[
                  { value: 'gentle', label: 'Gentle & Encouraging', desc: 'Soft reminders and warm support' },
                  { value: 'direct', label: 'Direct & Clear', desc: 'Straightforward guidance and action steps' },
                  { value: 'flexible', label: 'Flexible & Adaptive', desc: 'Adjust to how you\'re feeling each day' }
                ].map((style) => (
                  <Button
                    key={style.value}
                    variant={preferences.communicationStyle === style.value ? "default" : "outline"}
                    className={`w-full h-auto p-4 text-left justify-start ${
                      preferences.communicationStyle === style.value
                        ? 'bg-[#DD541C] text-white border-[#DD541C]'
                        : 'bg-transparent border-[#DD541C]/40 text-[#EDCFB9] hover:bg-[#DD541C]/20'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🗣️ Communication style selected:', style.value);
                      setPreferences({...preferences, communicationStyle: style.value as any});
                    }}
                    style={{
                      pointerEvents: 'auto',
                      touchAction: 'manipulation',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div className="font-medium">{style.label}</div>
                      <div className="text-xs opacity-80 mt-1">{style.desc}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ready',
      title: 'You\'re Ready',
      subtitle: 'Let\'s begin this journey together',
      icon: <Sparkles className="w-8 h-8 text-[#DD541C]" />,
      characterMessage: "You've shown up. You've been honest about what matters to you. That's already a huge step. Remember – you already have everything you need inside you. I'm just here to help you remember that when things get tough.",
      characterEmotion: 'celebrating',
      content: (
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#DD541C] to-[#C65F58] rounded-full mx-auto flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-medium text-[#EDCFB9] mb-2">Welcome Home</h3>
            <p className="text-[#EDCFB9]/80 leading-relaxed mb-6">
              This is your space. Your voice matters here. Your goals matter here. 
              You matter here.
            </p>
            <div className="bg-[#55000A]/20 border border-[#DD541C]/20 rounded-lg p-4">
              <div className="text-sm text-[#EDCFB9]/80">
                <p className="mb-2">Remember:</p>
                <ul className="space-y-1 text-left">
                  <li>• You can talk to me anytime by tapping the microphone</li>
                  <li>• Every conversation helps build your progress</li>
                  <li>• There's no judgment here, only support</li>
                  <li>• You're in control of your journey</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(preferences);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (currentStepData.id === 'goals') {
      return preferences.primaryGoals.length > 0;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#DD541C]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#C65F58]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentStepData.icon}
              <div>
                <h1 className="text-lg font-medium text-[#EDCFB9]">{currentStepData.title}</h1>
                <p className="text-sm text-[#EDCFB9]/80">{currentStepData.subtitle}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('⏭️ Skip onboarding clicked');
                onSkip();
              }}
              className="text-[#EDCFB9]/60 hover:text-[#EDCFB9] hover:bg-[#DD541C]/20"
              style={{
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                cursor: 'pointer'
              }}
            >
              Skip
            </Button>
          </div>
          <Progress value={progress} className="h-2 bg-[#55000A]/40" />
        </div>

        {/* Character Guide */}
        <div className="px-6 mb-6">
          <Card className="bg-gradient-to-r from-[#55000A]/40 to-[#DD541C]/20 border-[#DD541C]/30">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DD541C] to-[#C65F58] flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-[#DD541C] font-medium mb-1">SIANI</div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-[#EDCFB9]/90 leading-relaxed"
                    >
                      {currentStepData.characterMessage}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStepData.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('⬅️ Previous step clicked');
                prevStep();
              }}
              disabled={currentStep === 0}
              className="text-[#EDCFB9]/60 hover:text-[#EDCFB9] hover:bg-[#DD541C]/20 disabled:opacity-30"
              style={{
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="text-xs text-[#EDCFB9]/60">
              {currentStep + 1} of {steps.length}
            </div>

            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('➡️ Next step clicked, current step:', currentStep);
                nextStep();
              }}
              disabled={!canProceed()}
              className="bg-[#DD541C] hover:bg-[#DD541C]/80 text-white disabled:opacity-50"
              style={{
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                cursor: 'pointer'
              }}
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}