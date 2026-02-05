import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import type { FieldType } from '../types';

export function GameEditor() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { getGame, updateGame, addCategory, deleteCategory, addCustomField, deleteCustomField, deleteCard } = useGameStore();
  const game = getGame(gameId!);

  const [activeTab, setActiveTab] = useState<'cards' | 'categories' | 'fields' | 'settings'>('cards');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Custom field form
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldShowFront, setNewFieldShowFront] = useState(true);
  const [newFieldShowBack, setNewFieldShowBack] = useState(false);
  const [newFieldMaxRating, setNewFieldMaxRating] = useState(5);

  if (!game) {
    return (
      <div className="not-found">
        <h2>Jeu non trouvé</h2>
        <Link to="/">Retour à la liste</Link>
      </div>
    );
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory(gameId!, { name: newCatName.trim(), color: newCatColor, description: newCatDesc.trim() });
    setNewCatName('');
    setNewCatColor('#3b82f6');
    setNewCatDesc('');
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    addCustomField(gameId!, {
      name: newFieldName.trim(),
      type: newFieldType,
      options: newFieldType === 'select' ? newFieldOptions.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
      maxRating: newFieldType === 'rating' ? newFieldMaxRating : undefined,
      showOnFront: newFieldShowFront,
      showOnBack: newFieldShowBack,
    });
    setNewFieldName('');
    setNewFieldType('text');
    setNewFieldOptions('');
    setNewFieldShowFront(true);
    setNewFieldShowBack(false);
  };

  const startEditName = () => {
    setTempName(game.name);
    setEditingName(true);
  };

  const saveName = () => {
    if (tempName.trim()) {
      updateGame(gameId!, { name: tempName.trim() });
    }
    setEditingName(false);
  };

  const getCategoryName = (categoryId: string) => {
    return game.categories.find((c) => c.id === categoryId)?.name ?? categoryId;
  };

  return (
    <div className="game-editor">
      <div className="page-header">
        <div>
          {editingName ? (
            <div className="inline-edit">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                autoFocus
              />
            </div>
          ) : (
            <h1 onClick={startEditName} className="editable-title" title="Cliquer pour modifier">
              {game.name}
            </h1>
          )}
          <p className="subtitle">
            {game.type === 'category' ? '📊 Jeu de catégories' : '✓✗ Vrai ou Faux'}
            {' · '}
            {game.cards.length} carte{game.cards.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/game/${gameId}/play`)}
            disabled={game.cards.length === 0}
          >
            ▶ Jouer
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/game/${gameId}/export`)}
            disabled={game.cards.length === 0}
          >
            📄 Exporter PDF
          </button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'cards' ? 'active' : ''}`} onClick={() => setActiveTab('cards')}>
          Cartes ({game.cards.length})
        </button>
        {game.type === 'category' && (
          <button className={`tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
            Catégories ({game.categories.length})
          </button>
        )}
        <button className={`tab ${activeTab === 'fields' ? 'active' : ''}`} onClick={() => setActiveTab('fields')}>
          Champs ({game.customFields.length})
        </button>
        <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          Paramètres
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'cards' && (
          <div className="cards-tab">
            <button className="btn btn-primary" onClick={() => navigate(`/game/${gameId}/card/new`)}>
              + Ajouter une carte
            </button>
            {game.cards.length === 0 ? (
              <div className="empty-state small">
                <p>Aucune carte. Commencez par en ajouter une.</p>
              </div>
            ) : (
              <div className="card-list">
                {game.cards
                  .sort((a, b) => a.order - b.order)
                  .map((card, index) => (
                    <div key={card.id} className="card-list-item">
                      <span className="card-number">#{index + 1}</span>
                      <div className="card-list-content">
                        <p className="card-use-case">{card.front.useCase}</p>
                        <span className="card-answer">
                          {game.type === 'category'
                            ? getCategoryName(card.back.answer)
                            : card.back.answer === 'true'
                              ? '✓ Vrai'
                              : '✗ Faux'}
                        </span>
                      </div>
                      <div className="card-list-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => navigate(`/game/${gameId}/card/${card.id}`)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            if (window.confirm('Supprimer cette carte ?')) {
                              deleteCard(gameId!, card.id);
                            }
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && game.type === 'category' && (
          <div className="categories-tab">
            <div className="add-form">
              <h3>Ajouter une catégorie</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ex: Risque Élevé"
                  />
                </div>
                <div className="form-group" style={{ maxWidth: '100px' }}>
                  <label>Couleur</label>
                  <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Description de la catégorie"
                />
              </div>
              <button className="btn btn-primary" onClick={handleAddCategory} disabled={!newCatName.trim()}>
                Ajouter
              </button>
            </div>

            {game.categories.length === 0 ? (
              <div className="empty-state small">
                <p>Aucune catégorie définie.</p>
              </div>
            ) : (
              <div className="category-list">
                {game.categories.map((cat) => (
                  <div key={cat.id} className="category-item">
                    <div className="category-color" style={{ backgroundColor: cat.color }} />
                    <div className="category-info">
                      <strong>{cat.name}</strong>
                      {cat.description && <span>{cat.description}</span>}
                    </div>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm(`Supprimer la catégorie "${cat.name}" ?`)) {
                          deleteCategory(gameId!, cat.id);
                        }
                      }}
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'fields' && (
          <div className="fields-tab">
            <div className="add-form">
              <h3>Ajouter un champ personnalisé</h3>
              <p className="help-text">
                Les champs personnalisés vous permettent d'ajouter des métadonnées à vos cartes
                (ex: niveau de difficulté, niveau de certitude, source, etc.)
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom du champ</label>
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Ex: Difficulté"
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as FieldType)}>
                    <option value="text">Texte</option>
                    <option value="number">Nombre</option>
                    <option value="select">Liste de choix</option>
                    <option value="rating">Notation (étoiles)</option>
                  </select>
                </div>
              </div>
              {newFieldType === 'select' && (
                <div className="form-group">
                  <label>Options (séparées par des virgules)</label>
                  <input
                    type="text"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    placeholder="Ex: Facile, Moyen, Difficile"
                  />
                </div>
              )}
              {newFieldType === 'rating' && (
                <div className="form-group">
                  <label>Notation maximale</label>
                  <input
                    type="number"
                    value={newFieldMaxRating}
                    onChange={(e) => setNewFieldMaxRating(Number(e.target.value))}
                    min={2}
                    max={10}
                  />
                </div>
              )}
              <div className="form-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newFieldShowFront}
                    onChange={(e) => setNewFieldShowFront(e.target.checked)}
                  />
                  Afficher au recto
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newFieldShowBack}
                    onChange={(e) => setNewFieldShowBack(e.target.checked)}
                  />
                  Afficher au verso
                </label>
              </div>
              <button className="btn btn-primary" onClick={handleAddField} disabled={!newFieldName.trim()}>
                Ajouter
              </button>
            </div>

            {game.customFields.length === 0 ? (
              <div className="empty-state small">
                <p>Aucun champ personnalisé. Ajoutez-en pour enrichir vos cartes.</p>
              </div>
            ) : (
              <div className="field-list">
                {game.customFields.map((field) => (
                  <div key={field.id} className="field-item">
                    <div className="field-info">
                      <strong>{field.name}</strong>
                      <span className="field-type-badge">{field.type}</span>
                      {field.options && <span className="field-options">{field.options.join(', ')}</span>}
                      <div className="field-visibility">
                        {field.showOnFront && <span className="badge">Recto</span>}
                        {field.showOnBack && <span className="badge">Verso</span>}
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm(`Supprimer le champ "${field.name}" ?`)) {
                          deleteCustomField(gameId!, field.id);
                        }
                      }}
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <div className="form-group">
              <label>Nom du jeu</label>
              <input
                type="text"
                value={game.name}
                onChange={(e) => updateGame(gameId!, { name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={game.description}
                onChange={(e) => updateGame(gameId!, { description: e.target.value })}
                rows={3}
              />
            </div>
            <h3>Dimensions des cartes (mm)</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Largeur</label>
                <input
                  type="number"
                  value={game.settings.cardWidth}
                  onChange={(e) =>
                    updateGame(gameId!, { settings: { ...game.settings, cardWidth: Number(e.target.value) } })
                  }
                  min={40}
                  max={120}
                />
              </div>
              <div className="form-group">
                <label>Hauteur</label>
                <input
                  type="number"
                  value={game.settings.cardHeight}
                  onChange={(e) =>
                    updateGame(gameId!, { settings: { ...game.settings, cardHeight: Number(e.target.value) } })
                  }
                  min={50}
                  max={150}
                />
              </div>
            </div>
            <h3>Couleurs</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Couleur principale</label>
                <input
                  type="color"
                  value={game.settings.primaryColor}
                  onChange={(e) =>
                    updateGame(gameId!, { settings: { ...game.settings, primaryColor: e.target.value } })
                  }
                />
              </div>
              <div className="form-group">
                <label>Couleur secondaire</label>
                <input
                  type="color"
                  value={game.settings.secondaryColor}
                  onChange={(e) =>
                    updateGame(gameId!, { settings: { ...game.settings, secondaryColor: e.target.value } })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
