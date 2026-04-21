import Icon from './Icon.jsx';

const guideSteps = [
  {
    icon: 'videocam',
    title: 'Pose ton téléphone',
    text: 'Place-le au sol ou contre un objet stable, assez loin pour voir ton corps.'
  },
  {
    icon: 'center_focus_strong',
    title: 'Cadre-toi de côté',
    text: 'Mets-toi de profil pour que la caméra voie clairement le mouvement.'
  },
  {
    icon: 'radio_button_checked',
    title: 'Garde les repères visibles',
    text: 'Épaules, hanches et coudes doivent rester dans l’image pendant les pompes.'
  }
];

export default function CameraGuideScreen({ onStart }) {
  return (
    <main className="screen camera-guide-screen">
      <section className="camera-guide-hero">
        <div className="camera-guide-icon" aria-hidden="true">
          <Icon name="videocam" className="filled" />
        </div>
        <span>Avant ton premier défi</span>
        <h1>Prépare la caméra</h1>
        <p>Ces trois réglages rendent le comptage beaucoup plus stable.</p>
      </section>

      <section className="camera-guide-steps" aria-label="Préparation caméra">
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
        J’ai compris
      </button>
    </main>
  );
}
