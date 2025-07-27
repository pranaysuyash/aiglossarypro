import { useState } from 'react';
import type React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ContactFormProps {
  className?: string | undefined;
}

export function ContactForm({ className }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Extract UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const utmData = {
        utm_source: urlParams.get('utm_source') || undefined,
        utm_medium: urlParams.get('utm_medium') || undefined,
        utm_campaign: urlParams.get('utm_campaign') || undefined,
      };

      const response = await fetch('/api/newsletter/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ...utmData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Message sent!',
          description: result.message,
          variant: 'default',
        });

        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: Error | unknown) {
      toast({
        title: 'Error sending message',
        description: error instanceof Error ? error?.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Card className={className}>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl font-bold text-center">Contact Us</CardTitle>
        <p className="text-sm sm:text-base text-gray-600 text-center px-2 sm:px-0">
          Still have questions? We're here to help! Contact us at{' '}
          <a
            href="mailto:support@aiglossarypro.com"
            className="text-purple-600 hover:underline break-words"
          >
            support@aiglossarypro.com
          </a>
        </p>
        <p className="text-sm text-gray-500 text-center">We typically respond within 24 hours.</p>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm sm:text-base font-medium">
                Your Name *
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                disabled={isSubmitting}
                className="min-h-[48px] text-base sm:text-sm px-4 py-3 sm:py-2 touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base font-medium">
                Email Address *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
                disabled={isSubmitting}
                className="min-h-[48px] text-base sm:text-sm px-4 py-3 sm:py-2 touch-manipulation"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm sm:text-base font-medium">
              Subject *
            </Label>
            <Input
              id="subject"
              name="subject"
              type="text"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="What can we help you with?"
              disabled={isSubmitting}
              className="min-h-[48px] text-base sm:text-sm px-4 py-3 sm:py-2 touch-manipulation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm sm:text-base font-medium">
              Message *
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              placeholder="Please describe your question or feedback in detail..."
              className="min-h-[120px] sm:min-h-[120px] text-base sm:text-sm px-4 py-3 sm:py-2 touch-manipulation resize-none"
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 min-h-[48px] sm:min-h-[44px] text-base sm:text-sm font-semibold py-3 sm:py-2 touch-manipulation"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
