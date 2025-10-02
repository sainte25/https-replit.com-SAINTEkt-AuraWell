import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const categories = ["All", "Meditation", "Exercise", "Nutrition", "Sleep"];

const sampleResources = [
  {
    id: "1",
    title: "Mindful Morning Meditation",
    description: "Start your day with a 10-minute guided meditation focused on setting positive intentions.",
    category: "meditation",
    organization: "Calm Collective",
    provider: "Dr. Sarah Chen",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    averageRating: "4.8",
    ratingCount: 127
  },
  {
    id: "2", 
    title: "Quick Stress Relief Breathing",
    description: "A 3-minute breathing exercise designed to quickly reduce stress and anxiety in challenging moments.",
    category: "meditation",
    organization: "Wellness Institute",
    provider: "Maria Rodriguez",
    imageUrl: "https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    averageRating: "4.3",
    ratingCount: 89
  }
];

export default function ResourceEngine() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch resources
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["/api/resources", selectedCategory === "All" ? undefined : selectedCategory.toLowerCase()],
    select: (data) => data?.length ? data : sampleResources
  });

  // Rate resource mutation
  const rateResourceMutation = useMutation({
    mutationFn: async ({ resourceId, rating, review }: { resourceId: string; rating: number; review?: string }) => {
      const response = await apiRequest("POST", `/api/resources/${resourceId}/rate`, { 
        rating, 
        review: review || null 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/care-team"] });
      setRatingDialogOpen(false);
      setRating(0);
      setReview("");
      toast({
        title: "Rating Submitted",
        description: "Thank you for rating this resource! The provider has been added to your care team.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Submit Rating",
        description: "Unable to submit your rating. Please try again.",
        variant: "destructive",
      });
    },
  });

  const openRatingDialog = (resource: any) => {
    setSelectedResource(resource);
    setRatingDialogOpen(true);
  };

  const submitRating = () => {
    if (selectedResource && rating > 0) {
      rateResourceMutation.mutate({
        resourceId: selectedResource.id,
        rating,
        review: review.trim() || undefined
      });
    }
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (star: number) => void) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onStarClick?.(star)}
            disabled={!interactive}
            style={{
              color: star <= rating 
                ? "#FAC358" 
                : interactive 
                  ? "rgba(237, 207, 185, 0.3)" 
                  : "rgba(237, 207, 185, 0.3)",
              cursor: interactive ? "pointer" : "default"
            }}
          >
            <Star className="w-5 h-5 fill-current" />
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse" style={{ color: 'rgba(237, 207, 185, 0.7)' }}>Loading resources...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8 space-y-10">
      {/* Hero Header */}
      <div className="text-center space-y-4 pt-4">
        <h1 className="text-title-1 mb-2" style={{ color: 'var(--text-primary)' }}>Wellness Resources</h1>
        <p className="text-callout" style={{ color: 'var(--text-tertiary)' }}>Personalized recommendations for your journey</p>
      </div>

      {/* Sunset Category Selector */}
      <div className="glass-card p-2 rounded-2xl">
        <div className="flex space-x-1 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap px-6 py-4 rounded-xl text-callout font-medium transition-all duration-300"
              style={selectedCategory === category ? {
                background: 'var(--glass-medium)',
                boxShadow: 'var(--glow-warm)',
                color: 'var(--text-primary)'
              } : {
                color: 'var(--text-tertiary)'
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Sunset Resource Cards */}
      <div className="space-y-8">
        {resources.map((resource: any, index: number) => (
          <div 
            key={resource.id} 
            className="glass-floating p-8 rounded-3xl transition-all duration-500 hover:scale-[1.02] relative overflow-hidden group"
            style={{
              animationDelay: `${index * 150}ms`
            }}
          >
            {/* Sunset Background Gradient */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                 style={{ background: `radial-gradient(circle at center, var(--warm-peach)03, transparent 70%)` }} />
            
            <div className="relative">
              <div className="flex items-start space-x-5 mb-6">
                <div className="relative">
                  <img
                    src={resource.imageUrl}
                    alt={resource.title}
                    className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/15 to-transparent" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-title-2 mb-3" style={{ color: 'var(--text-primary)' }}>{resource.title}</h3>
                  <p className="text-callout mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{resource.description}</p>
                  <div className="flex items-center space-x-4 text-caption">
                    <span className="px-3 py-1 rounded-full" style={{ 
                      background: 'var(--surface-elevated)', 
                      color: 'var(--text-tertiary)' 
                    }}>{resource.organization}</span>
                    <span className="px-3 py-1 rounded-full" style={{ 
                      background: 'var(--surface-elevated)', 
                      color: 'var(--text-tertiary)' 
                    }}>{resource.provider}</span>
                  </div>
                </div>
              </div>

              {/* Sunset Rating Display */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {renderStars(Math.floor(parseFloat(resource.averageRating)))}
                    <span className="text-headline font-medium" style={{ color: 'var(--text-primary)' }}>{resource.averageRating}</span>
                  </div>
                  <span className="text-callout" style={{ color: 'var(--text-tertiary)' }}>({resource.ratingCount} reviews)</span>
                </div>

                <div className="flex space-x-4">
                  <button
                    className="sunset-button px-8 py-4 rounded-2xl text-callout font-medium"
                    onClick={() => {
                      toast({
                        title: "Resource Accessed",
                        description: `Opening ${resource.title}...`,
                      });
                    }}
                  >
                    Use Resource
                  </button>
                  <button
                    onClick={() => openRatingDialog(resource)}
                    className="px-8 py-4 rounded-2xl text-callout font-medium transition-all duration-300 hover:scale-105 glass-card"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Rate
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sunset Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="glass-elevated border rounded-3xl p-8" style={{ borderColor: 'var(--border-medium)' }}>
          <DialogHeader>
            <DialogTitle className="text-title-2 text-center" style={{ color: 'var(--text-primary)' }}>Rate Resource</DialogTitle>
          </DialogHeader>
          
          {selectedResource && (
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="font-semibold text-headline" style={{ color: 'var(--text-primary)' }}>{selectedResource.title}</h4>
                <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>by {selectedResource.provider}</p>
              </div>
              
              <div>
                <label className="block text-callout font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Your Rating</label>
                <div className="flex justify-center space-x-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`w-12 h-12 rounded-2xl transition-all duration-300 hover:scale-110 ${
                        star <= rating ? 'text-4xl' : 'text-3xl opacity-30'
                      }`}
                      style={{ 
                        color: star <= rating ? 'var(--rich-coral)' : 'var(--text-muted)',
                        background: star <= rating ? 'var(--surface-elevated)' : 'transparent'
                      }}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-callout font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Review (Optional)</label>
                <Textarea
                  placeholder="Share your thoughts about this resource..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full rounded-2xl border-0 text-callout p-4"
                  style={{
                    background: 'var(--surface-elevated)',
                    color: 'var(--text-primary)'
                  }}
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={submitRating}
                  disabled={rating === 0 || rateResourceMutation.isPending}
                  className="sunset-button flex-1 py-4 rounded-2xl text-callout font-medium disabled:opacity-50"
                >
                  {rateResourceMutation.isPending ? "Submitting..." : "Submit Rating"}
                </button>
                <button
                  onClick={() => setRatingDialogOpen(false)}
                  className="glass-card px-6 py-4 rounded-2xl text-callout font-medium transition-all duration-300 hover:scale-105"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
