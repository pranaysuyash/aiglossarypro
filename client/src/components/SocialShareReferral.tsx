import { Copy, ExternalLink, Facebook, Link as LinkIcon, Mail, MessageCircle, Share2, Twitter, Users } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Textarea } from './ui/textarea';

interface SocialShareReferralProps {
  termId?: string;
  termTitle?: string;
  termDefinition?: string;
  showInline?: boolean;
}

interface ReferralStats {
  totalReferrals: number;
  conversions: number;
  pendingEarnings: number;
  totalEarnings: number;
  conversionRate: number;
}

export function SocialShareReferral({
  termId,
  termTitle = "AI Glossary Pro",
  termDefinition,
  showInline = false,
}: SocialShareReferralProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 12,
    conversions: 3,
    pendingEarnings: 125.50,
    totalEarnings: 875.25,
    conversionRate: 25.0,
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Generate referral URL with user's referral code
  const generateReferralUrl = (platform?: string) => {
    const baseUrl = window.location.origin;
    const referralCode = user?.uid || 'demo123';
    
    if (termId) {
      // Sharing a specific term
      return `${baseUrl}/term/${termId}?ref=${referralCode}${platform ? `&utm_source=${platform}` : ''}`;
    } else {
      // Sharing the main site
      return `${baseUrl}?ref=${referralCode}${platform ? `&utm_source=${platform}` : ''}`;
    }
  };

  const getShareText = () => {
    if (termId && termTitle && termDefinition) {
      return `Check out this AI/ML definition: ${termTitle}\n\n${termDefinition.slice(0, 100)}...\n\nDiscover 10,000+ more terms at AI Glossary Pro!`;
    }
    return `Discover 10,000+ AI/ML definitions with AI Glossary Pro - the most comprehensive glossary for AI professionals and enthusiasts!`;
  };

  const handleCopyLink = async () => {
    const url = generateReferralUrl('copy');
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: '🔗 Link Copied!',
        description: 'Your referral link has been copied to clipboard.',
        duration: 3000,
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: '🔗 Link Copied!',
        description: 'Your referral link has been copied to clipboard.',
        duration: 3000,
      });
    }
  };

  const handleSocialShare = (platform: string) => {
    const url = generateReferralUrl(platform);
    const text = customMessage || getShareText();
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Check out AI Glossary Pro')}&body=${encodeURIComponent(text + '\n\n' + url)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      
      // Track share event
      console.log('Share tracked:', { platform, termId, userId: user?.uid });
      
      toast({
        title: '📤 Shared!',
        description: `Shared via ${platform}. You'll earn 25% commission for any purchases!`,
        duration: 4000,
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: termTitle,
          text: getShareText(),
          url: generateReferralUrl('native'),
        });
        
        toast({
          title: '📤 Shared!',
          description: 'Thanks for sharing! You\'ll earn commission for any purchases.',
          duration: 4000,
        });
      } catch (error) {
        console.log('Native share cancelled or failed');
      }
    }
  };

  const CommissionBadge = () => (
    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
      💰 Earn 25% Commission
    </Badge>
  );

  if (showInline) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="flex items-center space-x-2"
        >
          <Share2 className="w-4 h-4" />
          <span>Share & Earn</span>
        </Button>
        <CommissionBadge />
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Share2 className="w-4 h-4" />
          <span>Share This Term</span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Share & Earn</span>
              <CommissionBadge />
            </CardTitle>
            <CardDescription>
              Share this term and earn 25% commission on any Pro purchases from your link!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Custom Message */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Custom Message (Optional)
              </label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={getShareText()}
                className="min-h-[80px] text-sm"
                maxLength={280}
              />
              <div className="text-xs text-gray-500 mt-1">
                {customMessage.length}/280 characters
              </div>
            </div>

            {/* Referral Link */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Your Referral Link
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  value={generateReferralUrl()}
                  readOnly
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {/* Native Share (if available) */}
              {typeof navigator.share === 'function' && (
                <Button
                  variant="outline"
                  onClick={handleNativeShare}
                  className="flex items-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </Button>
              )}
              
              {/* Twitter */}
              <Button
                variant="outline"
                onClick={() => handleSocialShare('twitter')}
                className="flex items-center space-x-2"
              >
                <Twitter className="w-4 h-4 text-blue-400" />
                <span>Twitter</span>
              </Button>
              
              {/* Facebook */}
              <Button
                variant="outline"
                onClick={() => handleSocialShare('facebook')}
                className="flex items-center space-x-2"
              >
                <Facebook className="w-4 h-4 text-blue-600" />
                <span>Facebook</span>
              </Button>
              
              {/* LinkedIn */}
              <Button
                variant="outline"
                onClick={() => handleSocialShare('linkedin')}
                className="flex items-center space-x-2"
              >
                <LinkIcon className="w-4 h-4 text-blue-700" />
                <span>LinkedIn</span>
              </Button>
              
              {/* WhatsApp */}
              <Button
                variant="outline"
                onClick={() => handleSocialShare('whatsapp')}
                className="flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4 text-green-500" />
                <span>WhatsApp</span>
              </Button>
              
              {/* Email */}
              <Button
                variant="outline"
                onClick={() => handleSocialShare('email')}
                className="flex items-center space-x-2"
              >
                <Mail className="w-4 h-4 text-gray-600" />
                <span>Email</span>
              </Button>
            </div>

            {/* Referral Stats */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Your Referral Stats
              </h4>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {referralStats.totalReferrals}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Referrals</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {referralStats.conversions}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Conversions</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {referralStats.conversionRate}%
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Rate</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    ${referralStats.pendingEarnings}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Pending</div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                className="w-full mt-3 text-blue-600 hover:text-blue-700"
                onClick={() => {
                  window.open('/dashboard/referrals', '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Full Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

export default SocialShareReferral;