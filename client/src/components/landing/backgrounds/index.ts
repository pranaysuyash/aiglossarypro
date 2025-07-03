export { NeuralNetworkBackground } from './NeuralNetworkBackground';
export { CodeTypingBackground } from './CodeTypingBackground';
export { GeometricAIBackground } from './GeometricAIBackground';
export { FallbackBackground } from './FallbackBackground';
export { BackgroundTester } from './BackgroundTester';

export type BackgroundType = 'neural' | 'code' | 'geometric' | 'fallback' | 'default';

import { NeuralNetworkBackground } from './NeuralNetworkBackground';
import { CodeTypingBackground } from './CodeTypingBackground';
import { GeometricAIBackground } from './GeometricAIBackground';
import { FallbackBackground } from './FallbackBackground';

export const BACKGROUND_COMPONENTS = {
  neural: NeuralNetworkBackground,
  code: CodeTypingBackground,
  geometric: GeometricAIBackground,
  fallback: FallbackBackground,
  default: null
} as const;