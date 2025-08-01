import { Check, Copy, Facebook, Linkedin, Mail, Twitter } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SHARE_MESSAGES } from '@/constants/messages';
import { useToast } from '@/hooks/use-toast';

interface ShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export default function ShareMenu({ isOpen, onClose, title, url }: ShareMenuProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareOnTwitter = () => {
    const text = `Check out "${title}" in the AI/ML Glossary`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
    onClose();
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
    onClose();
  };

  const shareOnLinkedin = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedinUrl, '_blank');
    onClose();
  };

  const shareByEmail = () => {
    const subject = `Check out "${title}" in the AI/ML Glossary`;
    const body = `I thought you might be interested in this AI/ML term: ${title}\n\n${url}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    onClose();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast(SHARE_MESSAGES.COPIED);
      setTimeout(() => setCopied(false), 3000);
    } catch (_error) {
      toast({
        ...SHARE_MESSAGES.COPY_ERROR,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this term</DialogTitle>
          <DialogDescription>Share "{title}" with others via:</DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center my-4">
          <Button variant="outline" size="icon" className="rounded-full" onClick={shareOnTwitter}>
            <Twitter className="h-5 w-5 text-[#1DA1F2]" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full" onClick={shareOnFacebook}>
            <Facebook className="h-5 w-5 text-[#4267B2]" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full" onClick={shareOnLinkedin}>
            <Linkedin className="h-5 w-5 text-[#0077B5]" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full" onClick={shareByEmail}>
            <Mail className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Input value={url} readOnly className="flex-1" />
          <Button variant="outline" size="icon" onClick={copyToClipboard}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
