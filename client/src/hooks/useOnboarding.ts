import { useState, useEffect } from 'react';

interface OnboardingPreferences {
  preferredName: string;
  primaryGoals: string[];
  supportAreas: string[];
  communicationStyle: 'gentle' | 'direct' | 'flexible';
  hasCompletedBefore: boolean;
  completedAt?: Date;
}

interface OnboardingState {
  isComplete: boolean;
  preferences: OnboardingPreferences | null;
  showWizard: boolean;
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({
    isComplete: false,
    preferences: null,
    showWizard: true  // Always start with onboarding for new users
  });

  // Check if user has completed onboarding
  useEffect(() => {
    const savedPreferences = localStorage.getItem('siani_onboarding_preferences');
    const hasCompletedOnboarding = localStorage.getItem('siani_onboarding_complete');
    
    if (savedPreferences && hasCompletedOnboarding) {
      try {
        const preferences = JSON.parse(savedPreferences);
        setState({
          isComplete: true,
          preferences,
          showWizard: false
        });
      } catch (error) {
        console.error('Failed to parse onboarding preferences:', error);
        localStorage.removeItem('siani_onboarding_preferences');
        localStorage.removeItem('siani_onboarding_complete');
        setState({
          isComplete: false,
          preferences: null,
          showWizard: true
        });
      }
    } else {
      setState({
        isComplete: false,
        preferences: null,
        showWizard: true
      });
    }
  }, []);

  const completeOnboarding = (preferences: Omit<OnboardingPreferences, 'completedAt'>) => {
    const completePreferences: OnboardingPreferences = {
      ...preferences,
      completedAt: new Date()
    };

    localStorage.setItem('siani_onboarding_preferences', JSON.stringify(completePreferences));
    localStorage.setItem('siani_onboarding_complete', 'true');
    
    setState({
      isComplete: true,
      preferences: completePreferences,
      showWizard: false
    });

    // Send to backend for personalization
    savePreferencesToBackend(completePreferences);
  };

  const skipOnboarding = () => {
    const defaultPreferences: OnboardingPreferences = {
      preferredName: '',
      primaryGoals: [],
      supportAreas: [],
      communicationStyle: 'gentle',
      hasCompletedBefore: false,
      completedAt: new Date()
    };

    localStorage.setItem('siani_onboarding_complete', 'true');
    
    setState({
      isComplete: true,
      preferences: defaultPreferences,
      showWizard: false
    });
  };

  const resetOnboarding = () => {
    localStorage.removeItem('siani_onboarding_preferences');
    localStorage.removeItem('siani_onboarding_complete');
    
    setState({
      isComplete: false,
      preferences: null,
      showWizard: true
    });
  };

  const updatePreferences = (newPreferences: Partial<OnboardingPreferences>) => {
    if (state.preferences) {
      const updatedPreferences = { ...state.preferences, ...newPreferences };
      
      setState({
        ...state,
        preferences: updatedPreferences
      });

      localStorage.setItem('siani_onboarding_preferences', JSON.stringify(updatedPreferences));
      savePreferencesToBackend(updatedPreferences);
    }
  };

  const savePreferencesToBackend = async (preferences: OnboardingPreferences) => {
    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });
    } catch (error) {
      console.error('Failed to save preferences to backend:', error);
      // Don't fail the onboarding if backend save fails
    }
  };

  // Get personalized coaching style based on preferences
  const getCoachingStyle = () => {
    if (!state.preferences) return 'gentle';
    return state.preferences.communicationStyle;
  };

  // Get personalized welcome message
  const getWelcomeMessage = () => {
    if (!state.preferences) return "Welcome to SIANI. I'm here to support you.";
    
    const { preferredName, communicationStyle } = state.preferences;
    const name = preferredName || 'friend';
    
    switch (communicationStyle) {
      case 'direct':
        return `Welcome back, ${name}. Ready to work on your goals?`;
      case 'flexible':
        return `Hey ${name}, good to see you. How are you feeling today?`;
      default:
        return `Welcome back, ${name}. I'm glad you're here.`;
    }
  };

  // Get priority domains based on user goals
  const getPriorityDomains = () => {
    if (!state.preferences?.primaryGoals) return [];
    
    const goalToDomain: Record<string, string> = {
      'Stable Housing': 'housing',
      'Employment/Work': 'employment',
      'Family Relationships': 'relationships',
      'Mental Health': 'mental_health',
      'Physical Health': 'health',
      'Legal/Court Issues': 'legal',
      'Education/Skills': 'education',
      'Financial Stability': 'financial',
      'Sobriety/Recovery': 'recovery',
      'Community Connection': 'community',
      'Personal Growth': 'personal_growth',
      'Daily Stability': 'daily_stability'
    };

    return state.preferences.primaryGoals.map(goal => goalToDomain[goal]).filter(Boolean);
  };

  return {
    isOnboardingComplete: state.isComplete,
    showOnboardingWizard: state.showWizard,
    preferences: state.preferences,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    updatePreferences,
    getCoachingStyle,
    getWelcomeMessage,
    getPriorityDomains
  };
}