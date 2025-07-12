import { Calendar, Copy, DollarSign, Gift, Link, Mail, Share2, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '../hooks/use-toast';

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  currentTierProgress: number;
  nextTierThreshold: number;
}

interface ReferralActivity {
  id: string;
  email: string;
  status: 'pending' | 'signed_up' | 'converted' | 'expired';
  sentAt: Date;
  convertedAt?: Date;
  commission: number;
  commissionStatus: 'pending' | 'paid' | 'processing';
}

interface ReferralTier {
  name: string;
  threshold: number;
  commission: number;
  badge: string;
  color: string;
}

export function ReferralProgram() {
  const { toast } = useToast();
  const [referralCode] = useState('AIGLOSS-REF-ABC123');
  const [customMessage, setCustomMessage] = useState('');

  // Mock data - would come from API
  const stats: ReferralStats = {
    totalReferrals: 15,
    successfulReferrals: 8,
    totalEarnings: 496.00,
    pendingEarnings: 124.00,
    currentTierProgress: 8,
    nextTierThreshold: 10,
  };

  const referralTiers: ReferralTier[] = [
    { name: 'Starter', threshold: 0, commission: 0.25, badge: '🌱', color: 'bg-green-100 text-green-800' },
    { name: 'Advocate', threshold: 5, commission: 0.30, badge: '⭐', color: 'bg-blue-100 text-blue-800' },
    { name: 'Champion', threshold: 10, commission: 0.35, badge: '🏆', color: 'bg-purple-100 text-purple-800' },
    { name: 'Elite', threshold: 25, commission: 0.40, badge: '💎', color: 'bg-yellow-100 text-yellow-800' },
  ];

  const currentTier = referralTiers
    .filter(tier => stats.successfulReferrals >= tier.threshold)
    .pop() || referralTiers[0];

  const nextTier = referralTiers.find(tier => tier.threshold > stats.successfulReferrals);

  const referralActivity: ReferralActivity[] = [
    {
      id: '1',
      email: 'john@example.com',
      status: 'converted',
      sentAt: new Date('2024-01-15'),
      convertedAt: new Date('2024-01-16'),
      commission: 62.00,
      commissionStatus: 'paid',
    },
    {
      id: '2',
      email: 'sarah@example.com',
      status: 'converted',
      sentAt: new Date('2024-01-20'),
      convertedAt: new Date('2024-01-22'),
      commission: 62.00,
      commissionStatus: 'paid',
    },
    {
      id: '3',
      email: 'mike@example.com',
      status: 'pending',
      sentAt: new Date('2024-02-01'),
      commission: 62.00,
      commissionStatus: 'pending',
    },
    {
      id: '4',
      email: 'lisa@example.com',
      status: 'signed_up',
      sentAt: new Date('2024-02-05'),
      commission: 62.00,
      commissionStatus: 'pending',
    },
  ];

  const handleCopyReferralLink = () => {
    const referralLink = `https://aiglossarypro.com?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: 'Link Copied!',
      description: 'Your referral link has been copied to the clipboard.',
    });
  };

  const handleShareEmail = () => {
    const subject = 'Check out AI Glossary Pro - The Ultimate AI/ML Reference';
    const body = `Hi!

I've been using AI Glossary Pro and thought you might find it useful. It's an incredible resource with 10,000+ AI/ML definitions and real-world examples.

You can check it out here: https://aiglossarypro.com?ref=${referralCode}

${customMessage ? `\n${customMessage}\n` : ''}
Best regards!`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'converted':
        return <Badge className="bg-green-100 text-green-800">Converted</Badge>;
      case 'signed_up':
        return <Badge className="bg-blue-100 text-blue-800">Signed Up</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCommissionStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Referral Program</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Earn commissions by referring others to AI Glossary Pro
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalReferrals}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Referrals</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.successfulReferrals}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Successful</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gift className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">${stats.pendingEarnings.toFixed(2)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Tier & Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>{currentTier.badge}</span>
            <span>Current Tier: {currentTier.name}</span>
            <Badge className={currentTier.color}>{(currentTier.commission * 100).toFixed(0)}% Commission</Badge>
          </CardTitle>
          <CardDescription>
            {nextTier ? (
              <>
                Refer {nextTier.threshold - stats.successfulReferrals} more users to reach {nextTier.name} tier and earn {(nextTier.commission * 100).toFixed(0)}% commission
              </>
            ) : (
              'You\'ve reached the highest tier! Keep referring to maximize your earnings.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to {nextTier.name}</span>
                <span>{stats.successfulReferrals}/{nextTier.threshold}</span>
              </div>
              <Progress 
                value={(stats.successfulReferrals / nextTier.threshold) * 100} 
                className="h-2"
              />
            </div>
          )}

          {/* Tier Benefits */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            {referralTiers.map((tier) => (
              <div
                key={tier.name}
                className={`p-3 rounded-lg border ${
                  tier.name === currentTier.name
                    ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">{tier.badge}</div>
                  <div className="font-medium">{tier.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {tier.threshold} referrals
                  </div>
                  <Badge className={`mt-1 ${tier.color}`}>
                    {(tier.commission * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="share" className="space-y-4">
        <TabsList>
          <TabsTrigger value="share" className="flex items-center space-x-2">
            <Share2 className="w-4 h-4" />
            <span>Share & Invite</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Activity</span>
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>Earnings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="share" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
              <CardDescription>
                Share this link with others to earn {(currentTier.commission * 100).toFixed(0)}% commission on their purchases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="referral-link">Referral Link</Label>
                <div className="flex space-x-2">
                  <Input
                    id="referral-link"
                    value={`https://aiglossarypro.com?ref=${referralCode}`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleCopyReferralLink} variant="outline">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral-code">Your Referral Code</Label>
                <div className="flex space-x-2">
                  <Input
                    id="referral-code"
                    value={referralCode}
                    readOnly
                    className="font-mono text-sm max-w-xs"
                  />
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(referralCode);
                      toast({ title: 'Code Copied!', description: 'Referral code copied to clipboard.' });
                    }}
                    variant="outline"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Share via Email</CardTitle>
              <CardDescription>
                Send a personalized invitation to your contacts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-message">Custom Message (Optional)</Label>
                <Input
                  id="custom-message"
                  placeholder="Add a personal note to your invitation..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
              </div>

              <Button onClick={handleShareEmail} className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                Compose Email Invitation
              </Button>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                This will open your default email client with a pre-written invitation
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Referral Activity</CardTitle>
              <CardDescription>
                Track the status of your referrals and their conversion progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Converted</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referralActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.email}</TableCell>
                      <TableCell>{getStatusBadge(activity.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{activity.sentAt.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.convertedAt ? (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{activity.convertedAt.toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>${activity.commission.toFixed(2)}</TableCell>
                      <TableCell>{getCommissionStatusBadge(activity.commissionStatus)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Summary</CardTitle>
              <CardDescription>
                View your commission history and payout details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Earned</div>
                    <div className="text-2xl font-bold text-green-600">${stats.totalEarnings.toFixed(2)}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                    <div className="text-2xl font-bold text-orange-600">${stats.pendingEarnings.toFixed(2)}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Next Payout</div>
                    <div className="text-2xl font-bold text-blue-600">Jan 31</div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Payout Information</h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p>• Commissions are paid monthly on the last day of each month</p>
                    <p>• Minimum payout threshold: $50</p>
                    <p>• Payments are processed via PayPal or bank transfer</p>
                    <p>• Commission rate: {(currentTier.commission * 100).toFixed(0)}% of each $249 purchase</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ReferralProgram;