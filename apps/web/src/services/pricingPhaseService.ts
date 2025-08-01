import { useEffect, useState } from 'react';
import { PricingPhase, PRICING_PHASES, getCurrentPhase } from '@/config/pricing';

interface PhaseTransitionData {
  currentPhase: PricingPhase;
  nextPhase: PricingPhase | null;
  salesCount: number;
  remainingSlots: number;
  shouldTransition: boolean;
  transitionTime?: Date;
}

class PricingPhaseService {
  private static instance: PricingPhaseService;
  private currentPhase: PricingPhase;
  private salesCount: number = 0;
  private phaseStartTime: Map<PricingPhase, Date> = new Map();
  
  private constructor() {
    this.currentPhase = getCurrentPhase();
    this.initializePhaseData();
  }
  
  static getInstance(): PricingPhaseService {
    if (!PricingPhaseService.instance) {
      PricingPhaseService.instance = new PricingPhaseService();
    }
    return PricingPhaseService.instance;
  }
  
  private async initializePhaseData() {
    try {
      // Fetch sales count from server
      const response = await fetch('/api/pricing/phase-status');
      const data = await response.json();
      
      this.salesCount = data.totalSales || 0;
      this.currentPhase = data.currentPhase || getCurrentPhase();
      
      // Initialize phase start times
      if (data.phaseHistory) {
        Object.entries(data.phaseHistory).forEach(([phase, startTime]) => {
          this.phaseStartTime.set(phase as PricingPhase, new Date(startTime as string));
        });
      }
    } catch (error) {
      console.error('Failed to initialize pricing phase data:', error);
    }
  }
  
  getPhaseOrder(): PricingPhase[] {
    return ['beta', 'early', 'launch', 'regular'];
  }
  
  getCurrentPhaseIndex(): number {
    return this.getPhaseOrder().indexOf(this.currentPhase);
  }
  
  getNextPhase(): PricingPhase | null {
    const phases = this.getPhaseOrder();
    const currentIndex = this.getCurrentPhaseIndex();
    
    if (currentIndex < phases.length - 1) {
      return phases[currentIndex + 1];
    }
    
    return null;
  }
  
  async checkPhaseTransition(): Promise<PhaseTransitionData> {
    const currentConfig = PRICING_PHASES[this.currentPhase];
    const remainingSlots = currentConfig.slots - this.salesCount;
    const shouldTransition = remainingSlots <= 0 && this.currentPhase !== 'regular';
    const nextPhase = this.getNextPhase();
    
    // Check time-based transition (optional - can be configured)
    const phaseStarted = this.phaseStartTime.get(this.currentPhase);
    const phaseDuration = this.getPhaseDuration(this.currentPhase);
    let transitionTime: Date | undefined;
    
    if (phaseStarted && phaseDuration) {
      transitionTime = new Date(phaseStarted.getTime() + phaseDuration);
      const now = new Date();
      
      if (now >= transitionTime && nextPhase) {
        return {
          currentPhase: this.currentPhase,
          nextPhase,
          salesCount: this.salesCount,
          remainingSlots: 0,
          shouldTransition: true,
          transitionTime,
        };
      }
    }
    
    return {
      currentPhase: this.currentPhase,
      nextPhase,
      salesCount: this.salesCount,
      remainingSlots: Math.max(0, remainingSlots),
      shouldTransition,
      transitionTime,
    };
  }
  
  private getPhaseDuration(phase: PricingPhase): number | null {
    // Optional: Configure time-based transitions
    const durations: Partial<Record<PricingPhase, number>> = {
      beta: 7 * 24 * 60 * 60 * 1000, // 7 days
      early: 14 * 24 * 60 * 60 * 1000, // 14 days
      launch: 21 * 24 * 60 * 60 * 1000, // 21 days
    };
    
    return durations[phase] || null;
  }
  
  async transitionToNextPhase(): Promise<boolean> {
    const nextPhase = this.getNextPhase();
    
    if (!nextPhase) {
      return false;
    }
    
    try {
      const response = await fetch('/api/pricing/transition-phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPhase: this.currentPhase,
          toPhase: nextPhase,
        }),
      });
      
      if (response.ok) {
        this.currentPhase = nextPhase;
        this.phaseStartTime.set(nextPhase, new Date());
        return true;
      }
    } catch (error) {
      console.error('Failed to transition phase:', error);
    }
    
    return false;
  }
  
  async incrementSalesCount(): Promise<void> {
    this.salesCount++;
    
    // Check if we need to transition phases
    const transition = await this.checkPhaseTransition();
    if (transition.shouldTransition) {
      await this.transitionToNextPhase();
    }
  }
  
  getPhaseProgress(): {
    phase: PricingPhase;
    soldCount: number;
    totalSlots: number;
    percentage: number;
  } {
    const config = PRICING_PHASES[this.currentPhase];
    const percentage = config.slots === Infinity 
      ? 0 
      : Math.round((this.salesCount / config.slots) * 100);
    
    return {
      phase: this.currentPhase,
      soldCount: this.salesCount,
      totalSlots: config.slots,
      percentage,
    };
  }
  
  // Admin controls for manual phase switching
  async setPhase(phase: PricingPhase): Promise<boolean> {
    if (!(phase in PRICING_PHASES)) {
      return false;
    }
    
    try {
      const response = await fetch('/api/pricing/set-phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase }),
      });
      
      if (response.ok) {
        this.currentPhase = phase;
        this.phaseStartTime.set(phase, new Date());
        return true;
      }
    } catch (error) {
      console.error('Failed to set phase:', error);
    }
    
    return false;
  }
}

export const pricingPhaseService = PricingPhaseService.getInstance();

// React hook for using pricing phase data
export function usePricingPhase() {
  const [phaseData, setPhaseData] = useState<ReturnType<typeof pricingPhaseService.getPhaseProgress>>();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadPhaseData = async () => {
      try {
        const data = pricingPhaseService.getPhaseProgress();
        setPhaseData(data);
      } finally {
        setLoading(false);
      }
    };
    
    loadPhaseData();
    
    // Refresh every minute to check for transitions
    const interval = setInterval(loadPhaseData, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return { phaseData, loading };
}