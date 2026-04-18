import Icon from './Icon.jsx';

export default function WelcomeScreen({ onStart }) {
  return (
    <main className="screen onboarding-screen">
      <section className="onboarding-card welcome-card">
        <div className="welcome-visual" aria-hidden="true">
          <div className="welcome-phone">
            <div className="welcome-camera-line" />
            <div className="welcome-rep-count">12</div>
            <div className="welcome-signal">
              <span />
            </div>
          </div>
        </div>

        <div className="welcome-copy">
          <span className="onboarding-kicker">Challenge de pompes</span>
          <h1>
            Push-up <em>Défi</em>
          </h1>
          <p>
            Lance un défi, pose ton iPhone, et laisse la caméra compter tes pompes pendant que le chrono tourne.
          </p>
        </div>

        <ul className="welcome-points" aria-label="Points forts">
          <li>
            <Icon name="videocam" className="filled" />
            <strong>Détection caméra</strong>
          </li>
          <li>
            <Icon name="timer" className="filled" />
            <strong>Modes chrono</strong>
          </li>
          <li>
            <Icon name="trending_up" className="filled" />
            <strong>Progression locale</strong>
          </li>
        </ul>

        <button className="primary-button" type="button" onClick={onStart}>
          Commencer
        </button>
      </section>
    </main>
  );
}
