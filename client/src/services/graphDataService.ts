/**
 * Graph Data Service
 * Transforms API relationship data into 3D graph format
 */

import { api } from '../lib/api';

interface ApiGraphNode {
  id: string;
  name: string;
  type: 'term' | 'category' | 'subcategory' | 'concept';
  category?: string;
  subcategory?: string;
  definition?: string;
  description?: string | undefined;
  level?: number;
  viewCount?: number;
  hasImplementation?: boolean;
  hasInteractiveElements?: boolean;
  difficultyLevel?: string;
}

interface ApiGraphLink {
  source: string;
  target: string;
  type: 'prerequisite' | 'related' | 'extends' | 'alternative' | 'belongs_to';
  strength: number;
}

export interface GraphNode {
  id: string;
  name: string;
  category: string;
  position: [number, number, number];
  connections: string[];
  complexity: number;
  popularity: number;
  isCore: boolean;
  color: string;
  size: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  strength: number;
  type: 'prerequisite' | 'related' | 'advanced' | 'application';
}

interface GraphLayoutOptions {
  algorithm?: 'force-directed' | 'hierarchical' | 'circular' | 'random';
  dimensions?: { width: number; height: number; depth: number };
  nodeSpacing?: number;
}

// Category color mapping
const CATEGORY_COLORS: Record<string, string> = {
  'Machine Learning': '#3b82f6',
  'Deep Learning': '#10b981',
  'Natural Language Processing': '#f59e0b',
  'Computer Vision': '#ef4444',
  'Reinforcement Learning': '#8b5cf6',
  'Data Science': '#ec4899',
  'Neural Networks': '#14b8a6',
  'Ethics & Bias': '#6366f1',
  General: '#6b7280',
};

// Difficulty to complexity mapping
const DIFFICULTY_TO_COMPLEXITY: Record<string, number> = {
  beginner: 3,
  intermediate: 5,
  advanced: 7,
  expert: 9,
};

export class GraphDataService {
  /**
   * Fetch term relationships from API
   */
  async fetchTermRelationships(
    termId: string,
    depth = 2,
    includeCategories = false
  ): Promise<{ nodes: ApiGraphNode[]; relationships: ApiGraphLink[] }> {
    try {
      const response = await api.get(
        `/api/terms/${termId}/relationships?depth=${depth}&includeCategories=${includeCategories}`
      );

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Failed to fetch term relationships');
    } catch (error) {
      console.error('Error fetching term relationships:', error);
      throw error;
    }
  }

  /**
   * Fetch bulk relationships for multiple terms
   */
  async fetchBulkRelationships(
    termIds: string[],
    depth = 1
  ): Promise<{ nodes: ApiGraphNode[]; relationships: ApiGraphLink[] }> {
    try {
      const response = await api.post('/api/relationships/bulk', {
        termIds,
        depth,
      });

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Failed to fetch bulk relationships');
    } catch (error) {
      console.error('Error fetching bulk relationships:', error);
      throw error;
    }
  }

  /**
   * Transform API data to 3D graph format
   */
  transformToGraphFormat(
    apiData: { nodes: ApiGraphNode[]; relationships: ApiGraphLink[] },
    options: GraphLayoutOptions = {}
  ): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const { algorithm = 'force-directed', dimensions = { width: 20, height: 20, depth: 20 } } =
      options;

    // Create connection map for quick lookup
    const connectionMap = new Map<string, Set<string>>();
    apiData.relationships.forEach(rel => {
      if (!connectionMap.has(rel.source)) {
        connectionMap.set(rel.source, new Set());
      }
      if (!connectionMap.has(rel.target)) {
        connectionMap.set(rel.target, new Set());
      }
      connectionMap.get(rel.source)!.add(rel.target);
      connectionMap.get(rel.target)!.add(rel.source);
    });

    // Calculate node metrics
    const nodeMetrics = this.calculateNodeMetrics(apiData.nodes, apiData.relationships);

    // Generate positions based on layout algorithm
    const positions = this.generateNodePositions(apiData.nodes, apiData.relationships, {
      algorithm,
      dimensions,
    });

    // Transform nodes
    const nodes: GraphNode[] = apiData.nodes.map((node, index) => {
      const connections = Array.from(connectionMap.get(node.id) || []);
      const metrics = nodeMetrics.get(node.id) || {
        centrality: 0,
        pageRank: 0,
        clustering: 0,
      };

      return {
        id: node.id,
        name: node.name,
        category: node.category || 'General',
        position: positions[index],
        connections,
        complexity: this.calculateComplexity(node),
        popularity: this.calculatePopularity(node, metrics),
        isCore: this.isCoreConcept(node, metrics),
        color: CATEGORY_COLORS[node.category || 'General'] || '#6b7280',
        size: this.calculateNodeSize(node, metrics),
      };
    });

