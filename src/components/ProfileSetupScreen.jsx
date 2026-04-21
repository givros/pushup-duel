import { useState } from 'react';

export default function ProfileSetupScreen({ onComplete }) {
  const [nickname, setNickname] = useState('');
  const [maxPushups, setMaxPushups] = useState('15');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const parsedMax = Number(maxPushups);

    if (nickname.trim().length < 2) {
      setError('Choisis un pseudo avec au moins 2 caractères.');
      return;
    }

    if (!Number.isInteger(parsedMax) || parsedMax < 1 || parsedMax > 999) {
      setError('Indique un maximum entre 1 et 999 pompes.');
      return;
    }

    setError('');
    onComplete({ nickname, maxPushups: parsedMax });
  }

  return (
    <main className="screen onboarding-screen">
      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <span className="onboarding-kicker">Création du compte</span>
        <h1>Présente-toi</h1>
        <p>Choisis ton pseudo et ton niveau actuel. Ton premier défi arrivera juste après la création du profil.</p>

        <label htmlFor="nickname">Pseudo</label>
        <input
          id="nickname"
          maxLength="18"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="Ex : Lucas"
          autoComplete="nickname"
          required
        />

        <label htmlFor="max-pushups">Ton max de pompes actuel</label>
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
          Créer mon compte
        </button>
      </form>
    </main>
  );
}
