import { useState } from 'react';
import Icon from './Icon.jsx';

const steps = [
  {
    kicker: 'Step 1',
    title: 'Set up your phone',
    accent: 'with clear framing',
    text: 'Start a duel, place your phone to the side, and keep your upper body visible so the camera can track your movement.',
    icon: 'videocam',
    point: 'Detection runs directly in the browser.'
  },
  {
    kicker: 'Step 2',
    title: 'Do your push-ups',
    accent: 'at a steady pace',
    text: 'The app waits for a stable position, starts the countdown, then only counts complete reps.',
    icon: 'timer',
    point: 'Play a 1-minute max challenge or race a fixed goal.'
  },
  {
    kicker: 'Step 3',
    title: 'Challenge others',
    accent: 'remotely',
    text: 'Send your score to an opponent, receive their duels, and compare results once both scores are ready.',
    icon: 'trending_up',
    point: 'Your progress, history, and settings are saved.'
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
          <div className="step-dots" aria-label={`Step ${stepIndex + 1} of ${steps.length}`}>
            {steps.map((item, index) => (
              <span className={index === stepIndex ? 'active' : ''} key={item.kicker} />
            ))}
          </div>

          <button className="primary-button" type="button" onClick={handleNext}>
            {isLastStep ? 'Create my profile' : 'Next'}
          </button>
        </div>
      </section>
    </main>
  );
}
