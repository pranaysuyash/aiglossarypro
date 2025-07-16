import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  HelpCircle,
  MessageSquare,
  Package,
  Plus,
  Send,
  Settings,
  Star,
  Ticket,
  Upload,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { getIdToken } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: 'bug' | 'feature_request' | 'billing' | 'account' | 'content' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed';
  userEmail: string;
  userName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  satisfactionRating?: number;
  satisfactionComment?: string;
}

interface SupportMessage {
  id: string;
  ticketId: string;
  userId: string;
  userType: 'customer' | 'support' | 'admin' | 'system';
  message: string;
  isInternalNote: boolean;
  createdAt: string;
  attachments?: string[];
}

export function SupportCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  // Fetch user's tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const token = await getIdToken(user as any);
      const response = await fetch('/api/support/tickets', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const data = await response.json();
      return data.data as SupportTicket[];
    },
    enabled: !!user,
  });

  // Fetch messages for selected ticket
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['support-messages', selectedTicket?.id],
    queryFn: async () => {
      const token = await getIdToken(user as any);
      const response = await fetch(`/api/support/tickets/${selectedTicket!.id}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      return data.data as SupportMessage[];
    },
    enabled: !!user && !!selectedTicket,
  });

  // Create new ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: {
      subject: string;
      description: string;
      category: string;
      priority?: string;
      attachments?: File[];
    }) => {
      const token = await getIdToken(user as any);
      const formData = new FormData();
      
      formData.append('subject', data.subject);
      formData.append('description', data.description);
      formData.append('category', data.category);
      if (data.priority) {
        formData.append('priority', data.priority);
      }
      
      if (data.attachments) {
        data.attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }

      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setShowNewTicketDialog(false);
      toast({
        title: 'Ticket Created',
        description: 'Your support ticket has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      ticketId: string;
      message: string;
      attachments?: File[];
    }) => {
      const token = await getIdToken(user as any);
      const formData = new FormData();
      
      formData.append('message', data.message);
      
      if (data.attachments) {
        data.attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }

      const response = await fetch(`/api/support/tickets/${data.ticketId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-messages', selectedTicket?.id] });
      setNewMessage('');
      setAttachments([]);
      toast({
        title: 'Message Sent',
        description: 'Your message has been sent successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Submit satisfaction rating
  const submitRatingMutation = useMutation({
    mutationFn: async (data: {
      ticketId: string;
      rating: number;
      comment?: string;
    }) => {
      const token = await getIdToken(user as any);
      const response = await fetch(`/api/support/tickets/${data.ticketId}/satisfaction`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: data.rating,
          comment: data.comment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast({
        title: 'Thank You!',
        description: 'Your feedback has been submitted.',
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <MessageSquare className="h-4 w-4" />;
      case 'waiting_on_customer':
        return <HelpCircle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <X className="h-4 w-4" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'waiting_on_customer':
        return 'bg-orange-100 text-orange-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug':
        return <AlertCircle className="h-4 w-4" />;
      case 'feature_request':
        return <Plus className="h-4 w-4" />;
      case 'billing':
        return <Package className="h-4 w-4" />;
      case 'account':
        return <Settings className="h-4 w-4" />;
      case 'content':
        return <FileText className="h-4 w-4" />;
      case 'technical':
        return <Settings className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Support Center</CardTitle>
            <CardDescription>Sign in to access support</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Please sign in to create support tickets and view your ticket history.
            </p>
            <Button asChild>
              <a href="/login">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Support Center</h1>
          <p className="text-muted-foreground">
            Get help with your questions and issues
          </p>
        </div>
        <Button onClick={() => setShowNewTicketDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tickets List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Tickets</CardTitle>
              <CardDescription>
                View and manage your support tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {ticketsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-3 border rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : tickets && tickets.length > 0 ? (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTicket?.id === ticket.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(ticket.category)}
                            <span className="font-medium text-sm">
                              {ticket.ticketNumber}
                            </span>
                          </div>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1 capitalize">
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm mb-1 line-clamp-1">
                          {ticket.subject}
                        </h4>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(ticket.priority)}`}
                          >
                            {ticket.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tickets yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Create your first support ticket
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="h-[680px] flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryIcon(selectedTicket.category)}
                      {selectedTicket.subject}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-4 text-sm">
                        <span>Ticket #{selectedTicket.ticketNumber}</span>
                        <Badge className={getStatusColor(selectedTicket.status)}>
                          {selectedTicket.status.replace('_', ' ')}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getPriorityColor(selectedTicket.priority)}
                        >
                          {selectedTicket.priority} priority
                        </Badge>
                      </div>
                    </CardDescription>
                  </div>
                  {selectedTicket.status === 'resolved' &&
                    !selectedTicket.satisfactionRating && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Show rating dialog
                        }}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Rate Support
                      </Button>
                    )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-gray-100 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages?.map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 rounded-lg ${
                            message.userType === 'customer'
                              ? 'bg-blue-50 ml-8'
                              : 'bg-gray-50 mr-8'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              {message.userType === 'customer' ? 'You' : 'Support'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline block"
                                >
                                  Attachment {idx + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              {selectedTicket.status !== 'closed' && (
                <CardFooter className="border-t">
                  <div className="w-full space-y-4">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="min-h-[80px]"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.txt,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                          id="message-attachments"
                        />
                        <Label
                          htmlFor="message-attachments"
                          className="cursor-pointer"
                        >
                          <Button variant="outline" size="sm" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Attach Files
                            </span>
                          </Button>
                        </Label>
                        {attachments.length > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {attachments.length} file(s) selected
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={() => {
                          if (newMessage.trim()) {
                            sendMessageMutation.mutate({
                              ticketId: selectedTicket.id,
                              message: newMessage,
                              attachments,
                            });
                          }
                        }}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              )}
            </Card>
          ) : (
            <Card className="h-[680px] flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a ticket to view details</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createTicketMutation.mutate({
                subject: formData.get('subject') as string,
                description: formData.get('description') as string,
                category: formData.get('category') as string,
                priority: formData.get('priority') as string,
                attachments,
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and we'll help you as soon as possible
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="Brief description of your issue"
                  required
                  minLength={5}
                  maxLength={200}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="billing">Billing Issue</SelectItem>
                      <SelectItem value="account">Account Help</SelectItem>
                      <SelectItem value="content">Content Issue</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Please provide detailed information about your issue..."
                  className="min-h-[150px]"
                  required
                  minLength={20}
                  maxLength={5000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments (optional)</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  onChange={handleFileChange}
                />
                {attachments.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {attachments.length} file(s) selected
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewTicketDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTicketMutation.isPending}>
                {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}