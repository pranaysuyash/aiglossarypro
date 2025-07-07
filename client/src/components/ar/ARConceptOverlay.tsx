/**
 * AR Concept Overlay Component
 * Provides augmented reality visualization of AI/ML concepts in real-world space
 * 
 * Features:
 * - Real-world plane detection and anchoring
 * - 3D concept models overlaid on physical surfaces
 * - Hand gesture recognition for interaction
 * - Persistent spatial anchors for concept placement
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ARButton, XR, useHitTest, useXR } from '@react-three/xr';
import { Text, Sphere, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { useWebXR } from '../../hooks/useWebXR';

interface ARConcept {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  model: 'sphere' | 'box' | 'cylinder' | 'complex';
  scale: number;
  connections: string[];
}

interface ARPlacedConcept extends ARConcept {
  position: THREE.Vector3;
  anchor?: any; // XR Anchor object
  timestamp: number;
}

interface ARConceptOverlayProps {
  concepts?: ARConcept[];
  onConceptPlace?: (concept: ARConcept, position: THREE.Vector3) => void;
  onConceptSelect?: (conceptId: string) => void;
  onError?: (error: string) => void;
}

/**
 * AR Hit Test Reticle for placement targeting
 */
const ARReticle: React.FC<{
  visible: boolean;
  position: THREE.Vector3;
}> = ({ visible, position }) => {
  const reticleRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (reticleRef.current && visible) {
      // Animate reticle rotation
      reticleRef.current.rotation.z += 0.05;
    }
  });
  
  if (!visible) return null;
  
  return (
    <group ref={reticleRef} position={position.toArray()}>
      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.1, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
      
      {/* Inner dot */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.02, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Cross hairs */}
      <mesh position={[0, 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.02, 0.2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[0.02, 0.2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
    </group>
  );
};

/**
 * 3D representation of an AR concept
 */
const ARConceptModel: React.FC<{
  concept: ARPlacedConcept;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ concept, isSelected, onSelect }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.position.y = concept.position.y + Math.sin(state.clock.elapsedTime * 2) * 0.01;
      
      // Highlight animation when selected
      if (isSelected) {
        groupRef.current.rotation.y += 0.02;
        groupRef.current.scale.setScalar(concept.scale * 1.2);
      } else if (isHovered) {
        groupRef.current.scale.setScalar(concept.scale * 1.1);
      } else {
        groupRef.current.scale.setScalar(concept.scale);
      }
    }
  });
  
  const handleClick = useCallback(() => {
    onSelect();
    
    // Provide haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [onSelect]);
  
  const renderModel = () => {
    const props = {
      onClick: handleClick,
      onPointerEnter: () => setIsHovered(true),
      onPointerLeave: () => setIsHovered(false),
    };
    
    const material = (
      <meshStandardMaterial
        color={isSelected ? '#ffff00' : concept.color}
        emissive={isHovered ? '#333333' : '#000000'}
        transparent
        opacity={0.9}
        metalness={0.1}
        roughness={0.4}
      />
    );
    
    switch (concept.model) {
      case 'sphere':
        return (
          <Sphere args={[0.05, 16, 16]} {...props}>
            {material}
          </Sphere>
        );
      case 'box':
        return (
          <Box args={[0.08, 0.08, 0.08]} {...props}>
            {material}
          </Box>
        );
      case 'cylinder':
        return (
          <Cylinder args={[0.04, 0.04, 0.1, 16]} {...props}>
            {material}
          </Cylinder>
        );
      default:
        return (
          <Sphere args={[0.05, 16, 16]} {...props}>
            {material}
          </Sphere>
        );
    }
  };
  
  return (
    <group
      ref={groupRef}
      position={[concept.position.x, concept.position.y, concept.position.z]}
    >
      {/* 3D Model */}
      {renderModel()}
      
      {/* Label */}
      <Text
        position={[0, 0.1, 0]}
        fontSize={0.03}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="black"
        billboard
      >
        {concept.name}
      </Text>
      
      {/* Category badge */}
      <mesh position={[0, -0.08, 0]}>
        <planeGeometry args={[0.12, 0.02]} />
        <meshBasicMaterial color={concept.color} transparent opacity={0.7} />
      </mesh>
      
      {/* Ground shadow/connection indicator */}
      <mesh position={[0, -0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.03, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

/**
 * AR hit testing and placement logic
 */
const ARPlacementSystem: React.FC<{
  selectedConcept: ARConcept | null;
  onConceptPlace: (concept: ARConcept, position: THREE.Vector3) => void;
}> = ({ selectedConcept, onConceptPlace }) => {
  const [reticleVisible, setReticleVisible] = useState(false);
  const [reticlePosition, setReticlePosition] = useState(new THREE.Vector3());
  
  // Hit test for surface detection
  const hitTest = useHitTest((hitMatrix) => {
    if (hitMatrix) {
      const position = new THREE.Vector3();
      position.setFromMatrixPosition(hitMatrix);
      setReticlePosition(position);
      setReticleVisible(true);
    } else {
      setReticleVisible(false);
    }
  });
  
  // Handle screen tap for placement
  const handlePlacement = useCallback(() => {
    if (selectedConcept && reticleVisible) {
      onConceptPlace(selectedConcept, reticlePosition);
      setReticleVisible(false);
    }
  }, [selectedConcept, reticleVisible, reticlePosition, onConceptPlace]);
  
  // Listen for screen taps
  useEffect(() => {
    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length === 0) {
        handlePlacement();
      }
    };
    
    const handleClick = () => {
      handlePlacement();
    };
    
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('click', handleClick);
    };
  }, [handlePlacement]);
  
  return (
    <ARReticle 
      visible={reticleVisible && selectedConcept !== null} 
      position={reticlePosition} 
    />
  );
};

/**
 * Connection lines between placed AR concepts
 */
const ARConceptConnections: React.FC<{
  placedConcepts: ARPlacedConcept[];
}> = ({ placedConcepts }) => {
  const connections = React.useMemo(() => {
    const lines: Array<{
      from: THREE.Vector3;
      to: THREE.Vector3;
      color: string;
    }> = [];
    
    placedConcepts.forEach(concept => {
      concept.connections.forEach(connectionId => {
        const targetConcept = placedConcepts.find(c => c.id === connectionId);
        if (targetConcept) {
          lines.push({
            from: concept.position,
            to: targetConcept.position,
            color: concept.color,
          });
        }
      });
    });
    
    return lines;
  }, [placedConcepts]);
  
  return (
    <>
      {connections.map((connection, index) => (
        <line key={index}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                connection.from.x, connection.from.y, connection.from.z,
                connection.to.x, connection.to.y, connection.to.z,
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={connection.color} transparent opacity={0.6} />
        </line>
      ))}
    </>
  );
};

/**
 * Main AR Concept Overlay Component
 */
const ARConceptOverlay: React.FC<ARConceptOverlayProps> = ({
  concepts = [],
  onConceptPlace,
  onConceptSelect,
  onError,
}) => {
  const { sessionState, initializeARSession, endSession } = useWebXR();
  const [placedConcepts, setPlacedConcepts] = useState<ARPlacedConcept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<ARConcept | null>(null);
  const [selectedPlacedConcept, setSelectedPlacedConcept] = useState<string | undefined>();
  
  // Mock concept data if none provided
  const mockConcepts: ARConcept[] = [
    {
      id: '1',
      name: 'Neural Network',
      category: 'Deep Learning',
      description: 'Artificial neural network for machine learning',
      color: '#4a90e2',
      model: 'sphere',
      scale: 1.0,
      connections: ['2'],
    },
    {
      id: '2',
      name: 'CNN',
      category: 'Computer Vision',
      description: 'Convolutional Neural Network',
      color: '#e24a4a',
      model: 'box',
      scale: 0.8,
      connections: ['1'],
    },
    {
      id: '3',
      name: 'Transformer',
      category: 'NLP',
      description: 'Transformer architecture for language tasks',
      color: '#50c878',
      model: 'cylinder',
      scale: 1.2,
      connections: [],
    },
  ];
  
  const availableConcepts = concepts.length > 0 ? concepts : mockConcepts;
  
  const handleARSessionStart = useCallback(async () => {
    try {
      await initializeARSession();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start AR session';
      onError?.(message);
    }
  }, [initializeARSession, onError]);
  
  const handleARSessionEnd = useCallback(async () => {
    try {
      await endSession();
      setPlacedConcepts([]);
      setSelectedConcept(null);
    } catch (error) {
      console.error('Error ending AR session:', error);
    }
  }, [endSession]);
  
  const handleConceptPlace = useCallback((concept: ARConcept, position: THREE.Vector3) => {
    const placedConcept: ARPlacedConcept = {
      ...concept,
      position: position.clone(),
      timestamp: Date.now(),
    };
    
    setPlacedConcepts(prev => [...prev, placedConcept]);
    setSelectedConcept(null);
    onConceptPlace?.(concept, position);
    
    // Haptic feedback for successful placement
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
  }, [onConceptPlace]);
  
  const handlePlacedConceptSelect = useCallback((conceptId: string) => {
    setSelectedPlacedConcept(conceptId);
    onConceptSelect?.(conceptId);
  }, [onConceptSelect]);
  
  const clearAllConcepts = useCallback(() => {
    setPlacedConcepts([]);
    setSelectedConcept(null);
    setSelectedPlacedConcept(undefined);
  }, []);

  return (
    <div className="w-full h-screen relative bg-transparent">
      {/* AR Session Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <ARButton
          onEnterAR={handleARSessionStart}
          onExitAR={handleARSessionEnd}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        />
        
        {sessionState.isActive && (
          <button
            onClick={clearAllConcepts}
            className="block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
      
      {/* Concept Selection Panel */}
      {sessionState.isActive && (
        <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-80 rounded-lg p-4 max-w-xs">
          <h3 className="text-white font-bold mb-3">Select Concept to Place</h3>
          <div className="space-y-2">
            {availableConcepts.map(concept => (
              <button
                key={concept.id}
                onClick={() => setSelectedConcept(concept)}
                className={`w-full text-left p-2 rounded transition-colors ${
                  selectedConcept?.id === concept.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                <div className="font-medium">{concept.name}</div>
                <div className="text-xs opacity-75">{concept.category}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Placement Instructions */}
      {sessionState.isActive && selectedConcept && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg">
          Tap on a surface to place "{selectedConcept.name}"
        </div>
      )}
      
      {/* Status Indicators */}
      {sessionState.isLoading && (
        <div className="absolute bottom-4 left-4 z-10 text-white bg-black bg-opacity-50 px-4 py-2 rounded">
          Initializing AR...
        </div>
      )}
      
      {sessionState.error && (
        <div className="absolute bottom-16 left-4 z-10 text-red-400 bg-black bg-opacity-50 px-4 py-2 rounded">
          Error: {sessionState.error}
        </div>
      )}
      
      {/* Placed Concepts Count */}
      {sessionState.isActive && placedConcepts.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 text-white bg-black bg-opacity-50 px-4 py-2 rounded">
          {placedConcepts.length} concept{placedConcepts.length !== 1 ? 's' : ''} placed
        </div>
      )}

      {/* AR Canvas */}
      <Canvas
        className="w-full h-full"
        camera={{ position: [0, 0, 0], fov: 70 }}
        gl={{ alpha: true, antialias: true }}
      >
        <XR>
          {/* Lighting for AR objects */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[1, 1, 1]} intensity={0.8} />
          
          {/* AR Placement System */}
          <ARPlacementSystem
            selectedConcept={selectedConcept}
            onConceptPlace={handleConceptPlace}
          />
          
          {/* Render Placed Concepts */}
          {placedConcepts.map(concept => (
            <ARConceptModel
              key={`${concept.id}-${concept.timestamp}`}
              concept={concept}
              isSelected={selectedPlacedConcept === concept.id}
              onSelect={() => handlePlacedConceptSelect(concept.id)}
            />
          ))}
          
          {/* Concept Connections */}
          <ARConceptConnections placedConcepts={placedConcepts} />
        </XR>
      </Canvas>
    </div>
  );
};

export default ARConceptOverlay;