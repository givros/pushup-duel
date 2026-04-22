import { useState } from 'react';

export default function ProfileSetupScreen({ onLookupNickname, onComplete }) {
  const [nickname, setNickname] = useState('');
  const [maxPushups, setMaxPushups] = useState('15');
  const [error, setError] = useState('');
  const [step, setStep] = useState('nickname');
  const [loading, setLoading] = useState(false);

  async function handleNicknameSubmit(event) {
    event.preventDefault();
    const nextNickname = nickname.trim();

    if (nextNickname.length < 2) {
      setError('Choose a nickname with at least 2 characters.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const recoveredProgression = await onLookupNickname(nextNickname);

      if (recoveredProgression) {
        onComplete({ type: 'existing', progression: recoveredProgression });
        return;
      }

      setStep('max');
    } catch (lookupError) {
      setError(lookupError?.message || 'Unable to check this nickname right now.');
    } finally {
      setLoading(false);
    }
  }

  function handleMaxSubmit(event) {
    event.preventDefault();
    const parsedMax = Number(maxPushups);

    if (!Number.isInteger(parsedMax) || parsedMax < 1 || parsedMax > 999) {
      setError('Enter a max between 1 and 999 push-ups.');
      return;
    }

    setError('');
    onComplete({
      type: 'new',
      profile: {
        nickname: nickname.trim(),
        maxPushups: parsedMax
      }
    });
  }

  const isNicknameStep = step === 'nickname';

  return (
    <main className="screen onboarding-screen">
      <form className="profile-form" onSubmit={isNicknameStep ? handleNicknameSubmit : handleMaxSubmit} noValidate>
        <span className="onboarding-kicker">Account setup</span>
        <h1>{isNicknameStep ? 'Enter your nickname' : 'Set your level'}</h1>
        <p>
          {isNicknameStep
            ? 'If this nickname already exists, your previous profile will be restored automatically.'
            : 'This nickname is new. Add your current push-up max to create your profile.'}
        </p>

        <label htmlFor="nickname">Nickname</label>
        <input
          id="nickname"
          maxLength="18"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="Example: Lucas"
          autoComplete="nickname"
          disabled={!isNicknameStep || loading}
          required
        />

        {!isNicknameStep && (
          <>
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
          </>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="primary-button" type="submit">
          {loading ? 'Checking...' : isNicknameStep ? 'Continue' : 'Create my account'}
        </button>

        {!isNicknameStep && (
          <button className="secondary-button" type="button" onClick={() => setStep('nickname')}>
            Change nickname
          </button>
        )}
      </form>
    </main>
  );
}
