import { useState } from 'react';
import HistoryList from './HistoryList.jsx';
import Icon from './Icon.jsx';
import { CHALLENGE_MODES } from '../utils/progression.js';

export default function SettingsScreen({ progression, onBack, onCameraPermissionChange, onUpdateSettings, onDeleteAccount }) {
  const [checkingCamera, setCheckingCamera] = useState(false);
  const [cameraMessage, setCameraMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const profile = progression.profile;
  const stats = progression.stats;
  const cameraPermission = progression.settings.cameraPermission;
  const [challengeMode, setChallengeMode] = useState(progression.settings.challengeMode || CHALLENGE_MODES.maxReps);
  const [fixedGoal, setFixedGoal] = useState(String(progression.settings.fixedGoal || 15));
  const [settingsMessage, setSettingsMessage] = useState('');

  async function handleCameraCheck() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage('Camera is unavailable in this browser.');
      onCameraPermissionChange('denied');
      return;
    }

    setCheckingCamera(true);
    setCameraMessage('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      stream.getTracks().forEach((track) => track.stop());
      onCameraPermissionChange('granted');
      setCameraMessage('Camera is allowed on this device.');
    } catch {
      onCameraPermissionChange('denied');
      setCameraMessage('Permission denied. Update the camera setting in your browser.');
    } finally {
      setCheckingCamera(false);
    }
  }

  function handleDuelSettingsSubmit(event) {
    event.preventDefault();
    const parsedGoal = Number(fixedGoal);

    if (challengeMode === CHALLENGE_MODES.fixedGoal && (!Number.isInteger(parsedGoal) || parsedGoal < 1 || parsedGoal > 999)) {
      setSettingsMessage('Enter a target between 1 and 999 push-ups.');
      return;
    }

    onUpdateSettings?.({
      challengeMode,
      fixedGoal: challengeMode === CHALLENGE_MODES.fixedGoal ? parsedGoal : progression.settings.fixedGoal
    });
    setSettingsMessage('Duel settings saved.');
  }

  return (
    <main className="screen settings-screen">
      <header className="settings-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back to home">
          <Icon name="arrow_back" />
        </button>
        <div>
          <span>Profile</span>
          <h1>Profile</h1>
        </div>
      </header>

      <section className="settings-card profile-settings-card">
        <div className="avatar avatar-large" aria-hidden="true">
          <span />
        </div>
        <div>
          <span className="settings-kicker">Player account</span>
          <h2>{profile.nickname}</h2>
          <p>Level {profile.level} - {profile.maxPushups} declared max push-ups</p>
        </div>
      </section>

      <section className="settings-grid" aria-label="Statistics">
        <article>
          <span>Fights</span>
          <strong>{stats.sessions}</strong>
        </article>
        <article>
          <span>Losses</span>
          <strong>{stats.defeats}</strong>
        </article>
        <article>
          <span>Total</span>
          <strong>{stats.totalPushups}</strong>
        </article>
        <article>
          <span>1 min best</span>
          <strong>{stats.bestOneMinute}</strong>
        </article>
      </section>

      <section className="settings-card">
        <div className="settings-section-title">
          <h2>Duel settings</h2>
        </div>
        <form className="duel-settings-form" onSubmit={handleDuelSettingsSubmit}>
          <div className="preference-selector" role="radiogroup" aria-label="Default duel mode">
            <label className={challengeMode === CHALLENGE_MODES.maxReps ? 'selected' : ''}>
              <input
                type="radio"
                name="default-duel-mode"
                checked={challengeMode === CHALLENGE_MODES.maxReps}
                onChange={() => setChallengeMode(CHALLENGE_MODES.maxReps)}
              />
              <span>1 min max</span>
            </label>
            <label className={challengeMode === CHALLENGE_MODES.fixedGoal ? 'selected' : ''}>
              <input
                type="radio"
                name="default-duel-mode"
                checked={challengeMode === CHALLENGE_MODES.fixedGoal}
                onChange={() => setChallengeMode(CHALLENGE_MODES.fixedGoal)}
              />
              <span>Target</span>
            </label>
          </div>

          {challengeMode === CHALLENGE_MODES.fixedGoal && (
            <label className="settings-input-row" htmlFor="settings-fixed-goal">
              <span>Push-up target</span>
              <input
                id="settings-fixed-goal"
                inputMode="numeric"
                min="1"
                max="999"
                pattern="[0-9]*"
                type="number"
                value={fixedGoal}
                onChange={(event) => setFixedGoal(event.target.value)}
              />
            </label>
          )}

          {settingsMessage && <p className="settings-note">{settingsMessage}</p>}

          <button className="secondary-button" type="submit">
            Save duel settings
          </button>
        </form>
      </section>

      <section className="settings-card">
        <div className="settings-section-title">
          <h2>App settings</h2>
        </div>
        <div className="camera-setting-row">
          <div>
            <span className={`permission-pill ${cameraPermission}`}>
              {cameraPermissionLabel(cameraPermission)}
            </span>
            <p>Camera permission</p>
          </div>
          <button className="secondary-button" type="button" onClick={handleCameraCheck} disabled={checkingCamera}>
            {checkingCamera ? 'Checking...' : 'Check'}
          </button>
        </div>
        {cameraMessage && <p className="settings-note">{cameraMessage}</p>}
      </section>

      <section className="settings-card">
        <div className="settings-section-title">
          <h2>Full history</h2>
        </div>
        <HistoryList history={stats.history} emptyLabel="No fights yet." />
      </section>

      <section className="settings-card danger-card">
        <div className="settings-section-title">
          <h2>Delete account</h2>
        </div>
        <p>This action deletes your profile, statistics, history, and synced settings.</p>

        {!confirmDelete ? (
          <button className="danger-button" type="button" onClick={() => setConfirmDelete(true)}>
            <Icon name="delete" />
            Delete my account
          </button>
        ) : (
          <div className="delete-confirm">
            <strong>Confirm deletion?</strong>
            <div>
              <button className="secondary-button" type="button" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button className="danger-button" type="button" onClick={onDeleteAccount}>
                Delete
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function cameraPermissionLabel(permission) {
  if (permission === 'granted') {
    return 'Allowed';
  }
  if (permission === 'denied') {
    return 'Denied';
  }

  return 'Not checked';
}
