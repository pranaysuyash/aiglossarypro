import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  MessageSquare, 
  HelpCircle, 
  Search,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  BookOpen,
  Lightbulb,
  ArrowRight,
  ExternalLink,
  Download,
  Star,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'general' | 'technical' | 'billing' | 'refund' | 'feature_request' | 'bug_report';
  customerEmail: string;
  customerName?: string;
  createdAt: string;
  lastResponseAt?: string;
  messages?: TicketMessage[];
}

interface TicketMessage {
  id: string;
  content: string;
  senderType: 'customer' | 'agent' | 'system';
  senderName?: string;
  isInternal: boolean;
  createdAt: string;
}

interface KnowledgeBaseArticle {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  tags?: string[];
  viewCount: number;
  helpfulVotes: number;
  notHelpfulVotes: number;
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

export const SupportCenter: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('knowledge-base');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [loading, setLoading] = useState(false);

  // Create ticket form state
  const [newTicket, setNewTicket] = useState({
    customerEmail: user?.email || '',
    customerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    subject: '',
    description: '',
    type: 'general' as const,
    priority: 'medium' as const,
  });

  // Reply form state
  const [newReply, setNewReply] = useState('');

  const fetchTickets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/support/tickets/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.data.tickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchKnowledgeBase = async (query: string) => {
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);

