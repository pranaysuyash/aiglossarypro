import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Filter,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'general' | 'technical' | 'billing' | 'refund' | 'feature_request' | 'bug_report';
  customerEmail: string;
  customerName?: string;
  userId?: string;
  assignedToId?: string;
  assignedAgent?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  firstResponseAt?: string;
  lastResponseAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  dueDate?: string;
  messages?: TicketMessage[];
  attachments?: TicketAttachment[];
}

interface TicketMessage {
  id: string;
  content: string;
  senderType: 'customer' | 'agent' | 'system';
  senderEmail?: string;
  senderName?: string;
  isInternal: boolean;
  isAutoResponse: boolean;
  createdAt: string;
}

interface TicketAttachment {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  createdAt: string;
}

interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResponseTimeHours: number;
  customerSatisfaction: number;
}

const statusColors = {
  open: 'bg-red-100 text-red-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting_for_customer: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const typeIcons = {
  general: MessageSquare,
  technical: AlertCircle,
  billing: TrendingUp,
  refund: XCircle,
  feature_request: Plus,
  bug_report: AlertCircle,
};

export const SupportDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Check if user is admin
  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You need admin privileges to access the support dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { query: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(assignedFilter !== 'all' && { assignedTo: assignedFilter }),
      });

      const response = await fetch(`/api/support/tickets?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.data.tickets);
        setTotalPages(data.data.totalPages);
      }
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/support/metrics/daily', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.data);
      }
    } catch (error: any) {
      console.error('Error fetching metrics:', error);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string, internalNote?: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ status, internalNote }),
      });

      if (response.ok) {
        await fetchTickets();
        if (selectedTicket?.id === ticketId) {
          const updatedTicket = await fetchTicketDetails(ticketId);
          setSelectedTicket(updatedTicket);
        }
      }
    } catch (error: any) {
      console.error('Error updating ticket status:', error);
    }
  };

  const fetchTicketDetails = async (ticketId: string): Promise<SupportTicket | null> => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error: any) {
      console.error('Error fetching ticket details:', error);
    }
    return null;
  };

  const addMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) {return;}

    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          content: newMessage,
          senderType: 'agent',
          isInternal,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        setIsInternal(false);
        const updatedTicket = await fetchTicketDetails(selectedTicket.id);
        setSelectedTicket(updatedTicket);
      }
    } catch (error: any) {
      console.error('Error adding message:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {return '0 Bytes';}
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))  } ${  sizes[i]}`;
  };

  useEffect(() => {
    fetchTickets();
    fetchMetrics();
  }, [page, searchQuery, statusFilter, priorityFilter, typeFilter, assignedFilter]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Support Dashboard</h1>
          <p className="text-gray-600">Manage customer support tickets and requests</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold">{metrics.totalTickets}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.openTickets}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.resolvedTickets}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response</p>
                  <p className="text-2xl font-bold">{metrics.avgResponseTimeHours}h</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                  <p className="text-2xl font-bold">{metrics.customerSatisfaction}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_for_customer">Waiting</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="bug_report">Bug Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tickets found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map(ticket => {
                const TypeIcon = typeIcons[ticket.type as keyof typeof typeIcons];
                return (
                  <div
                    key={ticket.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowTicketDialog(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <TypeIcon className="h-5 w-5 text-gray-500" />
                          <span className="font-medium">#{ticket.ticketNumber}</span>
                          <Badge className={statusColors[ticket.status]}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={priorityColors[ticket.priority]}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{ticket.subject}</h3>
                        <p className="text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{ticket.customerName || ticket.customerEmail}</span>
                          <span>•</span>
                          <span>{formatDate(ticket.createdAt)}</span>
                          {ticket.assignedAgent && (
                            <>
                              <span>•</span>
                              <span>
                                Assigned to {ticket.assignedAgent.firstName}{' '}
                                {ticket.assignedAgent.lastName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span>#{selectedTicket.ticketNumber}</span>
                  <Badge className={statusColors[selectedTicket.status]}>
                    {selectedTicket.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={priorityColors[selectedTicket.priority]}>
                    {selectedTicket.priority}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="details" className="w-full">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Customer Information</h4>
                      <p>
                        <strong>Name:</strong> {selectedTicket.customerName || 'N/A'}
                      </p>
                      <p>
                        <strong>Email:</strong> {selectedTicket.customerEmail}
                      </p>
                      <p>
                        <strong>User ID:</strong> {selectedTicket.userId || 'Guest'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Ticket Information</h4>
                      <p>
                        <strong>Created:</strong> {formatDate(selectedTicket.createdAt)}
                      </p>
                      <p>
                        <strong>Type:</strong> {selectedTicket.type}
                      </p>
                      <p>
                        <strong>Priority:</strong> {selectedTicket.priority}
                      </p>
                      {selectedTicket.dueDate && (
                        <p>
                          <strong>Due Date:</strong> {formatDate(selectedTicket.dueDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Subject</h4>
                    <p>{selectedTicket.subject}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>

                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Attachments</h4>
                      <div className="space-y-2">
                        {selectedTicket.attachments.map(attachment => (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-3 p-2 border rounded"
                          >
                            <Download className="h-4 w-4" />
                            <div className="flex-1">
                              <p className="font-medium">{attachment.originalFileName}</p>
                              <p className="text-sm text-gray-600">
                                {formatFileSize(attachment.fileSize)}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={attachment.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Download
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="messages" className="space-y-4">
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {selectedTicket.messages.map(message => (
                        <div
                          key={message.id}
                          className={`p-4 rounded-lg ${
                            message.senderType === 'customer'
                              ? 'bg-blue-50 border-l-4 border-blue-500'
                              : message.isInternal
                                ? 'bg-yellow-50 border-l-4 border-yellow-500'
                                : 'bg-gray-50 border-l-4 border-gray-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {message.senderName || message.senderEmail || 'System'}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {message.senderType}
                              </Badge>
                              {message.isInternal && (
                                <Badge variant="outline" className="text-xs bg-yellow-100">
                                  Internal
                                </Badge>
                              )}
                              {message.isAutoResponse && (
                                <Badge variant="outline" className="text-xs bg-blue-100">
                                  Auto
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No messages yet</p>
                  )}

                  {/* Add Message Form */}
                  <div className="border-t pt-4 space-y-3">
                    <Textarea
                      placeholder="Type your response..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      rows={4}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="internal"
                          checked={isInternal}
                          onChange={e => setIsInternal(e.target.checked)}
                        />
                        <label htmlFor="internal" className="text-sm">
                          Internal note (not visible to customer)
                        </label>
                      </div>
                      <Button onClick={addMessage} disabled={!newMessage.trim()}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Update Status</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={selectedTicket.status === 'in_progress' ? 'default' : 'outline'}
                        onClick={() => updateTicketStatus(selectedTicket.id, 'in_progress')}
                      >
                        In Progress
                      </Button>
                      <Button
                        variant={
                          selectedTicket.status === 'waiting_for_customer' ? 'default' : 'outline'
                        }
                        onClick={() =>
                          updateTicketStatus(selectedTicket.id, 'waiting_for_customer')
                        }
                      >
                        Waiting for Customer
                      </Button>
                      <Button
                        variant={selectedTicket.status === 'resolved' ? 'default' : 'outline'}
                        onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                      >
                        Resolve
                      </Button>
                      <Button
                        variant={selectedTicket.status === 'closed' ? 'default' : 'outline'}
                        onClick={() => updateTicketStatus(selectedTicket.id, 'closed')}
                      >
                        Close
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email to Customer
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Set Due Date
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Assign to Agent
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
