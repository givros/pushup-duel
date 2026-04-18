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
            <span className="material-symbols-outlined filled">videocam</span>
            <strong>Détection caméra</strong>
          </li>
          <li>
            <span className="material-symbols-outlined filled">timer</span>
            <strong>Modes chrono</strong>
          </li>
          <li>
            <span className="material-symbols-outlined filled">trending_up</span>
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
