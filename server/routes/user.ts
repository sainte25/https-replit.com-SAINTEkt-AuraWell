// User preferences and onboarding routes
import { Router } from 'express';

const router = Router();

interface OnboardingPreferences {
  preferredName: string;
  primaryGoals: string[];
  supportAreas: string[];
  communicationStyle: 'gentle' | 'direct' | 'flexible';
  hasCompletedBefore: boolean;
  completedAt?: Date;
}

// In a real application, this would be stored in the database
let userPreferences: OnboardingPreferences | null = null;

// Save user preferences from onboarding
router.post('/preferences', async (req, res) => {
  try {
    const preferences: OnboardingPreferences = req.body;
    
    // Validate required fields
    if (!preferences.communicationStyle || !Array.isArray(preferences.primaryGoals)) {
      return res.status(400).json({ error: 'Invalid preferences data' });
    }

    // In production, save to database with user ID
    userPreferences = {
      ...preferences,
      completedAt: new Date()
    };

    console.log('👤 User onboarding preferences saved:', {
      communicationStyle: preferences.communicationStyle,
      primaryGoals: preferences.primaryGoals.length,
      preferredName: preferences.preferredName || 'Not provided'
    });

    res.json({
      message: 'Preferences saved successfully',
      preferences: userPreferences
    });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// Get user preferences
router.get('/preferences', async (req, res) => {
  try {
    if (!userPreferences) {
      return res.status(404).json({ error: 'No preferences found' });
    }

    res.json({
      preferences: userPreferences
    });
  } catch (error) {
    console.error('Error getting user preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update specific preference
router.patch('/preferences', async (req, res) => {
  try {
    if (!userPreferences) {
      return res.status(404).json({ error: 'No preferences found to update' });
    }

    const updates = req.body;
    userPreferences = {
      ...userPreferences,
      ...updates
    };

    console.log('👤 User preferences updated:', Object.keys(updates));

    res.json({
      message: 'Preferences updated successfully',
      preferences: userPreferences
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get personalized coaching prompts based on user goals
router.get('/coaching-prompts', async (req, res) => {
  try {
    if (!userPreferences) {
      return res.json({
        prompts: [
          "How are you feeling today?",
          "What's one thing you'd like to work on?",
          "Tell me about what's on your mind."
        ]
      });
    }

    const prompts = generatePersonalizedPrompts(userPreferences);
    
    res.json({
      prompts,
      basedOn: userPreferences.primaryGoals
    });
  } catch (error) {
    console.error('Error getting coaching prompts:', error);
    res.status(500).json({ error: 'Failed to get coaching prompts' });
  }
});

// Generate personalized coaching prompts based on user goals
function generatePersonalizedPrompts(preferences: OnboardingPreferences): string[] {
  const goalPrompts: Record<string, string[]> = {
    'Stable Housing': [
      "How's your living situation feeling today?",
      "Any housing updates or concerns this week?",
      "What would make your space feel more like home?"
    ],
    'Employment/Work': [
      "How's the job search going, or how's work treating you?",
      "What kind of work feels like the right fit for you?",
      "Any barriers coming up around work that we can talk through?"
    ],
    'Family Relationships': [
      "How are things with your family lately?",
      "Any family connections you want to strengthen or repair?",
      "What's one small step toward the relationships you want?"
    ],
    'Mental Health': [
      "How's your mental health been this week?",
      "What's helping you cope when things get overwhelming?",
      "Any thoughts or feelings you want to process together?"
    ],
    'Legal/Court Issues': [
      "Any legal stuff coming up that's on your mind?",
      "How are you handling the stress of court or probation?",
      "Need help thinking through any legal documents or appointments?"
    ]
  };

  const prompts: string[] = [];
  
  // Add goal-specific prompts
  preferences.primaryGoals.forEach(goal => {
    if (goalPrompts[goal]) {
      const randomPrompt = goalPrompts[goal][Math.floor(Math.random() * goalPrompts[goal].length)];
      prompts.push(randomPrompt);
    }
  });

  // Add general prompts based on communication style
  switch (preferences.communicationStyle) {
    case 'direct':
      prompts.push(
        "What's the main thing you need to tackle today?",
        "What's your next move going to be?"
      );
      break;
    case 'flexible':
      prompts.push(
        "How are you feeling, and what do you need from me today?",
        "What's your energy like right now?"
      );
      break;
    default: // gentle
      prompts.push(
        "I'm here with you. What's on your heart today?",
        "Take your time. What feels important to share?"
      );
  }

  // Ensure we have at least 3 prompts
  if (prompts.length < 3) {
    prompts.push(
      "What's one thing that went well recently?",
      "What's something you're looking forward to?",
      "How can I best support you right now?"
    );
  }

  return prompts.slice(0, 5); // Return max 5 prompts
}

export default router;