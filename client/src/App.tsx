import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { useOnboarding } from "@/hooks/useOnboarding";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { 
    isOnboardingComplete, 
    showOnboardingWizard, 
    completeOnboarding, 
    skipOnboarding 
  } = useOnboarding();

  // Show onboarding wizard if not completed
  if (showOnboardingWizard && !isOnboardingComplete) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <OnboardingWizard 
            onComplete={completeOnboarding}
            onSkip={skipOnboarding}
          />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
