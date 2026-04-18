import { formatTime } from '../utils/timeFormat.js';

export default function ResultScreen({ result, onRestart, onHome }) {
  const completed = result.reason === 'completed';

  return (
    <main className="result-screen">
      <div className="result-content">
        <p className="eyebrow">{completed ? 'Challenge terminé' : 'Challenge stoppé'}</p>
        <h1>{completed ? 'Objectif atteint' : 'Resultat'}</h1>

        <div className="result-grid">
          <div className="result-metric">
            <span>Objectif</span>
            <strong>{result.goal}</strong>
          </div>
          <div className="result-metric">
            <span>Pompes réalisées</span>
            <strong>{result.pushups}</strong>
          </div>
          <div className="result-metric wide">
            <span>Temps final</span>
            <strong>{formatTime(result.timeMs)}</strong>
          </div>
        </div>

        <div className="result-actions">
          <button className="primary-button" type="button" onClick={onRestart}>
            Recommencer
          </button>
          <button className="secondary-button" type="button" onClick={onHome}>
            Accueil
          </button>
        </div>
      </div>
    </main>
  );
}
