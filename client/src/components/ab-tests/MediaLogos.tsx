import React, { useEffect } from 'react';
import { trackUserAction } from '@/lib/analytics';
import { useExperiment } from '@/services/posthogExperiments';

interface MediaLogo {
  name: string;
  placeholder: string;
  width: number;
  height: number;
}

const MEDIA_LOGOS: MediaLogo[] = [
  { name: 'TechCrunch', placeholder: 'TC', width: 120, height: 40 },
  { name: 'Forbes', placeholder: 'FORBES', width: 100, height: 30 },
  { name: 'Wired', placeholder: 'WIRED', width: 90, height: 35 },
  { name: 'MIT Review', placeholder: 'MIT', width: 110, height: 40 },
  { name: 'VentureBeat', placeholder: 'VB', width: 130, height: 35 },
  { name: 'The Verge', placeholder: 'VERGE', width: 100, height: 40 },
];

const TRUST_PHRASES: Record<string, string> = {
  control: 'As Featured In',
  authority: 'Trusted By Industry Leaders',
  social_proof: 'Join 10,000+ Professionals Using',
  credibility: 'Recommended By Top Publications',
};

interface MediaLogosProps {
  placement?: 'above_fold' | 'below_fold' | 'in_features' | 'near_cta';
}

export function MediaLogos({ placement = 'below_fold' }: MediaLogosProps) {
  const { variant: styleVariant, trackFeatureUsage } = useExperiment('mediaLogosStyle', 'control');

  const { variant: phraseVariant } = useExperiment('mediaLogosPhrase', 'control');

  const { variant: placementVariant } = useExperiment('mediaLogosPlacement', placement);

  useEffect(() => {
    trackFeatureUsage('media_logos_viewed', {
      style: styleVariant,
      phrase: phraseVariant,
      placement: placementVariant,
    });
  }, [styleVariant, phraseVariant, placementVariant, trackFeatureUsage]);

  const handleLogoClick = (logo: MediaLogo) => {
    trackUserAction('media_logo_clicked', {
      logo: logo.name,
      style: styleVariant,
      placement: placementVariant,
    });
  };

  const trustPhrase = TRUST_PHRASES[phraseVariant] || TRUST_PHRASES.control;

  // Different styles based on variant
  const renderLogos = () => {
    switch (styleVariant) {
      case 'animated':
        return <AnimatedLogos logos={MEDIA_LOGOS} onLogoClick={handleLogoClick} />;
      case 'carousel':
        return <CarouselLogos logos={MEDIA_LOGOS} onLogoClick={handleLogoClick} />;
      case 'grid':
        return <GridLogos logos={MEDIA_LOGOS} onLogoClick={handleLogoClick} />;
      default:
        return <DefaultLogos logos={MEDIA_LOGOS} onLogoClick={handleLogoClick} />;
    }
  };

  return (
    <section
      className={`
      py-12 sm:py-16
      ${placementVariant === 'above_fold' ? 'bg-gradient-to-b from-gray-50 to-white' : 'bg-gray-50'}
    `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-sm font-semibold text-gray-600 uppercase tracking-wide mb-8">
          {trustPhrase}
        </h2>
        {renderLogos()}
      </div>
    </section>
  );
}

function DefaultLogos({
  logos,
  onLogoClick,
}: {
  logos: MediaLogo[];
  onLogoClick: (logo: MediaLogo) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
      {logos.map(logo => (
        <button key={logo.name} onClick={() => onLogoClick(logo)} className="group cursor-pointer">
          <div
            className="bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
            style={{ width: logo.width, height: logo.height }}
          >
            <span className="text-gray-600 font-bold text-sm">{logo.placeholder}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function AnimatedLogos({
  logos,
  onLogoClick,
}: {
  logos: MediaLogo[];
  onLogoClick: (logo: MediaLogo) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
      {logos.map((logo, index) => (
        <button
          key={logo.name}
          onClick={() => onLogoClick(logo)}
          className="group cursor-pointer animate-fadeInUp"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div
            className="bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transform transition-all hover:scale-110"
            style={{ width: logo.width, height: logo.height }}
          >
            <span className="text-gray-600 font-bold text-sm group-hover:text-gray-800">
              {logo.placeholder}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function CarouselLogos({
  logos,
  onLogoClick,
}: {
  logos: MediaLogo[];
  onLogoClick: (logo: MediaLogo) => void;
}) {
  return (
    <div className="overflow-hidden">
      <div className="flex animate-scroll">
        {/* Duplicate logos for seamless scrolling */}
        {[...logos, ...logos].map((logo, index) => (
          <button
            key={`${logo.name}-${index}`}
            onClick={() => onLogoClick(logo)}
            className="flex-shrink-0 mx-6 cursor-pointer"
          >
            <div
              className="bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
              style={{ width: logo.width, height: logo.height }}
            >
              <span className="text-gray-600 font-bold text-sm">{logo.placeholder}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function GridLogos({
  logos,
  onLogoClick,
}: {
  logos: MediaLogo[];
  onLogoClick: (logo: MediaLogo) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
      {logos.map(logo => (
        <button key={logo.name} onClick={() => onLogoClick(logo)} className="group cursor-pointer">
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-center hover:shadow-lg transition-shadow">
            <div
              className="bg-gray-200 rounded flex items-center justify-center"
              style={{ width: '100%', height: 40 }}
            >
              <span className="text-gray-600 font-bold text-xs">{logo.placeholder}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
  
  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out both;
  }
  
  .animate-scroll {
    animation: scroll 30s linear infinite;
  }
  
  .animate-scroll:hover {
    animation-play-state: paused;
  }
`;
document.head.appendChild(style);
