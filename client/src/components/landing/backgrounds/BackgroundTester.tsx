import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BACKGROUND_COMPONENTS, type BackgroundType } from './index';

interface BackgroundTesterProps {
  onVariantChange?: (variant: BackgroundType) => void;
}

export function BackgroundTester({ onVariantChange }: BackgroundTesterProps) {
  const [currentVariant, setCurrentVariant] = useState<BackgroundType>('neural');
  const [opacity, setOpacity] = useState(0.4);

  const variants: { key: BackgroundType; label: string; description: string }[] = [
    {
      key: 'neural',
      label: 'Neural Network',
      description: 'Animated nodes and connections',
    },
    {
      key: 'code',
      label: 'Code Typing',
      description: 'Animated AI/ML code snippets',
    },
    {
      key: 'geometric',
      label: 'Geometric AI',
      description: 'Abstract AI geometric shapes',
    },
    {
      key: 'fallback',
      label: 'Fallback',
      description: 'Static gradient for older browsers',
    },
    {
      key: 'default',
      label: 'Default',
      description: 'No background overlay',
    },
  ];

  const handleVariantChange = (variant: BackgroundType) => {
    setCurrentVariant(variant);
    onVariantChange?.(variant);
  };

  const BackgroundComponent = BACKGROUND_COMPONENTS[currentVariant];

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-slate-800 border-slate-700 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            Background A/B Tester
            <Badge variant="secondary" className="text-xs">
              DEV
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {variants.map((variant) => (
              <Button
                key={variant.key}
                variant={currentVariant === variant.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleVariantChange(variant.key)}
                className="text-xs h-8"
              >
                {variant.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Opacity: {opacity.toFixed(1)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="text-xs text-slate-400">
            Current:{' '}
            <span className="text-white">
              {variants.find((v) => v.key === currentVariant)?.label}
            </span>
            <br />
            <span className="text-slate-500">
              {variants.find((v) => v.key === currentVariant)?.description}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Preview area */}
      <div className="mt-4 relative w-80 h-40 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-lg overflow-hidden">
        {BackgroundComponent && (
          <BackgroundComponent opacity={opacity} className="absolute inset-0" />
        )}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white">
            <h3 className="text-lg font-bold">Preview</h3>
            <p className="text-sm opacity-75">Hero Section Background</p>
          </div>
        </div>
      </div>
    </div>
  );
}