      const response = await fetch(`/api/support/knowledge-base/search?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBase(data.data);
      }
    } catch (error) {
      console.error('Error searching knowledge base:', error);
    }
  };

  const createTicket = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }),
        },
        body: JSON.stringify({
          ...newTicket,
          initialMessage: newTicket.description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowCreateTicket(false);
        setNewTicket({
          customerEmail: user?.email || '',
          customerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
          subject: '',
          description: '',
          type: 'general',
          priority: 'medium',
        });
        
        if (user) {
          await fetchTickets();
          setActiveTab('my-tickets');
        } else {
          // For guest users, show the ticket number
          alert(`Ticket created successfully! Your ticket number is: ${data.data.ticketNumber}`);
        }
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId: string): Promise<SupportTicket | null> => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        headers: {
          ...(user && { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
    return null;
  };

  const addReply = async () => {
    if (!selectedTicket || !newReply.trim()) return;

    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }),
        },
        body: JSON.stringify({
          content: newReply,
          senderType: 'customer',
          senderEmail: user?.email || selectedTicket.customerEmail,
          senderName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : selectedTicket.customerName,
        }),
      });

      if (response.ok) {
        setNewReply('');
        const updatedTicket = await fetchTicketDetails(selectedTicket.id);
        setSelectedTicket(updatedTicket);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const voteOnArticle = async (articleId: string, helpful: boolean) => {
    try {
      await fetch(`/api/support/knowledge-base/${articleId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ helpful }),
      });
      
      // Refresh search results
      searchKnowledgeBase(searchQuery);
    } catch (error) {
      console.error('Error voting on article:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  useEffect(() => {
    if (user && activeTab === 'my-tickets') {
      fetchTickets();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (activeTab === 'knowledge-base') {
      searchKnowledgeBase(searchQuery);
    }
  }, [activeTab, searchQuery]);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Support Center</h1>
        <p className="text-xl text-gray-600 mb-6">
          Get help with AI Glossary Pro, search our knowledge base, or contact support
        </p>
        
        <div className="flex justify-center gap-4">
          <Button onClick={() => setShowCreateTicket(true)} size="lg">
            <MessageSquare className="h-5 w-5 mr-2" />
            Contact Support
          </Button>
          <Button variant="outline" size="lg" onClick={() => setActiveTab('knowledge-base')}>
            <BookOpen className="h-5 w-5 mr-2" />
            Browse Help Articles
          </Button>
        </div>
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Lightbulb className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Getting Started</h3>
            <p className="text-gray-600 mb-4">
              Learn how to make the most of AI Glossary Pro with our comprehensive guides
            </p>
            <Button variant="outline" className="w-full">
              View Guides <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <HelpCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">FAQ</h3>
            <p className="text-gray-600 mb-4">
              Find answers to the most commonly asked questions about our platform
            </p>
            <Button variant="outline" className="w-full">
              Browse FAQ <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Mail className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Contact Us</h3>
            <p className="text-gray-600 mb-4">
              Can't find what you're looking for? Get in touch with our support team
            </p>
            <Button variant="outline" className="w-full">
              Send Message <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
          <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="contact">Contact Options</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge-base" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Knowledge Base</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {knowledgeBase.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchQuery ? 'No articles found for your search' : 'Start typing to search for help articles'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {knowledgeBase.map((article) => (
                    <div key={article.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg text-blue-600 hover:text-blue-800 cursor-pointer">
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{article.viewCount} views</span>
                        </div>
                      </div>
                      
                      {article.excerpt && (
                        <p className="text-gray-600 mb-3">{article.excerpt}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {article.tags?.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => voteOnArticle(article.id, true)}
                              className="p-1"
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span className="ml-1 text-xs">{article.helpfulVotes}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => voteOnArticle(article.id, false)}
                              className="p-1"
                            >
                              <ThumbsDown className="h-4 w-4" />
                              <span className="ml-1 text-xs">{article.notHelpfulVotes}</span>
                            </Button>
                          </div>
                          
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/knowledge-base/${article.slug}`} target="_blank" rel="noopener noreferrer">
                              Read Article
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-tickets" className="mt-6">
          {!user ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sign in Required</h3>
                <p className="text-gray-600 mb-4">
                  Please sign in to view your support tickets
                </p>
                <Button asChild>
                  <a href="/auth/login">Sign In</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>My Support Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">You don't have any support tickets yet</p>
                    <Button onClick={() => setShowCreateTicket(true)}>
                      Create Your First Ticket
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={async () => {
                          const detailedTicket = await fetchTicketDetails(ticket.id);
                          setSelectedTicket(detailedTicket);
                          setShowTicketDialog(true);
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-medium">#{ticket.ticketNumber}</span>
                              <Badge className={statusColors[ticket.status]}>
                                {ticket.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={priorityColors[ticket.priority]}>
                                {ticket.priority}
                              </Badge>
                            </div>
                            <h3 className="font-semibold">{ticket.subject}</h3>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(ticket.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="capitalize">{ticket.type.replace('_', ' ')}</span>
                          {ticket.lastResponseAt && (
                            <>
                              <span>•</span>
                              <span>Last response: {formatDate(ticket.lastResponseAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Get help with technical issues, billing questions, or general inquiries
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li>• Response time: Within 24 hours</li>
                  <li>• Available: Monday - Friday</li>
                  <li>• Best for: Detailed questions</li>
                </ul>
                <Button onClick={() => setShowCreateTicket(true)} className="w-full">
                  Create Support Ticket
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Comprehensive guides and tutorials for all features
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li>• Getting started guides</li>
                  <li>• Feature documentation</li>
                  <li>• API reference</li>
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/docs" target="_blank" rel="noopener noreferrer">
                    View Documentation
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Email *</label>
                <Input
                  value={newTicket.customerEmail}
                  onChange={(e) => setNewTicket({ ...newTicket, customerEmail: e.target.value })}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Name</label>
                <Input
                  value={newTicket.customerName}
                  onChange={(e) => setNewTicket({ ...newTicket, customerName: e.target.value })}
                  placeholder="Your name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type *</label>
                <Select value={newTicket.type} onValueChange={(value: any) => setNewTicket({ ...newTicket, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Question</SelectItem>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="refund">Refund Request</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="bug_report">Bug Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <Select value={newTicket.priority} onValueChange={(value: any) => setNewTicket({ ...newTicket, priority: value })}>
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

            <div>
              <label className="block text-sm font-medium mb-2">Subject *</label>
              <Input
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                placeholder="Brief description of your issue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <Textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Please provide detailed information about your issue or question..."
                rows={6}
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateTicket(false)}>
                Cancel
              </Button>
              <Button
                onClick={createTicket}
                disabled={loading || !newTicket.customerEmail || !newTicket.subject || !newTicket.description}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Create Ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedTicket.subject}</h3>
                  <p className="text-sm text-gray-600">
                    Created on {formatDate(selectedTicket.createdAt)}
                  </p>
                </div>

                {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedTicket.messages
                      .filter(message => !message.isInternal)
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 rounded-lg ${
                            message.senderType === 'customer'
                              ? 'bg-blue-50 border-l-4 border-blue-500'
                              : 'bg-gray-50 border-l-4 border-gray-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {message.senderName || (message.senderType === 'customer' ? 'You' : 'Support Team')}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {message.senderType === 'customer' ? 'Customer' : 'Support'}
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      ))}
                  </div>
                )}

                {selectedTicket.status !== 'closed' && (
                  <div className="border-t pt-4 space-y-3">
                    <Textarea
                      placeholder="Type your reply..."
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      rows={4}
                    />
                    <div className="flex justify-end">
                      <Button onClick={addReply} disabled={!newReply.trim()}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};