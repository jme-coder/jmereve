import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { generatePdf } from '../utils/pdfGenerator';

export function PdfExport() {
  const { gameId } = useParams<{ gameId: string }>();
  const { getGame } = useGameStore();
  const game = getGame(gameId!);
  const [generating, setGenerating] = useState(false);
  const [includeBackCards, setIncludeBackCards] = useState(true);
  const [includeCutMarks, setIncludeCutMarks] = useState(true);
  const [cardsPerRow, setCardsPerRow] = useState(3);
  const [pageMargin, setPageMargin] = useState(10);

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
        <h2>Aucune carte à exporter</h2>
        <Link to={`/game/${gameId}`}>Ajouter des cartes</Link>
      </div>
    );
  }

  const handleExport = async () => {
    setGenerating(true);
    try {
      await generatePdf(game, {
        includeBackCards,
        includeCutMarks,
        cardsPerRow,
        pageMargin,
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setGenerating(false);
    }
  };

  // Calculate layout preview
  const cardW = game.settings.cardWidth;
  const cardH = game.settings.cardHeight;
  const pageW = 210; // A4 width in mm
  const pageH = 297; // A4 height in mm
  const availW = pageW - 2 * pageMargin;
  const availH = pageH - 2 * pageMargin;
  const actualCardsPerRow = Math.min(cardsPerRow, Math.floor(availW / cardW));
  const cardsPerCol = Math.floor(availH / cardH);
  const cardsPerPage = actualCardsPerRow * cardsPerCol;
  const totalPages = Math.ceil(game.cards.length / cardsPerPage) * (includeBackCards ? 2 : 1);

  return (
    <div className="pdf-export">
      <div className="page-header">
        <h1>Exporter en PDF</h1>
        <p className="subtitle">{game.name} - {game.cards.length} carte{game.cards.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="export-layout">
        <div className="export-options">
          <h2>Options d'export</h2>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeBackCards}
                onChange={(e) => setIncludeBackCards(e.target.checked)}
              />
              Inclure les versos (impression recto-verso)
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeCutMarks}
                onChange={(e) => setIncludeCutMarks(e.target.checked)}
              />
              Inclure les repères de découpe
            </label>
          </div>

          <div className="form-group">
            <label>Cartes par ligne</label>
            <input
              type="number"
              value={cardsPerRow}
              onChange={(e) => setCardsPerRow(Math.max(1, Math.min(5, Number(e.target.value))))}
              min={1}
              max={5}
            />
          </div>

          <div className="form-group">
            <label>Marge de page (mm)</label>
            <input
              type="number"
              value={pageMargin}
              onChange={(e) => setPageMargin(Math.max(5, Math.min(30, Number(e.target.value))))}
              min={5}
              max={30}
            />
          </div>

          <div className="export-summary">
            <h3>Résumé</h3>
            <ul>
              <li>Taille des cartes : {cardW} × {cardH} mm</li>
              <li>Cartes par ligne : {actualCardsPerRow}</li>
              <li>Cartes par colonne : {cardsPerCol}</li>
              <li>Cartes par page : {cardsPerPage}</li>
              <li>Nombre de pages : {totalPages}</li>
              <li>Format : A4 (210 × 297 mm)</li>
            </ul>
          </div>

          <button className="btn btn-primary btn-large" onClick={handleExport} disabled={generating}>
            {generating ? 'Génération en cours...' : '📄 Générer le PDF'}
          </button>
        </div>

        <div className="export-preview">
          <h2>Aperçu de la mise en page</h2>
          <div className="page-preview" style={{ aspectRatio: '210/297' }}>
            <div
              className="page-preview-inner"
              style={{
                padding: `${(pageMargin / 297) * 100}% ${(pageMargin / 210) * 100}%`,
              }}
            >
              {Array.from({ length: Math.min(cardsPerPage, game.cards.length) }).map((_, i) => (
                <div
                  key={i}
                  className="preview-mini-card"
                  style={{
                    width: `${(cardW / availW) * 100}%`,
                    aspectRatio: `${cardW}/${cardH}`,
                    borderColor: game.settings.primaryColor,
                  }}
                >
                  <span className="mini-card-number">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="preview-label">Page 1 - Rectos</p>
          {includeBackCards && (
            <>
              <div className="page-preview back" style={{ aspectRatio: '210/297' }}>
                <div
                  className="page-preview-inner"
                  style={{
                    padding: `${(pageMargin / 297) * 100}% ${(pageMargin / 210) * 100}%`,
                  }}
                >
                  {Array.from({ length: Math.min(cardsPerPage, game.cards.length) }).map((_, i) => (
                    <div
                      key={i}
                      className="preview-mini-card back"
                      style={{
                        width: `${(cardW / availW) * 100}%`,
                        aspectRatio: `${cardW}/${cardH}`,
                        borderColor: game.settings.secondaryColor,
                      }}
                    >
                      <span className="mini-card-number">{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="preview-label">Page 2 - Versos (mirroir horizontal)</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
