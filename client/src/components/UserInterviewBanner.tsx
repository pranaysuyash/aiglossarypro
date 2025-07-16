import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, DollarSign, MessageSquare, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface UserInterviewBannerProps {
  onAccept?: () => void;
  onDecline?: () => void;
  showOnlyForNewUsers?: boolean;
}

export function UserInterviewBanner({
  onAccept,
  onDecline,
  showOnlyForNewUsers = true,
}: UserInterviewBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user should see the interview banner
  const shouldShowBanner = () => {
    if (!user) {return false;}

    // Check if already participated or declined
    const hasDeclined = localStorage.getItem('interview_declined');
    const hasAccepted = localStorage.getItem('interview_accepted');
    if (hasDeclined || hasAccepted) {return false;}

    // Check if user is eligible (1 in 10 new signups)
    const isEligible = localStorage.getItem('interview_eligible');
    if (!isEligible) {
      // Randomly determine eligibility (10% chance)
      const isSelected = Math.random() < 0.1;
      localStorage.setItem('interview_eligible', isSelected.toString());
      return isSelected;
    }

    return isEligible === 'true';
  };

  // Show banner after delay for new users
  useEffect(() => {
    if (!user) {return;}

    const timer = setTimeout(
      () => {
        if (shouldShowBanner()) {
          setIsVisible(true);
        }
      },
      showOnlyForNewUsers ? 5000 : 1000
    ); // 5 seconds for new users, 1 second for testing

    return () => clearTimeout(timer);
  }, [user, showOnlyForNewUsers]);

  const handleAccept = async () => {
    setIsSubmitting(true);

    try {
      // Mark user as interview candidate in database
      const response = await fetch('/api/user-research/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.uid,
          email: user?.email,
          displayName: user?.displayName,
          acceptedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        // Store acceptance in localStorage
        localStorage.setItem('interview_accepted', 'true');
        localStorage.setItem('interview_accepted_date', new Date().toISOString());

        // Open Calendly link
        const calendlyUrl = 'https://calendly.com/ai-glossary-pro/user-interview';
        window.open(calendlyUrl, '_blank');

        toast({
          title: '🎉 Thank you!',
          description:
            'Your feedback will help us improve AI Glossary Pro. A $20 voucher will be sent after your interview.',
          duration: 6000,
        });

        onAccept?.();
        setIsVisible(false);
      } else {
        throw new Error('Failed to register for interview');
      }
    } catch (error: any) {
      console.error('Failed to register for interview:', error);
      toast({
        title: 'Registration Failed',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = () => {
    localStorage.setItem('interview_declined', 'true');
    localStorage.setItem('interview_declined_date', new Date().toISOString());

    toast({
      title: 'No problem!',
      description: 'You can always participate later from your dashboard.',
      duration: 3000,
    });

    onDecline?.();
    setIsVisible(false);
  };

  const handleMaybeLater = () => {
    // Set a delay before showing again (7 days)
    const nextShowDate = new Date();
    nextShowDate.setDate(nextShowDate.getDate() + 7);
    localStorage.setItem('interview_maybe_later', nextShowDate.toISOString());

    toast({
      title: "We'll ask again later",
      description: 'This invitation will reappear in a week.',
      duration: 3000,
    });

    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]"
        >
          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-gray-100 flex items-center">
                      Help Us Improve!
                      <Badge className="ml-2 bg-green-500 text-white border-0">
                        <DollarSign className="w-3 h-3 mr-1" />
                        $20 Voucher
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Share your thoughts in a 20-minute call
                    </CardDescription>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDecline}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* What's Involved */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  What's involved:
                </h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    <span>20-minute video call (flexible scheduling)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-3 h-3 text-green-500" />
                    <span>Share your experience using AI Glossary Pro</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-3 h-3 text-purple-500" />
                    <span>Help shape future features</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-3 h-3 text-green-500" />
                    <span>Receive $20 Amazon voucher after completion</span>
                  </div>
                </div>
              </div>

              {/* Benefits Highlight */}
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  🎯 Your feedback directly influences our product roadmap and helps us build better
                  AI learning tools!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={handleAccept}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Yes, I'd Love to Help!
                    </>
                  )}
                </Button>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleMaybeLater}
                    className="flex-1 border-gray-300 dark:border-gray-600"
                  >
                    Maybe Later
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleDecline}
                    className="flex-1 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    No Thanks
                  </Button>
                </div>
              </div>

              {/* Privacy Note */}
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  🔒 Your privacy is protected. Interview data is kept confidential.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to manage user research recruitment status
export function useUserResearch() {
  const [isEligible, setIsEligible] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [hasDeclined, setHasDeclined] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {return;}

    const eligible = localStorage.getItem('interview_eligible') === 'true';
    const accepted = localStorage.getItem('interview_accepted') === 'true';
    const declined = localStorage.getItem('interview_declined') === 'true';

    setIsEligible(eligible);
    setHasAccepted(accepted);
    setHasDeclined(declined);
  }, [user]);

  const markAsEligible = () => {
    localStorage.setItem('interview_eligible', 'true');
    setIsEligible(true);
  };

  const markAsAccepted = () => {
    localStorage.setItem('interview_accepted', 'true');
    localStorage.setItem('interview_accepted_date', new Date().toISOString());
    setHasAccepted(true);
  };

  const markAsDeclined = () => {
    localStorage.setItem('interview_declined', 'true');
    localStorage.setItem('interview_declined_date', new Date().toISOString());
    setHasDeclined(true);
  };

  return {
    isEligible,
    hasAccepted,
    hasDeclined,
    markAsEligible,
    markAsAccepted,
    markAsDeclined,
  };
}

export default UserInterviewBanner;
