import { useState } from 'react';

export default function ProfileSetupScreen({ onComplete }) {
  const [nickname, setNickname] = useState('');
  const [maxPushups, setMaxPushups] = useState('15');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const parsedMax = Number(maxPushups);

    if (nickname.trim().length < 2) {
      setError('Choose a nickname with at least 2 characters.');
      return;
    }

    if (!Number.isInteger(parsedMax) || parsedMax < 1 || parsedMax > 999) {
      setError('Enter a max between 1 and 999 push-ups.');
      return;
    }

    setError('');
    onComplete({ nickname, maxPushups: parsedMax });
  }

  return (
    <main className="screen onboarding-screen">
      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <span className="onboarding-kicker">Account setup</span>
        <h1>Introduce yourself</h1>
        <p>Choose your nickname and current level. Your first duel will arrive right after your profile is created.</p>

        <label htmlFor="nickname">Nickname</label>
        <input
          id="nickname"
          maxLength="18"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="Example: Lucas"
          autoComplete="nickname"
          required
        />

        <label htmlFor="max-pushups">Your current push-up max</label>
        <input
          id="max-pushups"
          inputMode="numeric"
          min="1"
          max="999"
          pattern="[0-9]*"
          type="number"
          value={maxPushups}
          onChange={(event) => setMaxPushups(event.target.value)}
          required
        />

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="primary-button" type="submit">
          Create my account
        </button>
      </form>
    </main>
  );
}
