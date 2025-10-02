import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { MessageCircle, TrendingUp, Users, Star, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PulseQuestion, PulseAnswer } from '@shared/schema';

interface QuestionWithStats extends PulseQuestion {
  answerCount: number;
  userHasAnswered: boolean;
  answerDistribution?: { [key: string]: number };
}

export default function CommunityPulse() {
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithStats | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [explanationText, setExplanationText] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch featured question
  const { data: featuredQuestion } = useQuery<QuestionWithStats>({
    queryKey: ['/api/pulse/featured'],
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch all active questions
  const { data: questions = [] } = useQuery<QuestionWithStats[]>({
    queryKey: ['/api/pulse/questions']
  });

  // Fetch user's answers
  const { data: userAnswers = [] } = useQuery<PulseAnswer[]>({
    queryKey: ['/api/pulse/my-answers']
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async (answer: { questionId: string; selectedOption: string; explanationText?: string }) => {
      const response = await fetch('/api/pulse/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answer)
      });
      if (!response.ok) throw new Error('Failed to submit answer');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Answer Submitted",
        description: "Thank you for sharing your perspective with the community!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pulse'] });
      setSelectedQuestion(null);
      setSelectedAnswer('');
      setExplanationText('');
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "Please try again in a moment.",
        variant: "destructive"
      });
    }
  });

  const handleSubmitAnswer = () => {
    if (!selectedQuestion || !selectedAnswer) return;
    
    submitAnswerMutation.mutate({
      questionId: selectedQuestion.id,
      selectedOption: selectedAnswer,
      explanationText: explanationText || undefined
    });
  };

  const renderQuestionCard = (question: QuestionWithStats, isFeatured = false) => (
    <Card 
      key={question.id} 
      className={`border-0 shadow-2xl hover:scale-[1.02] transition-all cursor-pointer touch-responsive ${
        isFeatured ? 'shadow-[0_0_30px_rgba(221,84,28,0.3)]' : ''
      }`}
      style={{
        background: isFeatured 
          ? 'linear-gradient(135deg, rgba(42, 24, 16, 0.95) 0%, rgba(221, 84, 28, 0.1) 100%)'
          : 'rgba(42, 24, 16, 0.95)',
        backdropFilter: 'blur(20px)',
        border: isFeatured ? '1px solid rgba(221, 84, 28, 0.5)' : '1px solid rgba(250, 195, 88, 0.3)'
      }}
      onClick={() => setSelectedQuestion(question)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isFeatured && (
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-[#DD541C] rounded-full mr-2 animate-pulse"></div>
                <Badge style={{ 
                  background: 'linear-gradient(45deg, #FAC358, #DD541C)',
                  color: '#2A1810',
                  border: 'none'
                }}>
                  <Star className="w-3 h-3 mr-1" />
                  Featured Today
                </Badge>
              </div>
            )}
            <CardTitle className="text-sm font-medium leading-relaxed" style={{ color: '#EDCFB9' }}>
              {question.questionText}
            </CardTitle>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0 ml-2" style={{ color: 'rgba(237, 207, 185, 0.6)' }} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(237, 207, 185, 0.6)' }}>
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {question.answerCount} responses
            </span>
            <Badge variant="outline" className="text-xs border-white/20 text-white/80 capitalize">
              {question.topic}
            </Badge>
          </div>
          {question.userHasAnswered && (
            <Badge variant="outline" className="text-xs border-[#C65F58] text-[#C65F58]">
              ✓ Answered
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderAnswerDistribution = (distribution: { [key: string]: number }, total: number) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-medium text-sm">Community Responses</h4>
        <div className="flex items-center text-xs text-white/60">
          <Users className="w-3 h-3 mr-1" />
          {total} total responses
        </div>
      </div>
      {Object.entries(distribution).map(([option, count]) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={option} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/80 flex-1">{option}</span>
              <span className="text-white/60 ml-4">{count} ({percentage.toFixed(0)}%)</span>
            </div>
            <div className="relative">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#DD541C] to-[#C65F58] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (selectedQuestion) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedQuestion(null)}
            style={{ color: 'rgba(237, 207, 185, 0.6)' }}
            className="hover:bg-transparent"
          >
            ← Back to Questions
          </Button>
        </div>

        <Card className="border-0 shadow-2xl" style={{
          background: 'rgba(42, 24, 16, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(250, 195, 88, 0.3)'
        }}>
          <CardHeader>
            <div className="space-y-2">
              <Badge style={{ 
                background: 'linear-gradient(45deg, #FAC358, #DD541C)',
                color: '#2A1810',
                border: 'none'
              }}>
                {selectedQuestion.topic}
              </Badge>
              <CardTitle className="text-lg leading-relaxed" style={{ color: '#EDCFB9' }}>
                {selectedQuestion.questionText}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedQuestion.userHasAnswered ? (
              // Show results if user has already answered
              <div className="space-y-4">
                <div className="p-4 bg-[#C65F58]/10 border border-[#C65F58]/20 rounded-lg">
                  <p className="text-white/80 text-sm">
                    Thank you for sharing your perspective! Here's how the community responded:
                  </p>
                </div>
                {selectedQuestion.answerDistribution && (
                  renderAnswerDistribution(selectedQuestion.answerDistribution, selectedQuestion.answerCount)
                )}
              </div>
            ) : (
              // Show answer options if user hasn't answered
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Your Response</h4>
                  {selectedQuestion.options?.map((option) => (
                    <label 
                      key={option} 
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all touch-responsive ${
                        selectedAnswer === option 
                          ? 'bg-[#DD541C]/20 border border-[#DD541C]/40' 
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={selectedAnswer === option}
                        onChange={(e) => setSelectedAnswer(e.target.value)}
                        className="w-4 h-4 text-[#DD541C] bg-transparent border-white/40 focus:ring-[#DD541C]/50"
                      />
                      <span className="text-white text-sm flex-1">{option}</span>
                      {selectedAnswer === option && (
                        <div className="w-2 h-2 bg-[#DD541C] rounded-full animate-pulse" />
                      )}
                    </label>
                  ))}
                </div>

                {selectedAnswer && (
                  <div className="space-y-2">
                    <label className="text-white/80 text-sm">
                      Want to share more? (Optional)
                    </label>
                    <textarea
                      value={explanationText}
                      onChange={(e) => setExplanationText(e.target.value)}
                      placeholder="Tell us more about your perspective..."
                      className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm resize-none"
                      rows={3}
                    />
                  </div>
                )}

                {selectedAnswer && (
                  <Button 
                    onClick={handleSubmitAnswer}
                    disabled={submitAnswerMutation.isPending}
                    className="w-full bg-[#DD541C] hover:bg-[#DD541C]/80 text-white"
                  >
                    {submitAnswerMutation.isPending ? 'Submitting...' : 'Submit Response'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-[#DD541C] rounded-full animate-pulse" />
          <h1 className="text-2xl font-bold text-white">Community Pulse</h1>
          <div className="w-3 h-3 bg-[#C65F58] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        <p className="text-white/70 text-sm max-w-sm mx-auto">
          Share your experiences, explore community perspectives, and build connection through authentic reflection
        </p>
      </div>

      <Tabs defaultValue="featured" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
          <TabsTrigger 
            value="featured" 
            className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-[#DD541C]/20 data-[state=active]:border-[#DD541C]/30 transition-all"
          >
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3" />
              <span className="hidden sm:inline">Featured</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="explore" 
            className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-[#DD541C]/20 data-[state=active]:border-[#DD541C]/30 transition-all"
          >
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span className="hidden sm:inline">Explore</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="my-answers" 
            className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-[#DD541C]/20 data-[state=active]:border-[#DD541C]/30 transition-all"
          >
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-3 h-3" />
              <span className="hidden sm:inline">Mine</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="space-y-4">
          {featuredQuestion ? (
            <div className="space-y-4">
              <h2 className="text-white font-medium flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-[#DD541C]" />
                Question Everyone's Talking About
              </h2>
              {renderQuestionCard(featuredQuestion, true)}
            </div>
          ) : (
            <div className="text-center py-8 text-white/60">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No featured question today</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="explore" className="space-y-4">
          <div className="space-y-3">
            {questions.length > 0 ? (
              questions.map((question) => renderQuestionCard(question))
            ) : (
              <div className="text-center py-8 text-white/60">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No questions available right now</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-answers" className="space-y-4">
          <div className="space-y-3">
            {userAnswers.length > 0 ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <h3 className="text-white font-medium mb-1">Your Community Impact</h3>
                  <p className="text-white/70 text-sm">
                    You've shared {userAnswers.length} perspectives that help shape our collective understanding
                  </p>
                </div>
                {/* Show user's recent answers */}
                {userAnswers.slice(0, 5).map((answer) => (
                  <Card key={answer.id} className="bg-white/5 border-white/10 hover:bg-white/8 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start text-sm">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-2 h-2 bg-[#C65F58] rounded-full" />
                            <p className="text-white/80 font-medium">{answer.selectedOption}</p>
                          </div>
                          {answer.explanationText && (
                            <p className="text-white/60 text-xs ml-4 italic">"{answer.explanationText}"</p>
                          )}
                        </div>
                        <span className="text-white/50 text-xs ml-4 whitespace-nowrap">
                          {new Date(answer.answeredAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/60">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Share your first perspective to get started</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}