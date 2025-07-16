import { Check, Copy, Gift, Share2, Sparkles, Star, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalRewards: number;
  availableRewards: number;
  referralCode: string;
  referralLink: string;
  recentReferrals: ReferralActivity[];
}

interface ReferralActivity {
  id: string;
  email: string;
  status: 'pending' | 'completed' | 'expired';
  reward: number;
  createdAt: string;
  completedAt?: string;
}

interface ReferralTier {
  name: string;
  referralsRequired: number;
  rewardAmount: number;
  bonusPercentage: number;
  icon: string;
  color: string;
  perks: string[];
}

const REFERRAL_TIERS: ReferralTier[] = [
  {
    name: 'Starter',
    referralsRequired: 0,
    rewardAmount: 5,
    bonusPercentage: 0,
    icon: '🌱',
    color: 'text-green-600',
    perks: ['$5 credit per successful referral', 'Basic referral tracking'],
  },
  {
    name: 'Advocate',
    referralsRequired: 5,
    rewardAmount: 8,
    bonusPercentage: 10,
    icon: '⭐',
    color: 'text-blue-600',
    perks: ['$8 credit per referral', '10% bonus on all rewards', 'Priority support'],
  },
  {
    name: 'Champion',
    referralsRequired: 15,
    rewardAmount: 12,
    bonusPercentage: 20,
    icon: '🏆',
    color: 'text-purple-600',
    perks: ['$12 credit per referral', '20% bonus rewards', 'Exclusive features early access'],
  },
  {
    name: 'Legend',
    referralsRequired: 50,
    rewardAmount: 20,
    bonusPercentage: 30,
    icon: '👑',
    color: 'text-yellow-600',
    perks: [
      '$20 credit per referral',
      '30% bonus rewards',
      'Personal account manager',
      'Co-marketing opportunities',
    ],
  },
];

export function ReferralSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch referral stats
  const fetchReferralStats = useCallback(async () => {
    if (!user) {return;}

    try {
      setLoading(true);
      const response = await fetch('/api/referrals/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error: any) {
      console.error('Failed to fetch referral stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load referral information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchReferralStats();
  }, [fetchReferralStats]);

  // Generate referral code if user doesn't have one
  useEffect(() => {
    if (user && !stats?.referralCode) {
      generateReferralCode();
    }
  }, [user, stats]);

  const generateReferralCode = async () => {
    try {
      const response = await fetch('/api/referrals/generate-code', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchReferralStats();
      }
    } catch (error: any) {
      console.error('Failed to generate referral code:', error);
    }
  };

  // Copy referral link to clipboard
  const copyReferralLink = async () => {
    if (!stats?.referralLink) {return;}

    try {
      await navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Referral link copied to clipboard',
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to copy referral link',
        variant: 'destructive',
      });
    }
  };

  // Share referral link
  const shareReferralLink = async () => {
    if (!stats?.referralLink) {return;}

    const shareData = {
      title: 'AI/ML Glossary Pro - Get Lifetime Access',
      text: 'Get comprehensive AI/ML definitions and track your learning progress!',
      url: stats.referralLink,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying
        await copyReferralLink();
      }
    } catch (error: any) {
      console.error('Failed to share:', error);
    }
  };

  // Calculate current tier
  const getCurrentTier = () => {
    if (!stats) {return REFERRAL_TIERS[0];}

    return (
      REFERRAL_TIERS.slice()
        .reverse()
        .find(tier => stats.successfulReferrals >= tier.referralsRequired) || REFERRAL_TIERS[0]
    );
  };

  // Calculate next tier
  const getNextTier = () => {
    if (!stats) {return REFERRAL_TIERS[1];}

    const currentTier = getCurrentTier();
    const currentIndex = REFERRAL_TIERS.indexOf(currentTier);
    return REFERRAL_TIERS[currentIndex + 1] || null;
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referral Program
          </CardTitle>
          <CardDescription>Sign in to start earning rewards by referring friends!</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => (window.location.href = '/login')}>Sign In to Get Started</Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading referral information...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const progressToNext = nextTier
    ? (((stats?.successfulReferrals || 0) - currentTier.referralsRequired) /
        (nextTier.referralsRequired - currentTier.referralsRequired)) *
      100
    : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Gift className="h-6 w-6" />
            Referral Program
          </CardTitle>
          <CardDescription className="text-blue-100">
            Earn rewards by sharing AI/ML Glossary Pro with friends and colleagues
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Current Tier & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Current Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{currentTier.icon}</span>
              <div>
                <div className={`font-semibold ${currentTier.color}`}>{currentTier.name}</div>
                <div className="text-sm text-gray-500">
                  ${currentTier.rewardAmount} per referral
                </div>
              </div>
            </div>
            {nextTier && (
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress to {nextTier.name}</span>
                  <span>
                    {stats?.successfulReferrals}/{nextTier.referralsRequired}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progressToNext, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.totalReferrals || 0}</div>
            <div className="text-sm text-gray-500">
              {stats?.successfulReferrals || 0} successful • {stats?.pendingReferrals || 0} pending
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">${stats?.totalRewards || 0}</div>
            <div className="text-sm text-gray-500">${stats?.availableRewards || 0} available</div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>Share this link with friends to start earning rewards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={stats?.referralLink || ''} readOnly className="flex-1" />
            <Button
              variant="outline"
              onClick={copyReferralLink}
              className="flex items-center gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button onClick={shareReferralLink} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            Your referral code:{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">{stats?.referralCode}</code>
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Share2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">1. Share Your Link</h3>
              <p className="text-sm text-gray-600">
                Send your referral link to friends, colleagues, or share on social media
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">2. Friend Signs Up</h3>
              <p className="text-sm text-gray-600">
                Your friend creates an account and gets premium access using your link
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">3. Earn Rewards</h3>
              <p className="text-sm text-gray-600">
                Both you and your friend get credits that can be used for future purchases
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Tier Benefits
          </CardTitle>
          <CardDescription>Unlock higher rewards as you refer more friends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REFERRAL_TIERS.map((tier, index) => (
              <div
                key={tier.name}
                className={`p-4 rounded-lg border ${
                  tier.name === currentTier.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{tier.icon}</span>
                  <div>
                    <div className={`font-semibold ${tier.color}`}>{tier.name}</div>
                    <div className="text-sm text-gray-500">{tier.referralsRequired}+ referrals</div>
                  </div>
                  {tier.name === currentTier.name && (
                    <Badge variant="secondary" className="ml-auto">
                      Current
                    </Badge>
                  )}
                </div>
                <ul className="text-sm space-y-1">
                  {tier.perks.map((perk, perkIndex) => (
                    <li key={perkIndex} className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-gray-400" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {stats?.recentReferrals && stats.recentReferrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Referral Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentReferrals.map(referral => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{referral.email}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        referral.status === 'completed'
                          ? 'default'
                          : referral.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {referral.status}
                    </Badge>
                    <div className="text-sm font-medium">${referral.reward}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
