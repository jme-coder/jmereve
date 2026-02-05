import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Game, Card, Category, CustomField, GameType, GameSettings } from '../types';

interface GameStore {
  games: Game[];

  // Game CRUD
  createGame: (name: string, description: string, type: GameType, categories?: Category[], settings?: Partial<GameSettings>) => Game;
  updateGame: (id: string, updates: Partial<Omit<Game, 'id' | 'createdAt'>>) => void;
  deleteGame: (id: string) => void;
  getGame: (id: string) => Game | undefined;
  duplicateGame: (id: string) => Game | undefined;

  // Card CRUD
  addCard: (gameId: string, card: Omit<Card, 'id' | 'order'>) => void;
  updateCard: (gameId: string, cardId: string, updates: Partial<Omit<Card, 'id'>>) => void;
  deleteCard: (gameId: string, cardId: string) => void;
  reorderCards: (gameId: string, cardIds: string[]) => void;

  // Category management
  addCategory: (gameId: string, category: Omit<Category, 'id'>) => void;
  updateCategory: (gameId: string, categoryId: string, updates: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (gameId: string, categoryId: string) => void;

  // Custom fields management
  addCustomField: (gameId: string, field: Omit<CustomField, 'id'>) => void;
  updateCustomField: (gameId: string, fieldId: string, updates: Partial<Omit<CustomField, 'id'>>) => void;
  deleteCustomField: (gameId: string, fieldId: string) => void;
}

const defaultSettings: GameSettings = {
  cardWidth: 63.5,
  cardHeight: 88.9,
  primaryColor: '#2563eb',
  secondaryColor: '#f59e0b',
  fontFamily: 'Helvetica',
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      games: [],

      createGame: (name, description, type, categories = [], settings = {}) => {
        const game: Game = {
          id: uuidv4(),
          name,
          description,
          type,
          categories,
          customFields: [],
          cards: [],
          settings: { ...defaultSettings, ...settings },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ games: [...state.games, game] }));
        return game;
      },

      updateGame: (id, updates) => {
        set((state) => ({
          games: state.games.map((g) =>
            g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
          ),
        }));
      },

      deleteGame: (id) => {
        set((state) => ({ games: state.games.filter((g) => g.id !== id) }));
      },

      getGame: (id) => {
        return get().games.find((g) => g.id === id);
      },

      duplicateGame: (id) => {
        const original = get().getGame(id);
        if (!original) return undefined;
        const newGame: Game = {
          ...JSON.parse(JSON.stringify(original)),
          id: uuidv4(),
          name: `${original.name} (copie)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        // Regenerate card IDs
        newGame.cards = newGame.cards.map((c: Card) => ({ ...c, id: uuidv4() }));
        set((state) => ({ games: [...state.games, newGame] }));
        return newGame;
      },

      addCard: (gameId, card) => {
        set((state) => ({
          games: state.games.map((g) => {
            if (g.id !== gameId) return g;
            const newCard: Card = {
              ...card,
              id: uuidv4(),
              order: g.cards.length,
            };
            return { ...g, cards: [...g.cards, newCard], updatedAt: new Date().toISOString() };
          }),
        }));
      },

      updateCard: (gameId, cardId, updates) => {
        set((state) => ({
          games: state.games.map((g) => {
            if (g.id !== gameId) return g;
            return {
              ...g,
              cards: g.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      deleteCard: (gameId, cardId) => {
        set((state) => ({
          games: state.games.map((g) => {
            if (g.id !== gameId) return g;
            return {
              ...g,
              cards: g.cards.filter((c) => c.id !== cardId).map((c, i) => ({ ...c, order: i })),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      reorderCards: (gameId, cardIds) => {
        set((state) => ({
          games: state.games.map((g) => {
            if (g.id !== gameId) return g;
            const reordered = cardIds.map((id, index) => {
              const card = g.cards.find((c) => c.id === id);
              return card ? { ...card, order: index } : null;
            }).filter(Boolean) as Card[];
            return { ...g, cards: reordered, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      addCategory: (gameId, category) => {
        set((state) => ({
          games: state.games.map((g) => {
            if (g.id !== gameId) return g;
            return {
              ...g,
              categories: [...g.categories, { ...category, id: uuidv4() }],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      updateCategory: (gameId, categoryId, updates) => {
        set((state) => ({
          games: state.games.map((g) => {
            if (g.id !== gameId) return g;
            return {
              ...g,
              categories: g.categories.map((c) => (c.id === categoryId ? { ...c, ...updates } : c)),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      deleteCategory: (gameId, categoryId) => {
        set((state) => ({
          games: state.games.map((g) => {
            if (g.id !== gameId) return g;
            return {
              ...g,
              categories: g.categories.filter((c) => c.id !== categoryId),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      addCustomField: (gameId, field) => {
        set((state) => ({
          games: state.games.map((g) => {
            if (g.id !== gameId) return g;
            return {
              ...g,
              customFields: [...g.customFields, { ...field, id: uuidv4() }],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      updateCustomField: (gameId, fieldId, updates) => {
        set((state) => ({
          games: state.games.map((g) => {
            if (g.id !== gameId) return g;
            return {
              ...g,
              customFields: g.customFields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      deleteCustomField: (gameId, fieldId) => {
        set((state) => ({
          games: state.games.map((g) => {
            if (g.id !== gameId) return g;
            return {
              ...g,
              customFields: g.customFields.filter((f) => f.id !== fieldId),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },
    }),
    {
      name: 'card-game-creator-storage',
    }
  )
);
