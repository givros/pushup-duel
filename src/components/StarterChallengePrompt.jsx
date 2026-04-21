import Icon from './Icon.jsx';

export default function StarterChallengePrompt({ profile, onStart }) {
  return (
    <main className="screen starter-screen">
      <section className="starter-backdrop" aria-hidden="true">
        <div className="starter-pulse" />
      </section>

      <section className="starter-popup" role="dialog" aria-modal="true" aria-labelledby="starter-title">
        <div className="starter-icon" aria-hidden="true">
          <Icon name="bolt" className="filled" />
        </div>

        <div className="starter-copy">
          <span className="onboarding-kicker">Défi d’entrée</span>
          <h1 id="starter-title">Avant l’arène</h1>
          <p>
            Bienvenue {profile?.nickname || 'athlète'}. Pour calibrer ton profil, tu dois réaliser ton premier défi :
            faire le maximum de pompes en 1 minute.
          </p>
        </div>

        <div className="starter-rules">
          <article>
            <Icon name="timer" className="filled" />
            <div>
              <strong>60 secondes</strong>
              <span>Le chrono démarre après la détection.</span>
            </div>
          </article>
          <article>
            <Icon name="center_focus_strong" className="filled" />
            <div>
              <strong>Caméra active</strong>
              <span>Place-toi en position de pompe.</span>
            </div>
          </article>
        </div>

        <button className="primary-button" type="button" onClick={onStart}>
          Lancer le défi obligatoire
        </button>
      </section>
    </main>
  );
}
