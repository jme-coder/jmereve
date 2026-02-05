import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';

export function CardEditor() {
  const { gameId, cardId } = useParams<{ gameId: string; cardId?: string }>();
  const navigate = useNavigate();
  const { getGame, addCard, updateCard } = useGameStore();
  const game = getGame(gameId!);
  const isNew = !cardId;
  const existingCard = cardId ? game?.cards.find((c) => c.id === cardId) : undefined;

  const [useCase, setUseCase] = useState('');
  const [answer, setAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [feedback, setFeedback] = useState('');
  const [customValues, setCustomValues] = useState<Record<string, string | number>>({});

  useEffect(() => {
    if (existingCard) {
      setUseCase(existingCard.front.useCase);
      setAnswer(existingCard.back.answer);
      setExplanation(existingCard.back.explanation);
      setFeedback(existingCard.back.feedback);
      setCustomValues(existingCard.front.customFieldValues || {});
    } else if (game?.type === 'truefalse') {
      setAnswer('true');
    } else if (game?.type === 'category' && game.categories.length > 0) {
      setAnswer(game.categories[0].id);
    }
  }, [existingCard, game]);

  if (!game) {
    return <div className="not-found">Jeu non trouvé</div>;
  }

  const handleSave = () => {
    if (!useCase.trim()) return;

    const cardData = {
      front: {
        useCase: useCase.trim(),
        customFieldValues: customValues,
      },
      back: {
        answer,
        explanation: explanation.trim(),
        feedback: feedback.trim(),
      },
    };

    if (isNew) {
      addCard(gameId!, cardData);
    } else {
      updateCard(gameId!, cardId!, cardData);
    }
    navigate(`/game/${gameId}`);
  };

  const updateCustomValue = (fieldId: string, value: string | number) => {
    setCustomValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  return (
    <div className="card-editor">
      <div className="page-header">
        <h1>{isNew ? 'Nouvelle carte' : 'Modifier la carte'}</h1>
      </div>

      <div className="card-editor-layout">
        {/* Front of card */}
        <div className="card-edit-section">
          <h2 className="section-title">
            <span className="section-icon">📋</span> Recto (Question)
          </h2>
          <div className="form-group">
            <label>Cas d'usage / Énoncé</label>
            <textarea
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              placeholder={
                game.type === 'category'
                  ? "Décrivez un cas d'usage que le joueur devra classer dans la bonne catégorie..."
                  : "Décrivez un énoncé que le joueur devra évaluer comme vrai ou faux..."
              }
              rows={4}
              autoFocus
            />
          </div>

          {game.customFields.filter((f) => f.showOnFront).map((field) => (
            <div key={field.id} className="form-group">
              <label>{field.name}</label>
              {field.type === 'text' && (
                <input
                  type="text"
                  value={(customValues[field.id] as string) || ''}
                  onChange={(e) => updateCustomValue(field.id, e.target.value)}
                />
              )}
              {field.type === 'number' && (
                <input
                  type="number"
                  value={(customValues[field.id] as number) || ''}
                  onChange={(e) => updateCustomValue(field.id, Number(e.target.value))}
                />
              )}
              {field.type === 'select' && (
                <select
                  value={(customValues[field.id] as string) || ''}
                  onChange={(e) => updateCustomValue(field.id, e.target.value)}
                >
                  <option value="">-- Choisir --</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
              {field.type === 'rating' && (
                <div className="rating-input">
                  {Array.from({ length: field.maxRating || 5 }, (_, i) => i + 1).map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`rating-star ${(customValues[field.id] as number) >= star ? 'active' : ''}`}
                      onClick={() => updateCustomValue(field.id, star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Back of card */}
        <div className="card-edit-section">
          <h2 className="section-title">
            <span className="section-icon">💡</span> Verso (Réponse)
          </h2>
          <div className="form-group">
            <label>Réponse correcte</label>
            {game.type === 'category' ? (
              <div className="category-selector">
                {game.categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`category-option ${answer === cat.id ? 'active' : ''}`}
                    style={{
                      borderColor: cat.color,
                      backgroundColor: answer === cat.id ? cat.color : 'transparent',
                      color: answer === cat.id ? '#fff' : cat.color,
                    }}
                    onClick={() => setAnswer(cat.id)}
                    type="button"
                  >
                    {cat.name}
                  </button>
                ))}
                {game.categories.length === 0 && (
                  <p className="help-text">
                    Aucune catégorie définie. Ajoutez des catégories dans les paramètres du jeu.
                  </p>
                )}
              </div>
            ) : (
              <div className="truefalse-selector">
                <button
                  className={`tf-option true ${answer === 'true' ? 'active' : ''}`}
                  onClick={() => setAnswer('true')}
                  type="button"
                >
                  ✓ Vrai
                </button>
                <button
                  className={`tf-option false ${answer === 'false' ? 'active' : ''}`}
                  onClick={() => setAnswer('false')}
                  type="button"
                >
                  ✗ Faux
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Explication</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Expliquez pourquoi c'est la bonne réponse..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Feedback / Conseil</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Un conseil ou retour supplémentaire pour le joueur..."
              rows={3}
            />
          </div>

          {game.customFields.filter((f) => f.showOnBack).map((field) => (
            <div key={field.id} className="form-group">
              <label>{field.name}</label>
              {field.type === 'text' && (
                <input
                  type="text"
                  value={(customValues[field.id] as string) || ''}
                  onChange={(e) => updateCustomValue(field.id, e.target.value)}
                />
              )}
              {field.type === 'number' && (
                <input
                  type="number"
                  value={(customValues[field.id] as number) || ''}
                  onChange={(e) => updateCustomValue(field.id, Number(e.target.value))}
                />
              )}
              {field.type === 'select' && (
                <select
                  value={(customValues[field.id] as string) || ''}
                  onChange={(e) => updateCustomValue(field.id, e.target.value)}
                >
                  <option value="">-- Choisir --</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
              {field.type === 'rating' && (
                <div className="rating-input">
                  {Array.from({ length: field.maxRating || 5 }, (_, i) => i + 1).map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`rating-star ${(customValues[field.id] as number) >= star ? 'active' : ''}`}
                      onClick={() => updateCustomValue(field.id, star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="card-preview-section">
        <h2 className="section-title">Aperçu</h2>
        <div className="card-preview-row">
          <div className="preview-card front" style={{ borderTopColor: game.settings.primaryColor }}>
            <div className="preview-card-header">
              <span className="preview-card-label">RECTO</span>
              {game.type === 'category' && <span className="preview-card-type">📊 Catégoriser</span>}
              {game.type === 'truefalse' && <span className="preview-card-type">✓✗ Vrai ou Faux ?</span>}
            </div>
            <div className="preview-card-body">
              <p className="preview-use-case">{useCase || 'Cas d\'usage...'}</p>
            </div>
            <div className="preview-card-footer">
              {game.customFields.filter((f) => f.showOnFront).map((field) => (
                <div key={field.id} className="preview-field">
                  <span className="preview-field-name">{field.name}:</span>
                  <span className="preview-field-value">
                    {field.type === 'rating'
                      ? '★'.repeat(Number(customValues[field.id]) || 0) + '☆'.repeat((field.maxRating || 5) - (Number(customValues[field.id]) || 0))
                      : customValues[field.id] || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="preview-card back" style={{ borderTopColor: game.settings.secondaryColor }}>
            <div className="preview-card-header">
              <span className="preview-card-label">VERSO</span>
            </div>
            <div className="preview-card-body">
              <div className="preview-answer">
                {game.type === 'category' ? (
                  <span
                    className="answer-badge"
                    style={{
                      backgroundColor: game.categories.find((c) => c.id === answer)?.color || '#666',
                    }}
                  >
                    {game.categories.find((c) => c.id === answer)?.name || '—'}
                  </span>
                ) : (
                  <span className={`answer-badge ${answer === 'true' ? 'true' : 'false'}`}>
                    {answer === 'true' ? '✓ VRAI' : '✗ FAUX'}
                  </span>
                )}
              </div>
              {explanation && (
                <div className="preview-explanation">
                  <strong>Explication:</strong>
                  <p>{explanation}</p>
                </div>
              )}
              {feedback && (
                <div className="preview-feedback">
                  <strong>Feedback:</strong>
                  <p>{feedback}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={() => navigate(`/game/${gameId}`)}>
          Annuler
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!useCase.trim()}>
          {isNew ? 'Ajouter la carte' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
