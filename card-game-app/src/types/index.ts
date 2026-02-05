export type GameType = 'category' | 'truefalse';

export type FieldType = 'text' | 'number' | 'select' | 'rating';

export interface CustomField {
  id: string;
  name: string;
  type: FieldType;
  options?: string[]; // For select type
  maxRating?: number; // For rating type (e.g., 1-5)
  showOnFront: boolean;
  showOnBack: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface CardFront {
  useCase: string;
  customFieldValues: Record<string, string | number>;
}

export interface CardBack {
  answer: string; // Category ID for 'category' type, 'true'/'false' for 'truefalse' type
  explanation: string;
  feedback: string;
}

export interface Card {
  id: string;
  front: CardFront;
  back: CardBack;
  order: number;
}

export interface GameSettings {
  cardWidth: number; // in mm
  cardHeight: number; // in mm
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  type: GameType;
  categories: Category[];
  customFields: CustomField[];
  cards: Card[];
  settings: GameSettings;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_SETTINGS: GameSettings = {
  cardWidth: 63.5,
  cardHeight: 88.9,
  primaryColor: '#2563eb',
  secondaryColor: '#f59e0b',
  fontFamily: 'Helvetica',
};

export const DEFAULT_AI_ACT_CATEGORIES: Category[] = [
  { id: 'minimal', name: 'Risque Minimal', color: '#22c55e', description: 'Systèmes d\'IA à risque minimal ou nul' },
  { id: 'limited', name: 'Risque Limité', color: '#eab308', description: 'Systèmes d\'IA avec obligations de transparence' },
  { id: 'high', name: 'Risque Élevé', color: '#f97316', description: 'Systèmes d\'IA soumis à des exigences strictes' },
  { id: 'unacceptable', name: 'Risque Inacceptable', color: '#ef4444', description: 'Systèmes d\'IA interdits' },
];
