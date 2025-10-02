import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const sampleCareTeam = [
  {
    id: "1",
    name: "Dr. Sarah Chen",
    role: "Mindfulness Specialist",
    organization: "Calm Collective",
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&w=80&h=80&fit=crop&crop=face",
    dateAdded: "2024-12-25T00:00:00Z"
  },
  {
    id: "2",
    name: "Maria Rodriguez", 
    role: "Wellness Coach",
    organization: "Wellness Institute",
    imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&w=80&h=80&fit=crop&crop=face",
    dateAdded: "2024-12-26T00:00:00Z"
  }
];

const sampleMessages = [
  {
    id: "1",
    senderId: "chw-alex",
    senderType: "chw",
    content: "Hi! How are you feeling today? I noticed you've been doing great with your daily actions.",
    timestamp: "2024-12-28T14:45:00Z"
  },
  {
    id: "2", 
    senderId: "demo-user-123",
    senderType: "user",
    content: "Thank you! I'm feeling much better. The breathing exercises really helped with my anxiety.",
    timestamp: "2024-12-28T14:47:00Z"
  }
];

export default function CareTeam() {
  const [newMessage, setNewMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch care team
  const { data: careTeam = [], isLoading: teamLoading } = useQuery({
    queryKey: ["/api/care-team"],
    select: (data) => data?.length ? data : sampleCareTeam
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages"],
    select: (data) => data?.length ? data : sampleMessages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/messages", {
        senderId: "demo-user-123",
        senderType: "user",
        content
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setNewMessage("");
      toast({
        title: "Message Sent",
        description: "Your message has been sent to your CHW.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Send Message",
        description: "Unable to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // WebSocket connection for real-time messaging
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=demo-user-123`;
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log("WebSocket connected");
      setWs(websocket);
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      }
    };
    
    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      setWs(null);
    };
    
    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    return () => {
      websocket.close();
    };
  }, [queryClient]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (teamLoading || messagesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading care team...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pt-4">
        <h2 className="text-title-1" style={{ color: 'var(--text-primary)' }}>Your Care Team</h2>
        <p className="text-callout" style={{ color: 'var(--text-tertiary)' }}>Professionals supporting your wellness journey</p>
      </div>

      {/* Care Team Members */}
      <div className="space-y-4">
        {careTeam.map((member: any) => (
          <div key={member.id} className="glass-card p-6 rounded-3xl">
            <div className="flex items-center space-x-4">
              <img
                src={member.imageUrl}
                alt={member.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-headline" style={{ color: 'var(--text-primary)' }}>{member.name}</h3>
                <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>{member.role}</p>
                <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{member.organization}</p>
                <p className="text-caption" style={{ color: 'var(--text-muted)' }}>
                  Added {formatDate(member.dateAdded)}
                </p>
              </div>
              <Button className="sunset-button p-3 rounded-2xl">
                <MessageCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* CHW Messaging Interface */}
      <div className="space-y-4">
        <h3 className="text-title-2" style={{ color: 'var(--text-primary)' }}>Community Health Worker</h3>

        <div className="glass-elevated rounded-3xl overflow-hidden">
          {/* Chat Header */}
          <div className="p-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center space-x-3">
              <img
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&w=60&h=60&fit=crop&crop=face"
                alt="Community Health Worker"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h4 className="font-semibold text-headline" style={{ color: 'var(--text-primary)' }}>Alex Thompson</h4>
                <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>Community Health Worker</p>
              </div>
              <div className="ml-auto">
                <div className={`w-3 h-3 rounded-full`} style={{ 
                  backgroundColor: ws ? 'var(--rich-coral)' : 'var(--warm-peach)' 
                }}></div>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <ScrollArea className="h-64 p-4">
            <div className="space-y-3">
              {messages.map((message: any) => (
                <div key={message.id} className={`flex space-x-3 ${
                  message.senderType === 'user' ? 'justify-end' : ''
                }`}>
                  {message.senderType === 'chw' && (
                    <img
                      src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face"
                      alt="CHW"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div className={`flex-1 max-w-xs ${
                    message.senderType === 'user' ? 'ml-auto' : ''
                  }`}>
                    <div className={`rounded-xl p-3 ${
                      message.senderType === 'user' 
                        ? 'ml-auto' 
                        : ''
                    }`} style={{
                      background: message.senderType === 'user' 
                        ? 'var(--primary-gradient)' 
                        : 'var(--surface-elevated)',
                      color: message.senderType === 'user' 
                        ? 'var(--rich-black)' 
                        : 'var(--text-primary)'
                    }}>
                      <p className="text-callout">{message.content}</p>
                    </div>
                    <p className={`text-caption mt-1 ${
                      message.senderType === 'user' ? 'text-right' : ''
                    }`} style={{ color: 'var(--text-muted)' }}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex space-x-3">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 rounded-2xl h-12 text-callout px-4 border-0"
                style={{
                  background: 'var(--surface-elevated)',
                  color: 'var(--text-primary)'
                }}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="sunset-button h-12 px-4 rounded-2xl"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
