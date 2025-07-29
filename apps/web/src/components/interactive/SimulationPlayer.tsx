import { Pause, Play, RotateCcw, SkipBack, SkipForward, Square } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

export interface SimulationStep {
  id: string;
  title: string;
  description: string;
  data: any;
  duration?: number; // milliseconds
  highlight?: string[]; // elements to highlight
}

export interface SimulationConfig {
  title: string;
  description?: string | undefined;
  steps: SimulationStep[];
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number; // 0.1 to 3.0
}

interface SimulationPlayerProps {
  config: SimulationConfig;
  onStepChange?: (step: SimulationStep, index: number) => void;
  renderStep?: (step: SimulationStep, index: number) => React.ReactNode;
  className?: string | undefined;
}

export default function SimulationPlayer({
  config,
  onStepChange,
  renderStep,
  className = '',
}: SimulationPlayerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(config.autoPlay || false);
  const [speed, setSpeed] = useState(config.speed || 1.0);
  const [progress, setProgress] = useState(0);

  const { steps } = config;
  const totalSteps = steps.length;

  const goToStep = useCallback(
    (stepIndex: number) => {
      const newIndex = Math.max(0, Math.min(stepIndex, totalSteps - 1));
      setCurrentStep(newIndex);
      setProgress((newIndex / (totalSteps - 1)) * 100);

      if (onStepChange) {
        onStepChange(steps[newIndex], newIndex);
      }
    },
    [steps, totalSteps, onStepChange]
  );

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      goToStep(currentStep + 1);
    } else if (config.loop) {
      goToStep(0);
    } else {
      setIsPlaying(false);
    }
  }, [currentStep, totalSteps, config.loop, goToStep]);

  const prevStep = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const reset = useCallback(() => {
    goToStep(0);
    setIsPlaying(false);
  }, [goToStep]);

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Auto-advance simulation when playing
  useEffect(() => {
    if (!isPlaying) {return;}

    const currentStepData = steps[currentStep];
    const stepDuration = (currentStepData?.duration || 2000) / speed;

    const timer = setTimeout(() => {
      nextStep();
    }, stepDuration);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, speed, nextStep, steps]);

  const handleProgressChange = (value: number[]) => {
    const stepIndex = Math.round((value[0] / 100) * (totalSteps - 1));
    goToStep(stepIndex);
  };

  const handleSpeedChange = (value: number[]) => {
    setSpeed(value[0]);
  };

  const defaultStepRenderer = (step: SimulationStep, index: number) => (
    <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[200px] flex flex-col justify-center">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{step.description}</p>
        {step.data && (
          <div className="bg-white dark:bg-gray-700 p-4 rounded border">
            <pre className="text-sm overflow-x-auto">
              {typeof step.data === 'string' ? step.data : JSON.stringify(step.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );

  const currentStepData = steps[currentStep];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{config.title}</CardTitle>
            {config.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{config.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Step {currentStep + 1} of {totalSteps}
            </Badge>
            {isPlaying && (
              <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                Playing
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Simulation Content */}
        <div className="mb-6">
          {renderStep
            ? renderStep(currentStepData, currentStep)
            : defaultStepRenderer(currentStepData, currentStep)}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[progress]}
            onValueChange={handleProgressChange}
            max={100}
            step={100 / (totalSteps - 1)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Start</span>
            <span>{currentStepData?.title}</span>
            <span>End</span>
          </div>
        </div>

        {/* Control Panel */}
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={reset}
              className="h-8 w-8"
              disabled={currentStep === 0 && !isPlaying}
            >
              <Square className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={prevStep}
              className="h-8 w-8"
              disabled={currentStep === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" onClick={togglePlay} className="h-8 w-8">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={nextStep}
              className="h-8 w-8"
              disabled={currentStep === totalSteps - 1 && !config.loop}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">Speed:</span>
              <div className="w-20">
                <Slider
                  value={[speed]}
                  onValueChange={handleSpeedChange}
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 w-8">
                {speed.toFixed(1)}x
              </span>
            </div>

            {config.loop && (
              <Badge variant="outline" className="text-xs">
                <RotateCcw className="h-3 w-3 mr-1" />
                Loop
              </Badge>
            )}
          </div>
        </div>

        {/* Step Information */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                {currentStepData?.title}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {currentStepData?.description}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
