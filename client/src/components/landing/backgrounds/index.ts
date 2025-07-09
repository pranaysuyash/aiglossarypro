export { BackgroundTester } from './BackgroundTester';
export { CodeTypingBackground } from './CodeTypingBackground';
export { FallbackBackground } from './FallbackBackground';
export { GeometricAIBackground } from './GeometricAIBackground';
export { NeuralNetworkBackground } from './NeuralNetworkBackground';

export type BackgroundType = 'neural' | 'code' | 'geometric' | 'fallback' | 'default';

import { CodeTypingBackground } from './CodeTypingBackground';
import { FallbackBackground } from './FallbackBackground';
import { GeometricAIBackground } from './GeometricAIBackground';
import { NeuralNetworkBackground } from './NeuralNetworkBackground';

export const BACKGROUND_COMPONENTS = {
  neural: NeuralNetworkBackground,
  code: CodeTypingBackground,
  geometric: GeometricAIBackground,
  fallback: FallbackBackground,
  default: null,
} as const;
