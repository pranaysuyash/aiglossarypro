import { Copy, Heart, Share2 } from 'lucide-react';
import ShareMenu from '@/components/ShareMenu';
import { Button } from '@/components/ui/button';
import type { IEnhancedTerm, ITerm } from '@/interfaces/interfaces';

interface TermActionsProps {
  term: IEnhancedTerm | ITerm;
  favorite?: boolean;
  favoriteLoading: boolean;
  shareMenuOpen: boolean;
  onToggleFavorite: () => void;
  onCopyLink: () => void;
  onShareMenuToggle: (open: boolean) => void;
}

export default function TermActions({
  term,
  favorite,
  favoriteLoading,
  shareMenuOpen,
  onToggleFavorite,
  onCopyLink,
  onShareMenuToggle,
}: TermActionsProps) {
  return (
    <div className="flex items-center space-x-2 flex-shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleFavorite}
        disabled={favoriteLoading}
        className={favorite ? 'text-accent-500' : 'text-gray-400 hover:text-accent-500'}
      >
        <Heart className={favorite ? 'fill-current' : ''} />
      </Button>

      <Button variant="ghost" size="icon" onClick={onCopyLink}>
        <Copy />
      </Button>

      <Button variant="ghost" size="icon" onClick={() => onShareMenuToggle(true)}>
        <Share2 />
      </Button>

      <ShareMenu
        isOpen={shareMenuOpen}
        onClose={() => onShareMenuToggle(false)}
        title={term?.name || 'AI/ML Term'}
        url={window.location.href}
      />
    </div>
  );
}
