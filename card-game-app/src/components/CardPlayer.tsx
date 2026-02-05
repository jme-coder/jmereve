import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';

type PlayerMode = 'sequential' | 'random';

export function CardPlayer() {
  const { gameId } = useParams<{ gameId: string }>();
  const { getGame } = useGameStore();
  const game = getGame(gameId!);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [mode, setMode] = useState<PlayerMode>('sequential');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  const shuffledCards = useMemo(() => {
    if (!game) return [];
    const cards = [...game.cards];
    if (mode === 'random') {
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
    }
    return cards;
  }, [game, mode, gameStarted]); // Re-shuffle on new game start

  if (!game) {
    return (
      <div className="not-found">
        <h2>Jeu non trouvé</h2>
        <Link to="/">Retour</Link>
      </div>
    );
  }

  if (game.cards.length === 0) {
    return (
      <div className="not-found">
        <h2>Aucune carte dans ce jeu</h2>
        <Link to={`/game/${gameId}`}>Ajouter des cartes</Link>
      </div>
    );
  }

  const currentCard = shuffledCards[currentIndex];

  const handleAnswer = (answer: string) => {
    if (hasAnswered) return;
    setSelectedAnswer(answer);
    setHasAnswered(true);
    setIsFlipped(true);

    if (answer === currentCard.back.answer) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }
  };

  const nextCard = () => {
    if (currentIndex + 1 >= shuffledCards.length) {
      setGameFinished(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setIsFlipped(false);
    setSelectedAnswer(null);
    setHasAnswered(false);
  };

  const restartGame = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setScore({ correct: 0, incorrect: 0 });
    setGameFinished(false);
    setGameStarted((prev) => !prev); // Toggle to re-shuffle
  };

  if (gameFinished) {
    const total = score.correct + score.incorrect;
    const percentage = Math.round((score.correct / total) * 100);
    return (
      <div className="player-finished">
        <div className="finished-card">
          <h1>Partie terminée !</h1>
          <div className="score-display">
            <div className="score-circle" style={{ '--percentage': `${percentage}%` } as React.CSSProperties}>
              <span className="score-number">{percentage}%</span>
            </div>
          </div>
          <div className="score-details">
            <div className="score-stat correct">
              <span className="stat-number">{score.correct}</span>
              <span className="stat-label">Correctes</span>
            </div>
            <div className="score-stat incorrect">
              <span className="stat-number">{score.incorrect}</span>
              <span className="stat-label">Incorrectes</span>
            </div>
            <div className="score-stat total">
              <span className="stat-number">{total}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
          <div className="finished-actions">
            <button className="btn btn-primary" onClick={restartGame}>
              Rejouer
            </button>
            <Link to={`/game/${gameId}`} className="btn btn-secondary">
              Retour au jeu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-player">
      <div className="player-header">
        <div className="player-progress">
          <span>
            Carte {currentIndex + 1} / {shuffledCards.length}
          </span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentIndex + 1) / shuffledCards.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="player-score">
          <span className="score-correct">✓ {score.correct}</span>
          <span className="score-incorrect">✗ {score.incorrect}</span>
        </div>
        <div className="player-controls">
          <select value={mode} onChange={(e) => { setMode(e.target.value as PlayerMode); restartGame(); }}>
            <option value="sequential">Séquentiel</option>
            <option value="random">Aléatoire</option>
          </select>
        </div>
      </div>

      <div className="player-card-area">
        <div className={`player-card-container ${isFlipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="player-card player-card-front" style={{ borderTopColor: game.settings.primaryColor }}>
            <div className="player-card-type">
              {game.type === 'category' ? '📊 Classez ce cas d\'usage' : '✓✗ Vrai ou Faux ?'}
            </div>
            <div className="player-card-content">
              <p className="player-use-case">{currentCard.front.useCase}</p>
            </div>
            <div className="player-card-meta">
              {game.customFields
                .filter((f) => f.showOnFront)
                .map((field) => {
                  const val = currentCard.front.customFieldValues[field.id];
                  if (!val) return null;
                  return (
                    <div key={field.id} className="meta-item">
                      <span className="meta-label">{field.name}:</span>
                      <span className="meta-value">
                        {field.type === 'rating'
                          ? '★'.repeat(Number(val)) + '☆'.repeat((field.maxRating || 5) - Number(val))
                          : val}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Back */}
          <div className="player-card player-card-back" style={{ borderTopColor: game.settings.secondaryColor }}>
            <div className="player-card-answer">
              {game.type === 'category' ? (
                <span
                  className="answer-badge large"
                  style={{
                    backgroundColor: game.categories.find((c) => c.id === currentCard.back.answer)?.color || '#666',
                  }}
                >
                  {game.categories.find((c) => c.id === currentCard.back.answer)?.name || currentCard.back.answer}
                </span>
              ) : (
                <span className={`answer-badge large ${currentCard.back.answer === 'true' ? 'true' : 'false'}`}>
                  {currentCard.back.answer === 'true' ? '✓ VRAI' : '✗ FAUX'}
                </span>
              )}
            </div>
            {selectedAnswer && (
              <div className={`player-result ${selectedAnswer === currentCard.back.answer ? 'correct' : 'incorrect'}`}>
                {selectedAnswer === currentCard.back.answer
                  ? 'Bonne réponse !'
                  : 'Mauvaise réponse'}
              </div>
            )}
            {currentCard.back.explanation && (
              <div className="player-explanation">
                <strong>Explication :</strong>
                <p>{currentCard.back.explanation}</p>
              </div>
            )}
            {currentCard.back.feedback && (
              <div className="player-feedback">
                <strong>Feedback :</strong>
                <p>{currentCard.back.feedback}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Answer buttons */}
      <div className="player-answers">
        {!hasAnswered ? (
          game.type === 'category' ? (
            <div className="answer-buttons category-answers">
              {game.categories.map((cat) => (
                <button
                  key={cat.id}
                  className="btn answer-btn"
                  style={{ borderColor: cat.color, color: cat.color }}
                  onClick={() => handleAnswer(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="answer-buttons tf-answers">
              <button className="btn answer-btn true-btn" onClick={() => handleAnswer('true')}>
                ✓ Vrai
              </button>
              <button className="btn answer-btn false-btn" onClick={() => handleAnswer('false')}>
                ✗ Faux
              </button>
            </div>
          )
        ) : (
          <div className="answer-buttons">
            <button className="btn btn-primary next-btn" onClick={nextCard}>
              {currentIndex + 1 >= shuffledCards.length ? 'Voir les résultats' : 'Carte suivante →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
