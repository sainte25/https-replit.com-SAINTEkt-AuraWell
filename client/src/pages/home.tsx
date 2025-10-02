import { useState } from "react";
import VoiceInterface from "@/components/voice-interface";
import MoodTracker from "@/components/mood-tracker";
import DailyActions from "@/components/daily-actions";
import ResourceEngine from "@/components/resource-engine";
import CareTeam from "@/components/care-team";
import CalendarSchedule from "@/components/calendar-schedule";
import CommunityPulse from "@/components/community-pulse";
import AnalyticsPage from "@/pages/analytics";
import GoalFocusedIntake from "@/components/goal-focused-intake";
import BiometricTracker from "@/components/biometric-tracker";
import FamilySupport from "@/components/family-support";
import BottomNavigation from "@/components/bottom-navigation";



// Swipe navigation removed to fix touch issues
import { useOnboarding } from "@/hooks/useOnboarding";

type Screen = "voice" | "intake" | "biometrics" | "mood" | "actions" | "resources" | "support" | "family" | "schedule" | "pulse" | "analytics";

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("voice");
  const { preferences, getWelcomeMessage, getCoachingStyle } = useOnboarding();

  // Handle screen changes
  const handleScreenChange = (screen: Screen) => {
    setCurrentScreen(screen);
  };
  
  // Swipe navigation disabled for now to fix touch issues

  // Remove the renderScreen function since we're doing direct conditional rendering

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #2A1810 0%, #1C1008 50%, #0A0400 100%)',
      color: '#EDCFB9'
    }}>
      {/* Main content area */}
      <main style={{ 
        flex: 1, 
        overflow: 'auto', 
        paddingBottom: '100px',
        background: 'transparent'
      }}>
        {currentScreen === "voice" && (
          <VoiceInterface 
            personalizedGreeting={getWelcomeMessage()} 
            coachingStyle={getCoachingStyle()}
            userPreferences={preferences}
          />
        )}
        {currentScreen === "intake" && <GoalFocusedIntake />}
        {currentScreen === "biometrics" && <BiometricTracker />}
        {currentScreen === "mood" && <MoodTracker />}
        {currentScreen === "actions" && <DailyActions />}
        {currentScreen === "pulse" && <CommunityPulse />}
        {currentScreen === "resources" && <ResourceEngine />}
        {currentScreen === "support" && <CareTeam />}
        {currentScreen === "family" && <FamilySupport />}
        {currentScreen === "schedule" && <CalendarSchedule />}
        {currentScreen === "analytics" && <AnalyticsPage />}
      </main>
      
      <BottomNavigation 
        currentScreen={currentScreen} 
        onScreenChange={handleScreenChange} 
      />
    </div>
  );
}
