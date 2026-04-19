import { useState } from 'react';
import HistoryList from './HistoryList.jsx';
import Icon from './Icon.jsx';

export default function SettingsScreen({ progression, onBack, onCameraPermissionChange, onDeleteAccount }) {
  const [checkingCamera, setCheckingCamera] = useState(false);
  const [cameraMessage, setCameraMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const profile = progression.profile;
  const stats = progression.stats;
  const cameraPermission = progression.settings.cameraPermission;

  async function handleCameraCheck() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage('Caméra indisponible sur ce navigateur.');
      onCameraPermissionChange('denied');
      return;
    }

    setCheckingCamera(true);
    setCameraMessage('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      stream.getTracks().forEach((track) => track.stop());
      onCameraPermissionChange('granted');
      setCameraMessage('Caméra autorisée sur cet appareil.');
    } catch {
      onCameraPermissionChange('denied');
      setCameraMessage('Autorisation refusée. Modifie le réglage caméra dans ton navigateur.');
    } finally {
      setCheckingCamera(false);
    }
  }

  return (
    <main className="screen settings-screen">
      <header className="settings-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Retour à l'accueil">
          <Icon name="arrow_back" />
        </button>
        <div>
          <span>Profil</span>
          <h1>Réglages</h1>
        </div>
      </header>

      <section className="settings-card profile-settings-card">
        <div className="avatar avatar-large" aria-hidden="true">
          <span />
        </div>
        <div>
          <span className="settings-kicker">Compte joueur</span>
          <h2>{profile.nickname}</h2>
          <p>Niveau {profile.level} • {profile.maxPushups} pompes max déclarées</p>
        </div>
      </section>

      <section className="settings-grid" aria-label="Statistiques">
        <article>
          <span>Combats</span>
          <strong>{stats.sessions}</strong>
        </article>
        <article>
          <span>Défaites</span>
          <strong>{stats.defeats}</strong>
        </article>
        <article>
          <span>Total</span>
          <strong>{stats.totalPushups}</strong>
        </article>
        <article>
          <span>Record 1 min</span>
          <strong>{stats.bestOneMinute}</strong>
        </article>
      </section>

      <section className="settings-card">
        <div className="settings-section-title">
          <h2>Réglages de l'app</h2>
        </div>
        <div className="camera-setting-row">
          <div>
            <span className={`permission-pill ${cameraPermission}`}>
              {cameraPermissionLabel(cameraPermission)}
            </span>
            <p>Autorisation caméra</p>
          </div>
          <button className="secondary-button" type="button" onClick={handleCameraCheck} disabled={checkingCamera}>
            {checkingCamera ? 'Vérification...' : 'Vérifier'}
          </button>
        </div>
        {cameraMessage && <p className="settings-note">{cameraMessage}</p>}
      </section>

      <section className="settings-card">
        <div className="settings-section-title">
          <h2>Historique complet</h2>
        </div>
        <HistoryList history={stats.history} emptyLabel="Aucun combat pour le moment." />
      </section>

      <section className="settings-card danger-card">
        <div className="settings-section-title">
          <h2>Supprimer le compte</h2>
        </div>
        <p>Cette action efface ton profil, tes statistiques, ton historique et tes réglages synchronisés.</p>

        {!confirmDelete ? (
          <button className="danger-button" type="button" onClick={() => setConfirmDelete(true)}>
            <Icon name="delete" />
            Supprimer mon compte
          </button>
        ) : (
          <div className="delete-confirm">
            <strong>Confirmer la suppression ?</strong>
            <div>
              <button className="secondary-button" type="button" onClick={() => setConfirmDelete(false)}>
                Annuler
              </button>
              <button className="danger-button" type="button" onClick={onDeleteAccount}>
                Supprimer
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
    return 'Autorisée';
  }
  if (permission === 'denied') {
    return 'Refusée';
  }

  return 'Non vérifiée';
}
