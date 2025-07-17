import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { getIdToken } from 'firebase/auth';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { 
  Search, 
  Filter, 
  MessageCircle, 
  Clock, 
  User, 
  CheckCircle, 
  Eye,
  Send,
  Star,
  MessageSquare,
  Timer,
} from 'lucide-react';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userEmail: string;
  userName?: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'account' | 'feature_request' | 'bug_report' | 'other';
  assignedTo?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  satisfactionRating?: number;
  satisfactionComment?: string;
  metadata?: any;
}

interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  userType: 'customer' | 'support' | 'admin';
  message: string;
  isInternalNote: boolean;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

interface TicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  avgSatisfactionRating: number;
}

const statusColors = {
  open: 'bg-red-100 text-red-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting_for_customer: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const categoryLabels = {
  technical: 'Technical',
  billing: 'Billing',
  account: 'Account',
  feature_request: 'Feature Request',
  bug_report: 'Bug Report',
  other: 'Other',
};

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

export function AdminSupportCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    assignedTo: '',
    search: '',
  });
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showTicketDetail, setShowTicketDetail] = useState(false);

  // Fetch admin users for assignment
  const { data: adminUsers } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const token = await getIdToken(user as any);
      const response = await fetch('/api/admin/people', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch admin users');
      }
      const result = await response.json();
      return result.people;
    },
    enabled: !!user,
  });

  // Fetch ticket statistics
  const { data: stats } = useQuery<TicketStats>({
    queryKey: ['admin-support-stats'],
    queryFn: async () => {
      const token = await getIdToken(user as any);
      const response = await fetch('/api/admin/support/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch ticket statistics');
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch all tickets
  const { data: tickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey: ['admin-support-tickets', filters],
    queryFn: async () => {
      const token = await getIdToken(user as any);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {params.append(key, value);}
      });
      
      const response = await fetch(`/api/admin/support/tickets?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch ticket messages
  const { data: messages } = useQuery<TicketMessage[]>({
    queryKey: ['admin-support-messages', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket) {return [];}
      
      const token = await getIdToken(user as any);
      const response = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
    enabled: !!user && !!selectedTicket,
  });

  // Update ticket status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const token = await getIdToken(user as any);
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update ticket status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-stats'] });
      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      });
    },
    onError: (_error) => {
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    },
  });

  // Assign ticket
  const assignTicketMutation = useMutation({
    mutationFn: async ({ ticketId, assignToUserId }: { ticketId: string; assignToUserId: string }) => {
      const token = await getIdToken(user as any);
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignToUserId }),
      });
      if (!response.ok) {
        throw new Error('Failed to assign ticket');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      toast({
        title: "Success",
        description: "Ticket assigned successfully",
      });
    },
    onError: (_error) => {
      toast({
        title: "Error",
        description: "Failed to assign ticket",
        variant: "destructive",
      });
    },
  });

  // Reply to ticket
  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, message, isInternal }: { ticketId: string; message: string; isInternal: boolean }) => {
      const token = await getIdToken(user as any);
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message, 
          isInternalNote: isInternal,
          userType: 'admin',
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to send reply');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      setReplyMessage('');
      setIsInternalNote(false);
      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
    },
    onError: (_error) => {
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (ticketId: string, status: string) => {
    updateStatusMutation.mutate({ ticketId, status });
  };

  const handleAssignTicket = (ticketId: string, assignToUserId: string) => {
    assignTicketMutation.mutate({ ticketId, assignToUserId });
  };

  const handleReply = () => {
    if (!selectedTicket || !replyMessage.trim()) {return;}
    
    replyMutation.mutate({
      ticketId: selectedTicket.id,
      message: replyMessage,
      isInternal: isInternalNote,
    });
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {return `${Math.round(minutes)}m`;}
    if (minutes < 1440) {return `${Math.round(minutes / 60)}h`;}
    return `${Math.round(minutes / 1440)}d`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Center</h1>
          <p className="text-gray-600">Manage customer support tickets</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTickets}</div>
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="text-green-600">+{stats.openTickets}</span>
                <span className="ml-1">open</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.avgResponseTime || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Average first response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Time</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.avgResolutionTime || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Average resolution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.avgSatisfactionRating || 0).toFixed(1)}/5</div>
              <p className="text-xs text-muted-foreground">
                Average rating
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                value={filters.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            <Select value={filters.status} onValueChange={(value: string) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_for_customer">Waiting</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value: string) => setFilters(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.category} onValueChange={(value: string) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="bug_report">Bug Report</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => setFilters({
                status: '',
                priority: '',
                category: '',
                assignedTo: '',
                search: '',
              })}
              variant="outline"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>
            {tickets?.length || 0} tickets found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tickets?.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedTicket(ticket);
                  setShowTicketDetail(true);
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        #{ticket.ticketNumber}
                      </h3>
                      <Badge className={`text-xs ${statusColors[ticket.status]}`}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={`text-xs ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {ticket.subject}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {ticket.userEmail}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(ticket.createdAt)}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {categoryLabels[ticket.category]}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Select
                    value={ticket.assignedTo || ''}
                    onValueChange={(value: string) => handleAssignTicket(ticket.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {adminUsers?.map(admin => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={ticket.status}
                    onValueChange={(value: string) => handleStatusChange(ticket.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting_for_customer">Waiting</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      setSelectedTicket(ticket);
                      setShowTicketDetail(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {tickets?.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No tickets found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDetail} onOpenChange={setShowTicketDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Ticket #{selectedTicket?.ticketNumber}
            </DialogTitle>
            <DialogDescription>
              {selectedTicket?.subject}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedTicket.userName || 'Not provided'}</p>
                    <p><span className="font-medium">Email:</span> {selectedTicket.userEmail}</p>
                    <p><span className="font-medium">User ID:</span> {selectedTicket.userId}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Ticket Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Status:</span> 
                      <Badge className={`ml-2 ${statusColors[selectedTicket.status]}`}>
                        {selectedTicket.status.replace('_', ' ')}
                      </Badge>
                    </p>
                    <p><span className="font-medium">Priority:</span> 
                      <Badge className={`ml-2 ${priorityColors[selectedTicket.priority]}`}>
                        {selectedTicket.priority}
                      </Badge>
                    </p>
                    <p><span className="font-medium">Category:</span> {categoryLabels[selectedTicket.category]}</p>
                    <p><span className="font-medium">Created:</span> {formatTime(selectedTicket.createdAt)}</p>
                    {selectedTicket.firstResponseAt && (
                      <p><span className="font-medium">First Response:</span> {formatTime(selectedTicket.firstResponseAt)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Original Message */}
              <div>
                <h4 className="font-medium mb-2">Original Message</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Messages */}
              <div>
                <h4 className="font-medium mb-2">Conversation</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages?.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.userType === 'customer' 
                          ? 'bg-blue-50 border-l-4 border-blue-500' 
                          : message.isInternalNote
                          ? 'bg-yellow-50 border-l-4 border-yellow-500'
                          : 'bg-green-50 border-l-4 border-green-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">
                            {message.userType === 'customer' ? 'Customer' : 'Support Team'}
                          </span>
                          {message.isInternalNote && (
                            <Badge variant="secondary" className="text-xs">
                              Internal Note
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Form */}
              <div>
                <h4 className="font-medium mb-2">Reply</h4>
                <div className="space-y-4">
                  <Textarea
                    value={replyMessage}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    rows={4}
                  />
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsInternalNote(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Internal note (customer won't see this)</span>
                    </label>
                    
                    <Button
                      onClick={handleReply}
                      disabled={!replyMessage.trim() || replyMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}