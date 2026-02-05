import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import type { GameType, Category } from '../types';
import { DEFAULT_AI_ACT_CATEGORIES } from '../types';

export function GameList() {
  const { games, createGame, deleteGame, duplicateGame } = useGameStore();
  const navigate = useNavigate();
  const [showNewGame, setShowNewGame] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<GameType>('category');
  const [useAiActDefaults, setUseAiActDefaults] = useState(true);

  const handleCreate = () => {
    if (!newName.trim()) return;
    let categories: Category[] = [];
    if (newType === 'category' && useAiActDefaults) {
      categories = DEFAULT_AI_ACT_CATEGORIES;
    }
    const game = createGame(newName.trim(), newDescription.trim(), newType, categories);
    setShowNewGame(false);
    setNewName('');
    setNewDescription('');
    navigate(`/game/${game.id}`);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Supprimer le jeu "${name}" ? Cette action est irréversible.`)) {
      deleteGame(id);
    }
  };

  return (
    <div className="game-list">
      <div className="page-header">
        <div>
          <h1>Mes Jeux de Cartes</h1>
          <p className="subtitle">Créez et gérez vos jeux de cartes éducatifs</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewGame(true)}>
          + Nouveau Jeu
        </button>
      </div>

      {showNewGame && (
        <div className="modal-overlay" onClick={() => setShowNewGame(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Créer un nouveau jeu</h2>
            <div className="form-group">
              <label>Nom du jeu</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: AI Act - Niveaux de risque"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Décrivez le but de ce jeu de cartes..."
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Type de jeu</label>
              <div className="type-selector">
                <button
                  className={`type-option ${newType === 'category' ? 'active' : ''}`}
                  onClick={() => setNewType('category')}
                >
                  <span className="type-icon">📊</span>
                  <span className="type-label">Catégories</span>
                  <span className="type-desc">Classer des cas d'usage dans des catégories</span>
                </button>
                <button
                  className={`type-option ${newType === 'truefalse' ? 'active' : ''}`}
                  onClick={() => setNewType('truefalse')}
                >
                  <span className="type-icon">✓✗</span>
                  <span className="type-label">Vrai / Faux</span>
                  <span className="type-desc">Déterminer si un énoncé est vrai ou faux</span>
                </button>
              </div>
            </div>
            {newType === 'category' && (
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={useAiActDefaults}
                    onChange={(e) => setUseAiActDefaults(e.target.checked)}
                  />
                  Utiliser les 4 catégories de risque de l'AI Act
                </label>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowNewGame(false)}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!newName.trim()}>
                Créer le jeu
              </button>
            </div>
          </div>
        </div>
      )}

      {games.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🃏</div>
          <h2>Aucun jeu de cartes</h2>
          <p>Commencez par créer votre premier jeu de cartes éducatif.</p>
          <button className="btn btn-primary" onClick={() => setShowNewGame(true)}>
            Créer mon premier jeu
          </button>
        </div>
      ) : (
        <div className="game-grid">
          {games.map((game) => (
            <div key={game.id} className="game-card" onClick={() => navigate(`/game/${game.id}`)}>
              <div className="game-card-header" style={{ borderTopColor: game.settings.primaryColor }}>
                <span className="game-type-badge">
                  {game.type === 'category' ? '📊 Catégories' : '✓✗ Vrai/Faux'}
                </span>
                <h3>{game.name}</h3>
                {game.description && <p className="game-description">{game.description}</p>}
              </div>
              <div className="game-card-stats">
                <span>{game.cards.length} carte{game.cards.length !== 1 ? 's' : ''}</span>
                {game.type === 'category' && (
                  <span>{game.categories.length} catégorie{game.categories.length !== 1 ? 's' : ''}</span>
                )}
              </div>
              <div className="game-card-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => navigate(`/game/${game.id}/play`)}
                  disabled={game.cards.length === 0}
                  title={game.cards.length === 0 ? 'Ajoutez des cartes pour jouer' : 'Jouer'}
                >
                  ▶ Jouer
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => navigate(`/game/${game.id}/export`)}
                  disabled={game.cards.length === 0}
                  title={game.cards.length === 0 ? 'Ajoutez des cartes pour exporter' : 'Exporter en PDF'}
                >
                  📄 PDF
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => duplicateGame(game.id)}
                  title="Dupliquer"
                >
                  📋
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(game.id, game.name)}
                  title="Supprimer"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
