import Icon from './Icon.jsx';

const challenger = {
  pseudo: 'MayaCore',
  stat: 'Challenge: 15 push-ups',
  rank: 'Silver rank'
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
          <span className="onboarding-kicker">Duel received</span>
          <h1 id="starter-title">MayaCore challenged you</h1>
          <p>
            Welcome {profile?.nickname || 'athlete'}. MayaCore just sent you a discovery duel:
            complete 15 push-ups as fast as possible.
          </p>
        </div>

        <section className="starter-challenger" aria-label="Opponent">
          <div className="opponent-avatar opponent-maya-starter" aria-hidden="true">
            <span>M</span>
          </div>
          <div>
            <span>Opponent</span>
            <strong>{challenger.pseudo}</strong>
            <p>{challenger.stat} • {challenger.rank}</p>
          </div>
        </section>

        <div className="starter-rules">
          <article>
            <Icon name="flag" className="filled" />
            <div>
              <strong>15 push-ups</strong>
              <span>Reach the goal without rushing.</span>
            </div>
          </article>
          <article>
            <Icon name="center_focus_strong" className="filled" />
            <div>
              <strong>Camera active</strong>
              <span>Get into push-up position.</span>
            </div>
          </article>
        </div>

        <button className="primary-button" type="button" onClick={onStart}>
          Answer the duel
        </button>
      </section>
    </main>
  );
}
