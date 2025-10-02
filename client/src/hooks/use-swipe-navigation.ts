import { useState, useEffect } from 'react';

type Screen = "voice" | "intake" | "biometrics" | "mood" | "actions" | "resources" | "support" | "family" | "schedule" | "pulse" | "analytics";

const screenOrder: Screen[] = ["voice", "intake", "biometrics", "mood", "actions", "pulse", "resources", "support", "family", "schedule", "analytics"];

interface SwipeNavigationProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

export function useSwipeNavigation({ currentScreen, onScreenChange }: SwipeNavigationProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Minimum swipe distance to trigger navigation
  const minSwipeDistance = 100;

  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      setIsAnimating(true);
      
      const currentIndex = screenOrder.indexOf(currentScreen);
      let newIndex = currentIndex;

      if (isLeftSwipe && currentIndex < screenOrder.length - 1) {
        // Swipe left - go to next screen
        newIndex = currentIndex + 1;
      } else if (isRightSwipe && currentIndex > 0) {
        // Swipe right - go to previous screen
        newIndex = currentIndex - 1;
      }

      if (newIndex !== currentIndex) {
        setTimeout(() => {
          onScreenChange(screenOrder[newIndex]);
          setIsAnimating(false);
        }, 150); // Small delay for smooth animation
      } else {
        setIsAnimating(false);
      }
    }
  };

  useEffect(() => {
    const element = document.getElementById('swipe-container');
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, touchEnd, currentScreen, onScreenChange]);

  return {
    isAnimating,
    currentIndex: screenOrder.indexOf(currentScreen),
    totalScreens: screenOrder.length,
    canSwipeLeft: screenOrder.indexOf(currentScreen) < screenOrder.length - 1,
    canSwipeRight: screenOrder.indexOf(currentScreen) > 0
  };
}