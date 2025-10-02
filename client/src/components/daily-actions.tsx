import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function DailyActions() {
  const [newStepText, setNewStepText] = useState("");
  const [reflection, setReflection] = useState({
    gratitude: "",
    success: "",
    improvement: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];

  // Fetch daily actions for today
  const { data: actions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ["/api/actions", today],
  });

  // Fetch reflection for today
  const { data: todayReflection } = useQuery({
    queryKey: ["/api/reflections", today],
  });

  // Create action mutation
  const createActionMutation = useMutation({
    mutationFn: async (stepText: string) => {
      const response = await apiRequest("POST", "/api/actions", { 
        date: today, 
        stepText,
        completed: false 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions", today] });
      setNewStepText("");
      toast({
        title: "Action Added",
        description: "New daily action has been added.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Add Action",
        description: "Unable to add new action. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle action completion
  const toggleActionMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const response = await apiRequest("PATCH", `/api/actions/${id}`, { completed });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions", today] });
      toast({
        title: "Action Updated",
        description: "Action completion status updated.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Update Action",
        description: "Unable to update action. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save reflection mutation
  const saveReflectionMutation = useMutation({
    mutationFn: async (reflectionData: typeof reflection) => {
      const response = await apiRequest("POST", "/api/reflections", {
        date: today,
        ...reflectionData
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reflections", today] });
      toast({
        title: "Reflection Saved",
        description: "Your daily reflection has been saved.",
      });
      setReflection({ gratitude: "", success: "", improvement: "" });
    },
    onError: () => {
      toast({
        title: "Failed to Save Reflection",
        description: "Unable to save reflection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addStep = () => {
    if (newStepText.trim()) {
      createActionMutation.mutate(newStepText.trim());
    }
  };

  const toggleStep = (id: string, currentCompleted: boolean) => {
    toggleActionMutation.mutate({ id, completed: !currentCompleted });
  };

  const saveReflection = () => {
    if (reflection.gratitude || reflection.success || reflection.improvement) {
      saveReflectionMutation.mutate(reflection);
    }
  };

  const completedSteps = actions.filter((action: any) => action.completed).length;
  const totalPoints = completedSteps * 5;

  if (actionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse" style={{ color: 'rgba(237, 207, 185, 0.7)' }}>Loading daily actions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8 space-y-10" style={{ 
      background: 'transparent',
      color: '#EDCFB9' 
    }}>
      {/* Hero Header */}
      <div className="text-center space-y-4 pt-4">
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#EDCFB9' }}>Today's Journey</h1>
        <p className="text-lg" style={{ color: 'rgba(237, 207, 185, 0.65)' }}>{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>

      {/* Daily Steps */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: '#EDCFB9' }}>Your Actions</h2>
          <span style={{ color: 'rgba(237, 207, 185, 0.7)' }}>
            {completedSteps} of {actions.length} completed
          </span>
        </div>

        {/* Next-Gen Action Cards */}
        <div className="space-y-5">
          {actions.map((action: any, index: number) => (
            <div 
              key={action.id} 
              className="p-6 rounded-3xl transition-all duration-500 hover:scale-[1.02] relative overflow-hidden group border-0 shadow-2xl"
              style={{
                animationDelay: `${index * 100}ms`,
                background: 'rgba(42, 24, 16, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(250, 195, 88, 0.3)'
              }}
            >
              {/* Completion Glow Effect */}
              {action.completed && (
                <div className="absolute inset-0 opacity-30" style={{
                  background: `radial-gradient(circle at center, rgba(250, 195, 88, 0.6), transparent 70%)`
                }} />
              )}
              
              <div className="relative flex items-center space-x-5">
                <button
                  onClick={() => toggleStep(action.id, action.completed)}
                  className={`w-12 h-12 rounded-2xl border-2 transition-all duration-500 flex items-center justify-center relative overflow-hidden ${
                    action.completed 
                      ? "scale-110 shadow-lg" 
                      : "hover:scale-105"
                  }`}
                  style={{
                    borderColor: action.completed ? '#FAC358' : 'rgba(250, 195, 88, 0.3)',
                    background: action.completed ? 'linear-gradient(45deg, #FAC358, #DD541C)' : 'rgba(42, 24, 16, 0.5)',
                    boxShadow: action.completed ? '0 0 20px rgba(250, 195, 88, 0.5)' : 'none'
                  }}
                >
                  {action.completed && (
                    <Check className="w-6 h-6 drop-shadow-sm" style={{ color: '#2A1810' }} />
                  )}
                  
                  {/* Ripple Effect */}
                  <div className={`absolute inset-0 rounded-2xl bg-white/20 scale-0 ${
                    action.completed ? 'animate-ping' : ''
                  }`} />
                </button>
                
                <div className="flex-1">
                  <p className={`text-headline transition-all duration-500 ${
                    action.completed ? "line-through opacity-70" : ""
                  }`}
                     style={{ 
                       color: action.completed ? 'rgba(237, 207, 185, 0.5)' : '#EDCFB9'
                     }}>
                    {action.stepText}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="font-medium" style={{ color: '#FAC358' }}>+5 points</span>
                    {action.completed && (
                      <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: '#FAC358' }} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Sunset Add New Step */}
          <div className="glass-card p-6 rounded-3xl border-2 border-dashed relative overflow-hidden group"
               style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                 style={{ background: `radial-gradient(circle at center, var(--warm-peach)04, transparent 70%)` }} />
            
            <div className="relative flex space-x-4">
              <Input
                placeholder="Add a new action step..."
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                className="flex-1 rounded-2xl h-14 text-headline px-5 border-0"
                onKeyDown={(e) => e.key === 'Enter' && addStep()}
                style={{
                  background: 'var(--surface-elevated)',
                  color: 'var(--text-primary)',
                  backdropFilter: 'blur(20px)'
                }}
              />
              <button
                onClick={addStep}
                disabled={!newStepText.trim() || createActionMutation.isPending}
                className="sunset-button w-14 h-14 rounded-2xl flex items-center justify-center disabled:opacity-50"
              >
                <Plus className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sunset Progress Summary */}
      <div className="glass-floating p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse at top, var(--warm-peach)04, transparent 60%)`
        }} />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-callout" style={{ color: 'var(--text-secondary)' }}>Today's Progress</span>
              <div className="text-title-1 mt-1" style={{ color: 'var(--rich-coral)' }}>{totalPoints} pts</div>
            </div>
            <div className="text-right">
              <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>Goal: 15 pts</div>
              <div className="text-callout mt-1" style={{ color: 'var(--text-secondary)' }}>
                {Math.round((totalPoints / 15) * 100)}% complete
              </div>
            </div>
          </div>
          
          <div className="h-4 rounded-full overflow-hidden mb-4 relative"
               style={{ background: 'var(--surface-base)' }}>
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ 
                width: `${Math.min((totalPoints / 15) * 100, 100)}%`,
                background: 'var(--primary-gradient)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-pulse" />
            </div>
          </div>
          
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            {15 - totalPoints > 0 
              ? `${15 - totalPoints} more points to reach your daily goal` 
              : "Daily goal achieved! You're doing amazing."}
          </p>
        </div>
      </div>

      {/* Sunset Evening Reflection */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-title-2 mb-2" style={{ color: 'var(--text-primary)' }}>Evening Reflection</h3>
          <p className="text-callout" style={{ color: 'var(--text-tertiary)' }}>Take a moment to reflect on your day</p>
        </div>

        <div className="space-y-6">
          <div className="glass-elevated p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{
              background: `radial-gradient(circle at top right, var(--rich-coral)04, transparent 70%)`
            }} />
            <div className="relative">
              <label className="block text-callout font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                What are you grateful for today?
              </label>
              <Textarea
                placeholder="I'm grateful for..."
                value={reflection.gratitude}
                onChange={(e) => setReflection(prev => ({ ...prev, gratitude: e.target.value }))}
                className="w-full rounded-2xl border-0 text-callout resize-none p-4"
                style={{
                  background: 'var(--surface-elevated)',
                  color: 'var(--text-primary)'
                }}
                rows={3}
              />
            </div>
          </div>

          <div className="glass-elevated p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{
              background: `radial-gradient(circle at top right, var(--warm-peach)04, transparent 70%)`
            }} />
            <div className="relative">
              <label className="block text-callout font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                What went well today?
              </label>
              <Textarea
                placeholder="Something that went well..."
                value={reflection.success}
                onChange={(e) => setReflection(prev => ({ ...prev, success: e.target.value }))}
                className="w-full rounded-2xl border-0 text-callout resize-none p-4"
                style={{
                  background: 'var(--surface-elevated)',
                  color: 'var(--text-primary)'
                }}
                rows={3}
              />
            </div>
          </div>

          <div className="glass-elevated p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{
              background: `radial-gradient(circle at top right, var(--soft-cream)04, transparent 70%)`
            }} />
            <div className="relative">
              <label className="block text-callout font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                What would you improve and how?
              </label>
              <Textarea
                placeholder="I would improve... by..."
                value={reflection.improvement}
                onChange={(e) => setReflection(prev => ({ ...prev, improvement: e.target.value }))}
                className="w-full rounded-2xl border-0 text-callout resize-none p-4"
                style={{
                  background: 'var(--surface-elevated)',
                  color: 'var(--text-primary)'
                }}
                rows={3}
              />
            </div>
          </div>

          <button
            onClick={saveReflection}
            disabled={saveReflectionMutation.isPending || (!reflection.gratitude && !reflection.success && !reflection.improvement)}
            className="sunset-button w-full py-4 rounded-2xl text-callout font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {saveReflectionMutation.isPending ? "Saving..." : "Save Reflection"}
          </button>
        </div>
      </div>
    </div>
  );
}
