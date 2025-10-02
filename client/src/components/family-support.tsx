import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Target, 
  Plus, 
  Send, 
  Share2, 
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  UserPlus,
  Bell,
  Shield,
  Edit3,
  MoreVertical,
  Star,
  Gift,
  Calendar,
  Zap,
  TrendingUp,
  Settings,
  Activity,
  HelpCircle,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  Copy,
  Download
} from 'lucide-react';
import type { 
  FamilyMember, 
  FamilyCommunication, 
  SharedWellnessInsight,
  FamilyGoal,
  FamilyNotification
} from '@shared/schema';

interface FamilySupportTabProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface CollaborativeCareGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: 'mental_health' | 'physical_health' | 'social' | 'life_skills';
  status: 'active' | 'completed' | 'paused';
  progress: number;
  targetDate?: string;
  createdAt: string;
}

export default function FamilySupport() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [messageContent, setMessageContent] = useState('');

  const queryClient = useQueryClient();

  // Fetch family members
  const { data: familyMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['/api/family-members'],
    retry: false,
  });

  // Fetch communications
  const { data: communications = [], isLoading: loadingCommunications } = useQuery({
    queryKey: ['/api/family-communication'],
    retry: false,
  });

  // Fetch shared insights
  const { data: insights = [], isLoading: loadingInsights } = useQuery({
    queryKey: ['/api/shared-wellness-insights'],
    retry: false,
  });

  // Fetch collaborative goals
  const { data: careGoals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['/api/collaborative-care-goals'],
    retry: false,
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/family-members', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family-members'] });
      setIsAddMemberOpen(false);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/family-communication', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family-communication'] });
      setMessageContent('');
      setSelectedMember('');
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/collaborative-care-goals', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborative-care-goals'] });
      setIsCreateGoalOpen(false);
    },
  });

  // Helper functions
  const getRelationshipIcon = (relationship: string) => {
    switch (relationship.toLowerCase()) {
      case 'parent': return '👨‍👩‍👧‍👦';
      case 'child': return '👶';
      case 'sibling': return '👫';
      case 'spouse': return '💑';
      case 'friend': return '👥';
      case 'caregiver': return '🤝';
      default: return '👤';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Event handlers
  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      relationship: formData.get('relationship') as string,
      permissionLevel: formData.get('permissionLevel') as string,
      isEmergencyContact: formData.get('isEmergencyContact') === 'on',
    };
    addMemberMutation.mutate(data);
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedMember) return;
    
    sendMessageMutation.mutate({
      familyMemberId: selectedMember,
      content: messageContent.trim(),
      senderType: 'user',
    });
  };

  const handleCreateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      targetDate: formData.get('targetDate') as string,
      status: 'active',
      progress: 0,
    };
    createGoalMutation.mutate(data);
  };

  if (loadingMembers || loadingCommunications || loadingInsights || loadingGoals) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 p-6" style={{ background: 'transparent', color: '#EDCFB9' }}>
      {/* Header with sunset styling */}
      <div className="relative overflow-hidden rounded-3xl p-8 mb-6 border-0 shadow-2xl" 
           style={{ 
             background: 'rgba(42, 24, 16, 0.95)',
             backdropFilter: 'blur(20px)',
             border: '1px solid rgba(250, 195, 88, 0.3)'
           }}>
        <div className="absolute inset-0 opacity-20" 
             style={{ background: 'radial-gradient(circle at 70% 30%, var(--siani-golden-hour), transparent 70%)' }}>
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" 
                   style={{ background: 'var(--glass-light)' }}>
                <Users className="w-6 h-6" style={{ color: 'var(--siani-golden-hour)' }} />
              </div>
              <h1 className="text-4xl font-bold" style={{ color: '#EDCFB9' }}>
                Family Circle
              </h1>
            </div>
            <p className="text-lg max-w-md" style={{ color: 'rgba(237, 207, 185, 0.8)' }}>
              Your trusted support network - sharing strength, celebrating progress, building resilience together
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-white/90">
                <Shield className="w-4 h-4" />
                <span className="text-caption">Privacy Protected</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Heart className="w-4 h-4" />
                <span className="text-caption">{familyMembers.length} Members</span>
              </div>
            </div>
          </div>
          <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 transition-all duration-300 shadow-lg">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card max-w-md mx-auto">
              <DialogHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                     style={{ background: 'var(--primary-gradient)' }}>
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <DialogTitle className="text-title-2 luxury-heading" style={{ color: 'var(--text-primary)' }}>
                  Invite Family Member
                </DialogTitle>
                <p className="text-caption mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Connect with someone who matters in your wellness journey
                </p>
              </DialogHeader>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" style={{ color: 'var(--text-primary)' }}>Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      required 
                      className="glass-input"
                      style={{ 
                        background: 'var(--glass-light)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="relationship" style={{ color: 'var(--text-primary)' }}>Relationship</Label>
                    <Select name="relationship" required>
                      <SelectTrigger className="glass-input">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="spouse">Spouse/Partner</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="caregiver">Caregiver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email" style={{ color: 'var(--text-primary)' }}>Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    className="glass-input"
                    style={{ 
                      background: 'var(--glass-light)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" style={{ color: 'var(--text-primary)' }}>Phone (Optional)</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    className="glass-input"
                    style={{ 
                      background: 'var(--glass-light)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                
                <div>
                  <Label htmlFor="permissionLevel" style={{ color: 'var(--text-primary)' }}>Permission Level</Label>
                  <Select name="permissionLevel" required>
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Select permission level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view_only">View Only</SelectItem>
                      <SelectItem value="limited">Limited Access</SelectItem>
                      <SelectItem value="full">Full Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isEmergencyContact"
                    name="isEmergencyContact"
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isEmergencyContact" style={{ color: 'var(--text-primary)' }}>
                    Emergency Contact
                  </Label>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddMemberOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 luxury-button"
                    disabled={addMemberMutation.isPending}
                  >
                    {addMemberMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending...
                      </div>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Invite
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Tabs with better visual design */}
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full h-auto p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
              <TabsTrigger 
                value="overview" 
                className="flex flex-col items-center gap-2 p-4 rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all duration-300"
              >
                <Users className="w-5 h-5" />
                <span className="text-caption">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="communication" 
                className="flex flex-col items-center gap-2 p-4 rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-caption">Messages</span>
              </TabsTrigger>
              <TabsTrigger 
                value="insights" 
                className="flex flex-col items-center gap-2 p-4 rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all duration-300"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-caption">Insights</span>
              </TabsTrigger>
              <TabsTrigger 
                value="goals" 
                className="flex flex-col items-center gap-2 p-4 rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all duration-300"
              >
                <Target className="w-5 h-5" />
                <span className="text-caption">Goals</span>
              </TabsTrigger>
            </div>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                         style={{ background: 'var(--primary-gradient)' }}>
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="luxury-heading">Family Circle</div>
                      <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>
                        {familyMembers.length} connected members
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {familyMembers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                           style={{ background: 'var(--glass-medium)' }}>
                        <Users className="w-10 h-10" style={{ color: 'var(--siani-golden-hour)' }} />
                      </div>
                      <h3 className="text-title-3 luxury-heading mb-2" style={{ color: 'var(--text-primary)' }}>
                        Start Your Family Circle
                      </h3>
                      <p className="luxury-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                        Invite the people who matter most to join your wellness journey
                      </p>
                      <Button 
                        onClick={() => setIsAddMemberOpen(true)}
                        className="luxury-button"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite First Member
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {familyMembers.map((member: FamilyMember) => (
                        <div key={member.id} className="group p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02]" 
                             style={{ 
                               background: 'var(--glass-light)', 
                               border: '1px solid var(--border-subtle)',
                               boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                             }}>
                          <div className="flex items-start space-x-4">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl transition-transform group-hover:scale-110"
                                   style={{ 
                                     background: member.inviteStatus === 'accepted' 
                                       ? 'var(--primary-gradient)' 
                                       : 'var(--glass-medium)' 
                                   }}>
                                {getRelationshipIcon(member.relationship)}
                              </div>
                              {member.inviteStatus === 'accepted' && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold luxury-body truncate" style={{ color: 'var(--text-primary)' }}>
                                  {member.name}
                                </h4>
                                {member.isEmergencyContact && (
                                  <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                                       style={{ background: 'var(--siani-ember)', color: 'white' }}>
                                    <Shield className="w-3 h-3" />
                                    Emergency
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-caption mb-2" style={{ color: 'var(--text-secondary)' }}>
                                {member.relationship} • {member.permissionLevel} access
                              </p>
                              
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className="text-xs border-0"
                                  style={{ 
                                    background: member.inviteStatus === 'accepted' 
                                      ? 'var(--siani-golden-hour)' 
                                      : 'var(--glass-medium)',
                                    color: member.inviteStatus === 'accepted' ? 'white' : 'var(--text-secondary)'
                                  }}
                                >
                                  {member.inviteStatus === 'accepted' ? 'Connected' : 
                                   member.inviteStatus === 'pending' ? 'Invitation Sent' : 'Declined'}
                                </Badge>
                                
                                {member.lastActiveAt && (
                                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                    <Clock className="w-3 h-3" />
                                    Active {formatTime(member.lastActiveAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {member.email && (
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/20">
                                  <Mail className="w-4 h-4" />
                                </Button>
                              )}
                              {member.phone && (
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/20">
                                  <Phone className="w-4 h-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/20">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                         style={{ background: 'var(--primary-gradient)' }}>
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="luxury-heading">Recent Activity</div>
                      <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>
                        Latest family interactions
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {communications.slice(0, 5).map((comm: FamilyCommunication) => (
                      <div key={comm.id} className="group flex items-start space-x-3 p-4 rounded-xl transition-all hover:scale-[1.02]"
                           style={{ 
                             background: 'var(--glass-light)',
                             border: '1px solid var(--border-subtle)'
                           }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                             style={{ background: 'var(--primary-gradient)' }}>
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-callout leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                            {comm.content}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-caption" style={{ color: 'var(--text-muted)' }}>
                              {formatTime(comm.createdAt)}
                            </span>
                            <span className="text-caption px-2 py-1 rounded-full"
                                  style={{ 
                                    background: comm.senderType === 'user' 
                                      ? 'var(--siani-golden-hour)' 
                                      : 'var(--siani-blush)',
                                    color: 'white'
                                  }}>
                              {comm.senderType === 'user' ? 'You' : 'Family'}
                            </span>
                            {!comm.readAt && (
                              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--siani-ember)' }}></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {communications.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                             style={{ background: 'var(--glass-medium)' }}>
                          <MessageCircle className="w-8 h-8" style={{ color: 'var(--siani-golden-hour)' }} />
                        </div>
                        <h4 className="luxury-heading mb-2" style={{ color: 'var(--text-primary)' }}>
                          Start the Conversation
                        </h4>
                        <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>
                          Connect with your family through messages and shared moments
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication" className="space-y-6 px-6">
            <Card className="glass-card border-0 shadow-lg overflow-hidden">
              <CardHeader className="pb-4" style={{ background: 'var(--primary-gradient)' }}>
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="luxury-heading">Family Messages</div>
                    <div className="text-caption text-white/80">
                      Stay connected with your support network
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6 mb-6">
                  {familyMembers.length === 0 ? (
                    <div className="text-center py-8 rounded-2xl" style={{ background: 'var(--glass-light)' }}>
                      <MessageCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--siani-golden-hour)' }} />
                      <h4 className="luxury-heading mb-2" style={{ color: 'var(--text-primary)' }}>
                        No Family Members Yet
                      </h4>
                      <p className="text-caption mb-4" style={{ color: 'var(--text-secondary)' }}>
                        Add family members to start sharing messages and updates
                      </p>
                      <Button 
                        onClick={() => setIsAddMemberOpen(true)}
                        className="luxury-button"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite Family Member
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <Label className="luxury-body" style={{ color: 'var(--text-primary)' }}>
                          Send to:
                        </Label>
                        <Select value={selectedMember} onValueChange={setSelectedMember}>
                          <SelectTrigger className="glass-input h-12">
                            <SelectValue placeholder="Choose a family member..." />
                          </SelectTrigger>
                          <SelectContent>
                            {familyMembers.map((member: FamilyMember) => (
                              <SelectItem key={member.id} value={member.id}>
                                <div className="flex items-center gap-3 py-1">
                                  <span className="text-lg">{getRelationshipIcon(member.relationship)}</span>
                                  <div>
                                    <div className="font-medium">{member.name}</div>
                                    <div className="text-xs opacity-70">{member.relationship}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-4">
                        <Label className="luxury-body" style={{ color: 'var(--text-primary)' }}>
                          Your message:
                        </Label>
                        <Textarea
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          placeholder="Share an update, ask for support, or just say hello..."
                          className="glass-input resize-none min-h-[120px] text-body leading-relaxed"
                          style={{ 
                            background: 'var(--glass-light)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)'
                          }}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-caption" style={{ color: 'var(--text-muted)' }}>
                            {messageContent.length}/500
                          </span>
                          <Button 
                            onClick={handleSendMessage}
                            disabled={!messageContent.trim() || !selectedMember || sendMessageMutation.isPending}
                            className="luxury-button px-8"
                          >
                            {sendMessageMutation.isPending ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Sending...
                              </div>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Send Message
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {familyMembers.length > 0 && (
                  <div className="border-t pt-6" style={{ borderColor: 'var(--border-subtle)' }}>
                    <h4 className="luxury-heading mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Clock className="w-5 h-5" style={{ color: 'var(--siani-golden-hour)' }} />
                      Message History
                    </h4>
                    <ScrollArea className="h-96 pr-4">
                      <div className="space-y-4">
                        {communications.map((comm: FamilyCommunication) => (
                          <div key={comm.id} className={`flex ${comm.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`group max-w-sm lg:max-w-md transition-all duration-300 hover:scale-[1.02] ${
                              comm.senderType === 'user' 
                                ? 'text-right' 
                                : 'text-left'
                            }`}>
                              <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                                comm.senderType === 'user' 
                                  ? 'text-white' 
                                  : 'border'
                              }`}
                              style={{ 
                                background: comm.senderType === 'user' 
                                  ? 'var(--primary-gradient)' 
                                  : 'var(--glass-light)',
                                border: comm.senderType === 'user' 
                                  ? 'none' 
                                  : '1px solid var(--border-subtle)'
                              }}>
                                <p className="luxury-body leading-relaxed">{comm.content}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                                  <span>{formatTime(comm.createdAt)}</span>
                                  {comm.senderType === 'user' && (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      Sent
                                    </div>
                                  )}
                                </div>
                              </div>
                              {comm.senderType !== 'user' && (
                                <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                  <span className="text-sm">
                                    {familyMembers.find((m: FamilyMember) => m.id === comm.familyMemberId)?.relationship || 'Family'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {communications.length === 0 && familyMembers.length > 0 && (
                          <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--glass-light)' }}>
                            <MessageCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--siani-golden-hour)' }} />
                            <h4 className="luxury-heading mb-2" style={{ color: 'var(--text-primary)' }}>
                              Start the Conversation
                            </h4>
                            <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>
                              Send your first message to connect with your family members
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6 px-6">
            <Card className="glass-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle style={{ color: 'var(--text-primary)' }}>Shared Wellness Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.map((insight: SharedWellnessInsight) => (
                    <div key={insight.id} className="p-4 rounded-xl" style={{ background: 'var(--glass-light)' }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold luxury-body" style={{ color: 'var(--text-primary)' }}>
                            {insight.title}
                          </h4>
                          <p className="text-caption mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {insight.insightType} • {insight.shareLevel} sharing
                          </p>
                          <p className="text-caption" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(insight.createdAt)}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {insight.viewedAt ? 'Viewed' : 'New'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {insights.length === 0 && (
                    <div className="text-center py-8">
                      <Share2 className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
                      <p className="luxury-body" style={{ color: 'var(--text-secondary)' }}>
                        No insights shared yet
                      </p>
                      <p className="text-caption mt-1" style={{ color: 'var(--text-muted)' }}>
                        Wellness insights will appear here when shared with family
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6 px-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-title-2 luxury-heading" style={{ color: 'var(--text-primary)' }}>
                  Collaborative Goals
                </h3>
                <p className="text-caption mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Goals you're working on together with family support
                </p>
              </div>
              <Dialog open={isCreateGoalOpen} onOpenChange={setIsCreateGoalOpen}>
                <DialogTrigger asChild>
                  <Button className="luxury-button shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    New Goal
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle style={{ color: 'var(--text-primary)' }}>Create Collaborative Goal</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateGoal} className="space-y-4">
                    <div>
                      <Label htmlFor="title" style={{ color: 'var(--text-primary)' }}>Goal Title</Label>
                      <Input 
                        id="title" 
                        name="title" 
                        required 
                        className="glass-input"
                        style={{ 
                          background: 'var(--glass-light)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description" style={{ color: 'var(--text-primary)' }}>Description</Label>
                      <Textarea 
                        id="description" 
                        name="description" 
                        className="glass-input resize-none"
                        rows={3}
                        style={{ 
                          background: 'var(--glass-light)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category" style={{ color: 'var(--text-primary)' }}>Category</Label>
                        <Select name="category" required>
                          <SelectTrigger className="glass-input">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mental_health">Mental Health</SelectItem>
                            <SelectItem value="physical_health">Physical Health</SelectItem>
                            <SelectItem value="social">Social</SelectItem>
                            <SelectItem value="life_skills">Life Skills</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="targetDate" style={{ color: 'var(--text-primary)' }}>Target Date</Label>
                        <Input 
                          id="targetDate" 
                          name="targetDate" 
                          type="date" 
                          className="glass-input"
                          style={{ 
                            background: 'var(--glass-light)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateGoalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="luxury-button"
                        disabled={createGoalMutation.isPending}
                      >
                        {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {careGoals.map((goal: CollaborativeCareGoal) => (
                <Card key={goal.id} className="glass-card border-0 shadow-lg group hover:scale-[1.02] transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center"
                               style={{ background: 'var(--primary-gradient)' }}>
                            <Target className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold luxury-heading" style={{ color: 'var(--text-primary)' }}>
                              {goal.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs border-0"
                                style={{ 
                                  background: 'var(--siani-golden-hour)', 
                                  color: 'white' 
                                }}
                              >
                                {goal.category.replace('_', ' ')}
                              </Badge>
                              <Badge 
                                variant="outline"
                                className="text-xs border-0"
                                style={{ 
                                  background: goal.status === 'active' ? 'var(--glass-medium)' : 'var(--text-muted)',
                                  color: goal.status === 'active' ? 'var(--text-primary)' : 'white'
                                }}
                              >
                                {goal.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {goal.description && (
                          <p className="text-body mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {goal.description}
                          </p>
                        )}
                        
                        {goal.targetDate && (
                          <div className="flex items-center gap-2 mt-3 text-caption" style={{ color: 'var(--text-muted)' }}>
                            <Calendar className="w-4 h-4" />
                            Target: {formatDate(goal.targetDate)}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center ml-6">
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="var(--glass-medium)"
                              strokeWidth="4"
                              fill="none"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="var(--siani-golden-hour)"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 28}`}
                              strokeDashoffset={`${2 * Math.PI * 28 * (1 - goal.progress / 100)}`}
                              className="transition-all duration-500"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-title-3 font-bold" style={{ color: 'var(--siani-golden-hour)' }}>
                              {goal.progress}%
                            </span>
                          </div>
                        </div>
                        <p className="text-caption" style={{ color: 'var(--text-muted)' }}>
                          Complete
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-caption" style={{ color: 'var(--text-muted)' }}>
                        <span>Progress</span>
                        <span>{goal.progress}/100</span>
                      </div>
                      <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--glass-medium)' }}>
                        <div 
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ 
                            width: `${goal.progress}%`,
                            background: 'var(--primary-gradient)',
                            boxShadow: `0 0 10px ${goal.progress > 50 ? 'var(--siani-golden-hour)' : 'transparent'}`
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" style={{ color: 'var(--siani-golden-hour)' }} />
                        <span className="text-caption" style={{ color: 'var(--text-secondary)' }}>
                          Family supported
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/20">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/20">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/20">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {careGoals.length === 0 && (
                <Card className="glass-card border-0 shadow-lg">
                  <CardContent className="text-center py-16">
                    <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                         style={{ background: 'var(--primary-gradient)' }}>
                      <Target className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-title-2 luxury-heading mb-3" style={{ color: 'var(--text-primary)' }}>
                      Set Your First Collaborative Goal
                    </h3>
                    <p className="luxury-body mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                      Create meaningful goals that your family members can support, celebrate, and help you achieve together
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                      <Button 
                        onClick={() => setIsCreateGoalOpen(true)}
                        className="luxury-button px-8"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Goal
                      </Button>
                      <div className="text-caption" style={{ color: 'var(--text-muted)' }}>
                        Your family will be notified when you create a goal
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 max-w-2xl mx-auto">
                      {[
                        { icon: Heart, label: 'Mental Health', color: 'var(--siani-blush)' },
                        { icon: Activity, label: 'Physical Health', color: 'var(--siani-golden-hour)' },
                        { icon: Users, label: 'Social', color: 'var(--siani-rose-dust)' },
                        { icon: Star, label: 'Life Skills', color: 'var(--siani-ember)' }
                      ].map((category, index) => (
                        <div key={index} className="p-4 rounded-xl text-center" style={{ background: 'var(--glass-light)' }}>
                          <category.icon className="w-6 h-6 mx-auto mb-2" style={{ color: category.color }} />
                          <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>
                            {category.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}