/**
 * Mock data generators for development and testing
 */

import type { Term, TermSection, InteractiveElement } from '../types/storage.types';

export function createMockTerm(data: Partial<Term> = {}): Term {
  const id = data.id || crypto.randomUUID();
  return {
    id,
    name: data.name || 'Mock Term',
    definition: data.definition || 'Mock definition',
    category: data.category || 'general',
    viewCount: data.viewCount || 0,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    ...data,
  };
}

export function createMockTermSection(data: Partial<TermSection> = {}): TermSection {
  return {
    id: data.id || crypto.randomUUID(),
    termId: data.termId || crypto.randomUUID(),
    sectionId: data.sectionId || crypto.randomUUID(),
    title: data.title || 'Mock Section',
    content: data.content || 'Mock content',
    order: data.order || 0,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    ...data,
  };
}

export function createMockInteractiveElement(data: Partial<InteractiveElement> = {}): InteractiveElement {
  return {
    id: data.id || crypto.randomUUID(),
    termId: data.termId || crypto.randomUUID(),
    type: data.type || 'quiz',
    config: data.config || {
      title: 'Mock Interactive Element',
      description: 'Mock interactive element for testing',
      data: {}
    },
    userStates: data.userStates
  };
}