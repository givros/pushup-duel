import Icon from './Icon.jsx';

const challenger = {
  pseudo: 'MayaCore',
  stat: 'Défi : 15 pompes',
  rank: 'Rang argent'
};

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
          <span className="onboarding-kicker">Défi reçu</span>
          <h1 id="starter-title">MayaCore te défie</h1>
          <p>
            Bienvenue {profile?.nickname || 'athlète'}. MayaCore vient de t’envoyer un défi découverte :
            réaliser 15 pompes le plus rapidement possible.
          </p>
        </div>

        <section className="starter-challenger" aria-label="Adversaire">
          <div className="opponent-avatar opponent-maya-starter" aria-hidden="true">
            <span>M</span>
          </div>
          <div>
            <span>Adversaire</span>
            <strong>{challenger.pseudo}</strong>
            <p>{challenger.stat} • {challenger.rank}</p>
          </div>
        </section>

        <div className="starter-rules">
          <article>
            <Icon name="flag" className="filled" />
            <div>
              <strong>15 pompes</strong>
              <span>Atteins l’objectif sans te précipiter.</span>
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
          Relever le défi
        </button>
      </section>
    </main>
  );
}