    // Transform edges
    const edges: GraphEdge[] = apiData.relationships.map(rel => ({
      source: rel.source,
      target: rel.target,
      strength: rel.strength / 10, // Normalize to 0-1
      type: this.mapRelationshipType(rel.type),
    }));

    return { nodes, edges };
  }

  /**
   * Calculate node metrics for visualization
   */
  private calculateNodeMetrics(
    nodes: ApiGraphNode[],
    relationships: ApiGraphLink[]
  ): Map<string, { centrality: number; pageRank: number; clustering: number }> {
    const metrics = new Map();

    // Calculate degree centrality
    const degreeMap = new Map<string, number>();
    relationships.forEach(rel => {
      degreeMap.set(rel.source, (degreeMap.get(rel.source) || 0) + 1);
      degreeMap.set(rel.target, (degreeMap.get(rel.target) || 0) + 1);
    });

    // Calculate PageRank (simplified)
    const pageRankMap = this.calculatePageRank(nodes, relationships);

    // Calculate clustering coefficient
    const clusteringMap = this.calculateClusteringCoefficient(nodes, relationships);

    nodes.forEach(node => {
      metrics.set(node.id, {
        centrality: (degreeMap.get(node.id) || 0) / nodes.length,
        pageRank: pageRankMap.get(node.id) || 0,
        clustering: clusteringMap.get(node.id) || 0,
      });
    });

    return metrics;
  }

  /**
   * Generate 3D positions for nodes
   */
  private generateNodePositions(
    nodes: ApiGraphNode[],
    relationships: ApiGraphLink[],
    options: { algorithm: string; dimensions: { width: number; height: number; depth: number } }
  ): [number, number, number][] {
    switch (options.algorithm) {
      case 'force-directed':
        return this.forceDirectedLayout(nodes, relationships, options.dimensions);
      case 'hierarchical':
        return this.hierarchicalLayout(nodes, relationships, options.dimensions);
      case 'circular':
        return this.circularLayout(nodes, options.dimensions);
      default:
        return this.randomLayout(nodes, options.dimensions);
    }
  }

  /**
   * Force-directed layout algorithm
   */
  private forceDirectedLayout(
    nodes: ApiGraphNode[],
    relationships: ApiGraphLink[],
    dimensions: { width: number; height: number; depth: number }
  ): [number, number, number][] {
    const positions: [number, number, number][] = [];
    const nodeMap = new Map(nodes.map((n, i) => [n.id, i]));

    // Initialize random positions
    nodes.forEach(() => {
      positions.push([
        (Math.random() - 0.5) * dimensions.width,
        (Math.random() - 0.5) * dimensions.height,
        (Math.random() - 0.5) * dimensions.depth,
      ]);
    });

    // Simplified force-directed algorithm
    const iterations = 50;
    const k = Math.sqrt((dimensions.width * dimensions.height * dimensions.depth) / nodes.length);

    for (let iter = 0; iter < iterations; iter++) {
      const forces: [number, number, number][] = positions.map(() => [0, 0, 0]);

      // Repulsive forces between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = positions[i][0] - positions[j][0];
          const dy = positions[i][1] - positions[j][1];
          const dz = positions[i][2] - positions[j][2];
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;
          const force = (k * k) / distance;

          forces[i][0] += (dx / distance) * force;
          forces[i][1] += (dy / distance) * force;
          forces[i][2] += (dz / distance) * force;
          forces[j][0] -= (dx / distance) * force;
          forces[j][1] -= (dy / distance) * force;
          forces[j][2] -= (dz / distance) * force;
        }
      }

      // Attractive forces for connected nodes
      relationships.forEach(rel => {
        const i = nodeMap.get(rel.source);
        const j = nodeMap.get(rel.target);
        if (i !== undefined && j !== undefined) {
          const dx = positions[i][0] - positions[j][0];
          const dy = positions[i][1] - positions[j][1];
          const dz = positions[i][2] - positions[j][2];
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const force = ((distance * distance) / k) * (rel.strength / 10);

          forces[i][0] -= (dx / distance) * force;
          forces[i][1] -= (dy / distance) * force;
          forces[i][2] -= (dz / distance) * force;
          forces[j][0] += (dx / distance) * force;
          forces[j][1] += (dy / distance) * force;
          forces[j][2] += (dz / distance) * force;
        }
      });

      // Apply forces with damping
      const damping = 0.1;
      for (let i = 0; i < nodes.length; i++) {
        positions[i][0] += forces[i][0] * damping;
        positions[i][1] += forces[i][1] * damping;
        positions[i][2] += forces[i][2] * damping;

        // Keep within bounds
        positions[i][0] = Math.max(
          -dimensions.width / 2,
          Math.min(dimensions.width / 2, positions[i][0])
        );
        positions[i][1] = Math.max(
          -dimensions.height / 2,
          Math.min(dimensions.height / 2, positions[i][1])
        );
        positions[i][2] = Math.max(
          -dimensions.depth / 2,
          Math.min(dimensions.depth / 2, positions[i][2])
        );
      }
    }

    return positions;
  }

  /**
   * Hierarchical layout algorithm
   */
  private hierarchicalLayout(
    nodes: ApiGraphNode[],
    relationships: ApiGraphLink[],
    dimensions: { width: number; height: number; depth: number }
  ): [number, number, number][] {
    // Calculate node levels based on relationships
    const levels = this.calculateNodeLevels(nodes, relationships);
    const levelGroups = new Map<number, ApiGraphNode[]>();

    nodes.forEach(node => {
      const level = levels.get(node.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    });

    const positions: [number, number, number][] = [];
    const nodePositionMap = new Map<string, number>();

    nodes.forEach((node, index) => {
      nodePositionMap.set(node.id, index);
    });

    // Position nodes by level
    const maxLevel = Math.max(...Array.from(levelGroups.keys()));
    levelGroups.forEach((levelNodes, level) => {
      const y = (level / maxLevel) * dimensions.height - dimensions.height / 2;
      const angleStep = (2 * Math.PI) / levelNodes.length;

      levelNodes.forEach((node, i) => {
        const angle = i * angleStep;
        const radius = dimensions.width / 3;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        const nodeIndex = nodePositionMap.get(node.id)!;
        positions[nodeIndex] = [x, y, z];
      });
    });

    return positions;
  }

  /**
   * Circular layout algorithm
   */
  private circularLayout(
    nodes: ApiGraphNode[],
    dimensions: { width: number; height: number; depth: number }
  ): [number, number, number][] {
    const positions: [number, number, number][] = [];
    const radius = Math.min(dimensions.width, dimensions.depth) / 2.5;

    nodes.forEach((_, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      const y = (Math.random() - 0.5) * dimensions.height * 0.3;

      positions.push([x, y, z]);
    });

    return positions;
  }

  /**
   * Random layout algorithm
   */
  private randomLayout(
    nodes: ApiGraphNode[],
    dimensions: { width: number; height: number; depth: number }
  ): [number, number, number][] {
    return nodes.map(() => [
      (Math.random() - 0.5) * dimensions.width,
      (Math.random() - 0.5) * dimensions.height,
      (Math.random() - 0.5) * dimensions.depth,
    ]);
  }

  /**
   * Calculate node levels for hierarchical layout
   */
  private calculateNodeLevels(
    nodes: ApiGraphNode[],
    relationships: ApiGraphLink[]
  ): Map<string, number> {
    const levels = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();

    // Build adjacency list for prerequisite relationships
    relationships
      .filter(rel => rel.type === 'prerequisite')
      .forEach(rel => {
        if (!adjacencyList.has(rel.target)) {
          adjacencyList.set(rel.target, []);
        }
        adjacencyList.get(rel.target)!.push(rel.source);
      });

    // BFS to assign levels
    const queue: { nodeId: string; level: number }[] = [];
    const visited = new Set<string>();

    // Start with nodes that have no prerequisites
    nodes.forEach(node => {
      if (!adjacencyList.has(node.id)) {
        queue.push({ nodeId: node.id, level: 0 });
        levels.set(node.id, 0);
        visited.add(node.id);
      }
    });

    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!;

      // Find nodes that depend on this one
      relationships
        .filter(rel => rel.type === 'prerequisite' && rel.source === nodeId)
        .forEach(rel => {
          if (!visited.has(rel.target)) {
            visited.add(rel.target);
            levels.set(rel.target, level + 1);
            queue.push({ nodeId: rel.target, level: level + 1 });
          }
        });
    }

    // Assign default level to unvisited nodes
    nodes.forEach(node => {
      if (!levels.has(node.id)) {
        levels.set(node.id, Math.floor(Math.random() * 3));
      }
    });

    return levels;
  }

  /**
   * Calculate simplified PageRank
   */
  private calculatePageRank(
    nodes: ApiGraphNode[],
    relationships: ApiGraphLink[]
  ): Map<string, number> {
    const pageRank = new Map<string, number>();
    const damping = 0.85;
    const iterations = 20;

    // Initialize with equal rank
    nodes.forEach(node => {
      pageRank.set(node.id, 1 / nodes.length);
    });

    // Build adjacency lists
    const incomingLinks = new Map<string, string[]>();
    const outgoingLinkCount = new Map<string, number>();

    relationships.forEach(rel => {
      if (!incomingLinks.has(rel.target)) {
        incomingLinks.set(rel.target, []);
      }
      incomingLinks.get(rel.target)!.push(rel.source);
      outgoingLinkCount.set(rel.source, (outgoingLinkCount.get(rel.source) || 0) + 1);
    });

    // Iterate PageRank
    for (let iter = 0; iter < iterations; iter++) {
      const newRanks = new Map<string, number>();

      nodes.forEach(node => {
        let rank = (1 - damping) / nodes.length;
        const incoming = incomingLinks.get(node.id) || [];

        incoming.forEach(sourceId => {
          const sourceRank = pageRank.get(sourceId) || 0;
          const outgoingCount = outgoingLinkCount.get(sourceId) || 1;
          rank += damping * (sourceRank / outgoingCount);
        });

        newRanks.set(node.id, rank);
      });

      // Update ranks
      newRanks.forEach((rank, nodeId) => {
        pageRank.set(nodeId, rank);
      });
    }

    return pageRank;
  }

  /**
   * Calculate clustering coefficient
   */
  private calculateClusteringCoefficient(
    nodes: ApiGraphNode[],
    relationships: ApiGraphLink[]
  ): Map<string, number> {
    const clustering = new Map<string, number>();
    const adjacencyList = new Map<string, Set<string>>();

    // Build adjacency list
    relationships.forEach(rel => {
      if (!adjacencyList.has(rel.source)) {
        adjacencyList.set(rel.source, new Set());
      }
      if (!adjacencyList.has(rel.target)) {
        adjacencyList.set(rel.target, new Set());
      }
      adjacencyList.get(rel.source)!.add(rel.target);
      adjacencyList.get(rel.target)!.add(rel.source);
    });

    // Calculate clustering for each node
    nodes.forEach(node => {
      const neighbors = adjacencyList.get(node.id) || new Set();
      const k = neighbors.size;

      if (k < 2) {
        clustering.set(node.id, 0);
        return;
      }

      // Count edges between neighbors
      let edgeCount = 0;
      const neighborsArray = Array.from(neighbors);

      for (let i = 0; i < neighborsArray.length; i++) {
        for (let j = i + 1; j < neighborsArray.length; j++) {
          const neighbor1 = adjacencyList.get(neighborsArray[i]);
          if (neighbor1?.has(neighborsArray[j])) {
            edgeCount++;
          }
        }
      }

      const maxPossibleEdges = (k * (k - 1)) / 2;
      clustering.set(node.id, edgeCount / maxPossibleEdges);
    });

    return clustering;
  }

  /**
   * Calculate node complexity based on attributes
   */
  private calculateComplexity(node: ApiGraphNode): number {
    if (node.difficultyLevel) {
      return DIFFICULTY_TO_COMPLEXITY[node.difficultyLevel] || 5;
    }

    // Fallback calculation based on other attributes
    let complexity = 5;

    if (node.hasImplementation) {complexity += 1;}
    if (node.hasInteractiveElements) {complexity += 1;}
    if (node.level && node.level > 2) {complexity += 1;}

    return Math.min(complexity, 10);
  }

  /**
   * Calculate node popularity score
   */
  private calculatePopularity(
    node: ApiGraphNode,
    metrics: { centrality: number; pageRank: number; clustering: number }
  ): number {
    let popularity = 0;

    // View count contribution (0-50)
    if (node.viewCount) {
      popularity += Math.min((node.viewCount / 1000) * 50, 50);
    }

    // Centrality contribution (0-25)
    popularity += metrics.centrality * 25;

    // PageRank contribution (0-25)
    popularity += metrics.pageRank * 25 * 10; // Scale up PageRank

    return Math.min(Math.round(popularity), 100);
  }

  /**
   * Determine if node is a core concept
   */
  private isCoreConcept(
    node: ApiGraphNode,
    metrics: { centrality: number; pageRank: number; clustering: number }
  ): boolean {
    // Core concepts have high centrality and PageRank
    return metrics.centrality > 0.2 || metrics.pageRank > 0.05 || (node.viewCount || 0) > 1000;
  }

  /**
   * Calculate node size based on importance
   */
  private calculateNodeSize(
    node: ApiGraphNode,
    metrics: { centrality: number; pageRank: number; clustering: number }
  ): number {
    const baseSize = 0.5;
    const importanceBonus = (metrics.centrality + metrics.pageRank * 10) * 0.5;
    const viewBonus = Math.min((node.viewCount || 0) / 5000, 0.3);

    return baseSize + importanceBonus + viewBonus;
  }

  /**
   * Map API relationship types to graph edge types
   */
  private mapRelationshipType(
    apiType: string
  ): 'prerequisite' | 'related' | 'advanced' | 'application' {
    switch (apiType) {
      case 'prerequisite':
        return 'prerequisite';
      case 'extends':
        return 'advanced';
      case 'alternative':
        return 'related';
      default:
        return 'application';
    }
  }
}

// Export singleton instance
export const graphDataService = new GraphDataService();
