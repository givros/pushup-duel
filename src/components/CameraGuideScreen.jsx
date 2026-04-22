import Icon from './Icon.jsx';

const guideSteps = [
  {
    icon: 'videocam',
    title: 'Place your phone',
    text: 'Set it on the floor or against a stable object, far enough to see your body.'
  },
  {
    icon: 'center_focus_strong',
    title: 'Frame yourself from the side',
    text: 'Use a side view so the camera can clearly see the movement.'
  },
  {
    icon: 'radio_button_checked',
    title: 'Keep landmarks visible',
    text: 'Shoulders, hips, and elbows must stay in frame during your push-ups.'
  }
];

export default function CameraGuideScreen({ onStart }) {
  return (
    <main className="screen camera-guide-screen">
      <section className="camera-guide-hero">
        <div className="camera-guide-icon" aria-hidden="true">
          <Icon name="videocam" className="filled" />
        </div>
        <span>Before your first duel</span>
        <h1>Set up the camera</h1>
        <p>These three settings make rep counting much more stable.</p>
      </section>

      <section className="camera-guide-steps" aria-label="Camera setup">
        {guideSteps.map((step) => (
          <article key={step.title}>
            <Icon name={step.icon} className="filled" />
            <div>
              <strong>{step.title}</strong>
              <span>{step.text}</span>
            </div>
          </article>
        ))}
      </section>

      <button className="primary-button camera-guide-action" type="button" onClick={onStart}>
        Got it
      </button>
    </main>
  );
}
