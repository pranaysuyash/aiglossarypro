import { useEffect, useRef, useState } from 'react';

interface CodeLine {
  text: string;
  x: number;
  y: number;
  opacity: number;
  progress: number;
  speed: number;
  delay: number;
  isComplete: boolean;
}

interface CodeTypingBackgroundProps {
  className?: string;
  opacity?: number;
  linesCount?: number;
  typingSpeed?: number;
}

const AI_ML_CODE_SNIPPETS = [
  'import tensorflow as tf',
  'import numpy as np',
  'from sklearn.ensemble import RandomForest',
  'model = tf.keras.Sequential([',
  '    tf.keras.layers.Dense(128, activation="relu"),',
  '    tf.keras.layers.Dropout(0.2),',
  '    tf.keras.layers.Dense(10, activation="softmax")',
  '])',
  'X_train, X_test, y_train, y_test = train_test_split(X, y)',
  'model.compile(optimizer="adam", loss="sparse_categorical_crossentropy")',
  'history = model.fit(X_train, y_train, epochs=50, validation_split=0.2)',
  'predictions = model.predict(X_test)',
  'accuracy = accuracy_score(y_test, predictions)',
  'print(f"Model accuracy: {accuracy:.4f}")',
  'import torch',
  'import torch.nn as nn',
  'import torch.optim as optim',
  'class NeuralNetwork(nn.Module):',
  '    def __init__(self):',
  '        super().__init__()',
  '        self.fc1 = nn.Linear(784, 128)',
  '        self.fc2 = nn.Linear(128, 64)',
  '        self.fc3 = nn.Linear(64, 10)',
  '    def forward(self, x):',
  '        x = torch.relu(self.fc1(x))',
  '        x = torch.relu(self.fc2(x))',
  '        return self.fc3(x)',
  'from transformers import GPT2LMHeadModel',
  'model = GPT2LMHeadModel.from_pretrained("gpt2")',
  'tokenizer = GPT2Tokenizer.from_pretrained("gpt2")',
  'input_ids = tokenizer.encode(text, return_tensors="pt")',
  'with torch.no_grad():',
  '    outputs = model(input_ids)',
  'import pandas as pd',
  'df = pd.read_csv("data.csv")',
  'df.head()',
  'correlation_matrix = df.corr()',
  'plt.figure(figsize=(10, 8))',
  'sns.heatmap(correlation_matrix, annot=True)',
  'plt.show()',
  'scaler = StandardScaler()',
  'X_scaled = scaler.fit_transform(X)',
  'kmeans = KMeans(n_clusters=3)',
  'clusters = kmeans.fit_predict(X_scaled)',
  'from sklearn.metrics import classification_report',
  'print(classification_report(y_test, predictions))',
];

export function CodeTypingBackground({
  className = '',
  opacity = 0.3,
  linesCount = 15,
  typingSpeed = 50,
}: CodeTypingBackgroundProps) {
  // Reduce complexity on mobile devices
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const adjustedLinesCount = isMobile ? Math.min(linesCount, 8) : linesCount;
  const adjustedTypingSpeed = isMobile ? typingSpeed * 1.5 : typingSpeed; // Faster on mobile
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<CodeLine[]>([]);
  const animationRef = useRef<number>();
  const isReducedMotion = useRef(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    isReducedMotion.current = mediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion.current = e.matches;
    };

    mediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initializeLines = () => {
      const containerRect = container.getBoundingClientRect();
      const newLines: CodeLine[] = [];

      for (let i = 0; i < adjustedLinesCount; i++) {
        const snippet = AI_ML_CODE_SNIPPETS[Math.floor(Math.random() * AI_ML_CODE_SNIPPETS.length)];
        const line: CodeLine = {
          text: snippet,
          x: Math.random() * (containerRect.width - (isMobile ? 200 : 400)), // Less space on mobile
          y: Math.random() * (containerRect.height - 100),
          opacity: 0.1 + Math.random() * 0.4,
          progress: 0,
          speed: isReducedMotion.current ? 1000 : adjustedTypingSpeed + Math.random() * 30,
          delay: Math.random() * 5000,
          isComplete: false,
        };
        newLines.push(line);
      }

      setLines(newLines);
    };

    const animate = () => {
      setLines((prevLines) =>
        prevLines.map((line) => {
          if (line.delay > 0) {
            return { ...line, delay: line.delay - 16 };
          }

          if (!line.isComplete) {
            const newProgress = isReducedMotion.current
              ? line.text.length
              : Math.min(line.progress + 16 / line.speed, line.text.length);

            return {
              ...line,
              progress: newProgress,
              isComplete: newProgress >= line.text.length,
            };
          }

          // Restart the line after completion
          if (line.isComplete && Math.random() < 0.0005) {
            const snippet =
              AI_ML_CODE_SNIPPETS[Math.floor(Math.random() * AI_ML_CODE_SNIPPETS.length)];
            const container = containerRef.current;
            const containerRect = container?.getBoundingClientRect();

            return {
              ...line,
              text: snippet,
              x: Math.random() * ((containerRect?.width || 800) - (isMobile ? 200 : 400)),
              y: Math.random() * ((containerRect?.height || 600) - 100),
              opacity: 0.1 + Math.random() * 0.4,
              progress: 0,
              speed: isReducedMotion.current ? 1000 : adjustedTypingSpeed + Math.random() * 30,
              delay: Math.random() * 2000,
              isComplete: false,
            };
          }

          return line;
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    initializeLines();
    animate();

    const handleResize = () => {
      initializeLines();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [adjustedLinesCount, adjustedTypingSpeed, isMobile]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {lines.map((line, index) => (
        <div
          key={index}
          className="absolute font-mono text-xs md:text-sm text-purple-300 whitespace-nowrap select-none"
          style={{
            left: `${line.x}px`,
            top: `${line.y}px`,
            opacity: line.opacity * opacity,
            transform: `translateZ(0)`, // Force GPU acceleration
            willChange: 'opacity',
          }}
        >
          {line.text.slice(0, Math.floor(line.progress))}
          {!line.isComplete && line.delay <= 0 && (
            <span
              className="animate-pulse"
              style={{
                animation: isReducedMotion.current ? 'none' : undefined,
              }}
            >
              |
            </span>
          )}
        </div>
      ))}

      {/* Gradient overlay to fade edges */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-900/20"
        style={{ pointerEvents: 'none' }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/20"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
}
