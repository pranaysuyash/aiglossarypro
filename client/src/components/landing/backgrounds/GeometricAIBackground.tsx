import { useEffect, useRef } from 'react';

interface GeometricShape {
  type: 'triangle' | 'square' | 'hexagon' | 'circle' | 'diamond';
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
  vx: number;
  vy: number;
  scale: number;
  scaleDirection: number;
  scaleSpeed: number;
}

interface GeometricAIBackgroundProps {
  className?: string;
  opacity?: number;
  shapeCount?: number;
  animationSpeed?: number;
}

const AI_COLORS = [
  'rgba(147, 51, 234, 0.4)', // Purple
  'rgba(59, 130, 246, 0.4)', // Blue
  'rgba(16, 185, 129, 0.4)', // Green
  'rgba(245, 101, 101, 0.4)', // Red
  'rgba(251, 191, 36, 0.4)', // Yellow
  'rgba(139, 69, 19, 0.4)', // Brown
];

export function GeometricAIBackground({
  className = '',
  opacity = 0.3,
  shapeCount = 25,
  animationSpeed = 0.5
}: GeometricAIBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const shapesRef = useRef<GeometricShape[]>([]);
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    const initializeShapes = () => {
      const shapes: GeometricShape[] = [];
      const rect = canvas.getBoundingClientRect();
      const shapeTypes: GeometricShape['type'][] = ['triangle', 'square', 'hexagon', 'circle', 'diamond'];
      
      for (let i = 0; i < shapeCount; i++) {
        const shape: GeometricShape = {
          type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          size: 15 + Math.random() * 40,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02 * animationSpeed,
          opacity: 0.1 + Math.random() * 0.3,
          color: AI_COLORS[Math.floor(Math.random() * AI_COLORS.length)],
          vx: (Math.random() - 0.5) * animationSpeed * 0.5,
          vy: (Math.random() - 0.5) * animationSpeed * 0.5,
          scale: 0.8 + Math.random() * 0.4,
          scaleDirection: Math.random() > 0.5 ? 1 : -1,
          scaleSpeed: 0.005 + Math.random() * 0.01
        };
        shapes.push(shape);
      }

      shapesRef.current = shapes;
    };

    const drawTriangle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x - size * 0.866, y + size * 0.5);
      ctx.lineTo(x + size * 0.866, y + size * 0.5);
      ctx.closePath();
    };

    const drawSquare = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.beginPath();
      ctx.rect(x - size / 2, y - size / 2, size, size);
    };

    const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
    };

    const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    };

    const drawDiamond = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
    };

    const drawShape = (ctx: CanvasRenderingContext2D, shape: GeometricShape) => {
      ctx.save();
      ctx.translate(shape.x, shape.y);
      ctx.rotate(shape.rotation);
      ctx.scale(shape.scale, shape.scale);
      
      const alpha = shape.opacity * opacity;
      ctx.fillStyle = shape.color.replace(/[\d.]+\)$/, `${alpha})`);
      ctx.strokeStyle = shape.color.replace(/[\d.]+\)$/, `${alpha * 0.5})`);
      ctx.lineWidth = 1;

      switch (shape.type) {
        case 'triangle':
          drawTriangle(ctx, 0, 0, shape.size);
          break;
        case 'square':
          drawSquare(ctx, 0, 0, shape.size);
          break;
        case 'hexagon':
          drawHexagon(ctx, 0, 0, shape.size);
          break;
        case 'circle':
          drawCircle(ctx, 0, 0, shape.size);
          break;
        case 'diamond':
          drawDiamond(ctx, 0, 0, shape.size);
          break;
      }

      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const shapes = shapesRef.current;
      
      shapes.forEach(shape => {
        // Update position if animation is allowed
        if (!isReducedMotion.current) {
          shape.x += shape.vx;
          shape.y += shape.vy;
          shape.rotation += shape.rotationSpeed;
          
          // Update scale with breathing effect
          shape.scale += shape.scaleDirection * shape.scaleSpeed;
          if (shape.scale > 1.2 || shape.scale < 0.6) {
            shape.scaleDirection *= -1;
          }

          // Bounce off edges
          if (shape.x <= 0 || shape.x >= rect.width) {
            shape.vx *= -1;
            shape.x = Math.max(0, Math.min(rect.width, shape.x));
          }
          if (shape.y <= 0 || shape.y >= rect.height) {
            shape.vy *= -1;
            shape.y = Math.max(0, Math.min(rect.height, shape.y));
          }
        }

        drawShape(ctx, shape);
      });

      // Add connecting lines between nearby shapes
      if (!isReducedMotion.current) {
        ctx.strokeStyle = `rgba(147, 51, 234, ${opacity * 0.1})`;
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i < shapes.length; i++) {
          for (let j = i + 1; j < shapes.length; j++) {
            const shape1 = shapes[i];
            const shape2 = shapes[j];
            const distance = Math.sqrt(
              Math.pow(shape1.x - shape2.x, 2) + Math.pow(shape1.y - shape2.y, 2)
            );
            
            if (distance < 100) {
              const alpha = (1 - distance / 100) * opacity * 0.1;
              ctx.strokeStyle = `rgba(147, 51, 234, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(shape1.x, shape1.y);
              ctx.lineTo(shape2.x, shape2.y);
              ctx.stroke();
            }
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    initializeShapes();
    animate();

    const handleResize = () => {
      resizeCanvas();
      initializeShapes();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [opacity, shapeCount, animationSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{
        background: 'transparent',
        zIndex: 0
      }}
      aria-hidden="true"
    />
  );
}