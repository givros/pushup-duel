import { useState } from 'react';
import Icon from './Icon.jsx';

const steps = [
  {
    kicker: 'Étape 1',
    title: 'Pose ton mobile',
    accent: 'bien cadré',
    text: 'Lance un défi, place ton mobile de côté, et garde le haut du corps visible pour que la caméra suive tes mouvements.',
    icon: 'videocam',
    point: 'La détection se fait directement dans le navigateur.'
  },
  {
    kicker: 'Étape 2',
    title: 'Fais tes pompes',
    accent: 'au bon rythme',
    text: 'L’app attend une position stable, lance le compte à rebours, puis compte uniquement les cycles complets.',
    icon: 'timer',
    point: 'Tu peux jouer en max sur 1 minute ou en objectif chrono.'
  },
  {
    kicker: 'Étape 3',
    title: 'Défie les autres',
    accent: 'à distance',
    text: 'Envoie ton score à un adversaire, reçois ses défis, puis comparez vos résultats quand les deux scores sont prêts.',
    icon: 'trending_up',
    point: 'Ta progression, ton historique et tes réglages sont sauvegardés.'
  }
];

export default function WelcomeScreen({ onStart }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  function handleNext() {
    if (isLastStep) {
      onStart();
      return;
    }

    setStepIndex((current) => current + 1);
  }

  return (
    <main className="screen onboarding-screen">
      <section className="onboarding-card welcome-card onboarding-step-card">
        <div className="welcome-visual" aria-hidden="true">
          <div className="welcome-phone">
            <div className="welcome-camera-line" />
            <div className="welcome-rep-count">{stepIndex + 1}</div>
            <div className="welcome-signal">
              <span />
            </div>
          </div>
        </div>

        <div className="welcome-copy">
          <span className="onboarding-kicker">{step.kicker}</span>
          <h1>
            {step.title} <em>{step.accent}</em>
          </h1>
          <p>{step.text}</p>
        </div>

        <div className="onboarding-insight">
          <Icon name={step.icon} className="filled" />
          <strong>{step.point}</strong>
        </div>

        <div className="onboarding-step-footer">
          <div className="step-dots" aria-label={`Étape ${stepIndex + 1} sur ${steps.length}`}>
            {steps.map((item, index) => (
              <span className={index === stepIndex ? 'active' : ''} key={item.kicker} />
            ))}
          </div>

          <button className="primary-button" type="button" onClick={handleNext}>
            {isLastStep ? 'Créer mon profil' : 'Suivant'}
          </button>
        </div>
      </section>
    </main>
  );
}
