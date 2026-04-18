import BottomNav from './BottomNav.jsx';
import TopBar from './TopBar.jsx';

export default function ResultScreen({ result, onRestart, onHome }) {
  const completed = result.reason === 'completed';
  const opponentTimeMs = Math.max(result.timeMs + 3700, result.timeMs * 1.16);
  const deltaSeconds = Math.max(0, (opponentTimeMs - result.timeMs) / 1000).toFixed(1);

  return (
    <main className="screen result-screen">
      <TopBar compact />

      <section className="victory-hero">
        <p>{completed ? 'Challenge terminé' : 'Challenge stoppé'}</p>
        <h1>{completed ? 'Victoire' : 'Résultat'}</h1>
      </section>

      <section className="time-comparison">
        <article className="your-time">
          <div>
            <span>Votre temps</span>
            <strong>
              {formatSeconds(result.timeMs)}
              <small>s</small>
            </strong>
          </div>
          <span className="material-symbols-outlined filled">electric_bolt</span>
        </article>
        <article className="opponent-time">
          <div>
            <span>Adversaire</span>
            <strong>
              {formatSeconds(opponentTimeMs)}
              <small>s</small>
            </strong>
          </div>
          <em>-{deltaSeconds}s</em>
        </article>
      </section>

      <section className="reward-card">
        <h2>Récompenses acquises</h2>
        <div className="reward-grid">
          <div>
            <span className="material-symbols-outlined filled">star</span>
            <strong>+25 XP</strong>
          </div>
          <i />
          <div>
            <span className="material-symbols-outlined filled">monetization_on</span>
            <strong>+10 COINS</strong>
          </div>
        </div>
        <div className="level-row">
          <span>Prochain niveau</span>
          <strong>1,275 / 1,500 XP</strong>
        </div>
        <div className="level-track">
          <div />
        </div>
      </section>

      <section className="result-summary">
        <article>
          <span>Objectif</span>
          <strong>{result.goal}</strong>
        </article>
        <article>
          <span>Pompes</span>
          <strong>{result.pushups}</strong>
        </article>
      </section>

      <section className="result-actions">
        <button className="secondary-button" type="button" onClick={onHome}>
          Accueil
        </button>
        <button className="primary-button" type="button" onClick={onRestart}>
          Rejouer
        </button>
      </section>

      <BottomNav />
    </main>
  );
}

function formatSeconds(milliseconds) {
  return (Math.max(0, milliseconds) / 1000).toFixed(1);
}
