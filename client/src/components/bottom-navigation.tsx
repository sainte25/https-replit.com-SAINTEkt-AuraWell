import { Mic, BarChart3, CheckSquare, Heart, Users, Calendar, MessageCircle, Brain, Compass, Activity, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Screen = "voice" | "intake" | "biometrics" | "mood" | "actions" | "resources" | "support" | "family" | "schedule" | "pulse" | "analytics";

interface BottomNavigationProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

const navItems = [
  { screen: "voice" as Screen, icon: Mic, label: "Voice" },
  { screen: "intake" as Screen, icon: Compass, label: "Intake" },
  { screen: "biometrics" as Screen, icon: Activity, label: "Health" },
  { screen: "mood" as Screen, icon: BarChart3, label: "Mood" },
  { screen: "actions" as Screen, icon: CheckSquare, label: "Actions" },
  { screen: "pulse" as Screen, icon: MessageCircle, label: "Pulse" },
  { screen: "resources" as Screen, icon: Heart, label: "Resources" },
  { screen: "support" as Screen, icon: Users, label: "Support" },
  { screen: "family" as Screen, icon: UserPlus, label: "Family" },
  { screen: "analytics" as Screen, icon: Brain, label: "Analytics" },
];

export default function BottomNavigation({ currentScreen, onScreenChange }: BottomNavigationProps) {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 py-2 z-50" 
      style={{ 
        width: '100vw',
        background: 'linear-gradient(180deg, rgba(42, 24, 16, 0.95) 0%, rgba(28, 16, 8, 0.98) 100%)', 
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(250, 195, 88, 0.2)',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))'
      }}
    >
      <div 
        className="overflow-x-auto scrollbar-hide px-2" 
        style={{ 
          WebkitOverflowScrolling: 'touch', 
          scrollBehavior: 'smooth',
          pointerEvents: 'auto',
          touchAction: 'manipulation'
        }}
      >
        <div 
          className="flex items-center space-x-2 min-w-max" 
          style={{ 
            width: 'max-content',
            pointerEvents: 'auto',
            touchAction: 'manipulation'
          }}
        >
          {navItems.map(({ screen, icon: Icon, label }) => (
            <button
              key={screen}
              onClick={() => onScreenChange(screen)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px',
                minHeight: '60px',
                minWidth: '60px',
                borderRadius: '8px',
                background: currentScreen === screen 
                  ? 'linear-gradient(45deg, rgba(250, 195, 88, 0.3), rgba(221, 84, 28, 0.3))' 
                  : 'transparent',
                color: currentScreen === screen ? '#FAC358' : 'rgba(237, 207, 185, 0.7)',
                border: currentScreen === screen ? '1px solid rgba(250, 195, 88, 0.5)' : 'none',
                cursor: 'pointer',
                touchAction: 'manipulation',
                transition: 'all 0.3s ease'
              }}
            >
              <Icon style={{ width: '20px', height: '20px' }} />
              <span style={{ fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
