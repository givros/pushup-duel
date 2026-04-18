export default function WelcomeScreen({ onStart }) {
  return (
    <main className="screen onboarding-screen">
      <section className="onboarding-card welcome-card">
        <button className="primary-button" type="button" onClick={onStart}>
          Commencer
        </button>
      </section>
    </main>
  );
}
