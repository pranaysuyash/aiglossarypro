import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number[];
  pulse: number;
  pulseSpeed: number;
}

interface NeuralNetworkBackgroundProps {
  className?: string;
  opacity?: number;
  nodeCount?: number;
  maxConnections?: number;
  animationSpeed?: number;
}

export function NeuralNetworkBackground({
  className = '',
  opacity = 0.4,
  nodeCount = 50,
  maxConnections = 3,
  animationSpeed = 0.5
}: NeuralNetworkBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);
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

    const initializeNodes = () => {
      const nodes: Node[] = [];
      const rect = canvas.getBoundingClientRect();
      
      for (let i = 0; i < nodeCount; i++) {
        const node: Node = {
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * animationSpeed,
          vy: (Math.random() - 0.5) * animationSpeed,
          connections: [],
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.02
        };
        nodes.push(node);
      }

      // Create connections
      nodes.forEach((node, index) => {
        const connections = Math.floor(Math.random() * maxConnections);
        for (let i = 0; i < connections; i++) {
          const targetIndex = Math.floor(Math.random() * nodes.length);
          if (targetIndex !== index && !node.connections.includes(targetIndex)) {
            node.connections.push(targetIndex);
          }
        }
      });

      nodesRef.current = nodes;
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const nodes = nodesRef.current;
      
      // Update node positions if animation is allowed
      if (!isReducedMotion.current) {
        nodes.forEach(node => {
          node.x += node.vx;
          node.y += node.vy;
          node.pulse += node.pulseSpeed;

          // Bounce off edges
          if (node.x <= 0 || node.x >= rect.width) {
            node.vx *= -1;
            node.x = Math.max(0, Math.min(rect.width, node.x));
          }
          if (node.y <= 0 || node.y >= rect.height) {
            node.vy *= -1;
            node.y = Math.max(0, Math.min(rect.height, node.y));
          }
        });
      }

      // Draw connections
      ctx.strokeStyle = `rgba(147, 51, 234, ${opacity * 0.3})`;
      ctx.lineWidth = 1;
      
      nodes.forEach((node, index) => {
        node.connections.forEach(targetIndex => {
          const target = nodes[targetIndex];
          const distance = Math.sqrt(
            Math.pow(node.x - target.x, 2) + Math.pow(node.y - target.y, 2)
          );
          
          // Only draw connection if nodes are close enough
          if (distance < 150) {
            const alpha = (1 - distance / 150) * opacity * 0.3;
            ctx.strokeStyle = `rgba(147, 51, 234, ${alpha})`;
            
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        const pulseSize = isReducedMotion.current ? 1 : 1 + Math.sin(node.pulse) * 0.3;
        const radius = 2 * pulseSize;
        const alpha = opacity * (0.6 + Math.sin(node.pulse) * 0.4);
        
        ctx.fillStyle = `rgba(147, 51, 234, ${alpha})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(147, 51, 234, ${alpha})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    initializeNodes();
    animate();

    const handleResize = () => {
      resizeCanvas();
      initializeNodes();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [opacity, nodeCount, maxConnections, animationSpeed]);

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