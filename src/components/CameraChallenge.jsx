import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CountdownOverlay from './CountdownOverlay.jsx';
import StatsOverlay from './StatsOverlay.jsx';
import { useCamera } from '../hooks/useCamera.js';
import { useChallengeTimer } from '../hooks/useChallengeTimer.js';
import { getPoseLandmarker } from '../services/poseLandmarkerService.js';
import { createPushupDetector } from '../utils/pushupDetector.js';
import { CHALLENGE_MODES } from '../utils/progression.js';

const TARGET_INFERENCE_INTERVAL_MS = 75;
const TARGET_UI_INTERVAL_MS = 140;
const COUNTDOWN_SECONDS = 5;
const READY_HOLD_MS = 3000;
const READY_PROGRESS_UI_INTERVAL_MS = 180;
const POSE_CONNECTIONS = [
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 12],
  [23, 24],
  [11, 23],
  [12, 24],
  [23, 25],
  [24, 26],
  [25, 27],
  [26, 28]
];

const initialDetection = {
  count: 0,
  status: 'Prêt',
  confidence: 0,
  isValid: false,
  phase: 'waitingTop'
};

export default function CameraChallenge({
  challenge,
  cameraPermission = 'unknown',
  onCameraPermissionChange,
  onComplete
}) {
  const goal = challenge.goal;
  const { videoRef, status: cameraStatus, error: cameraError, start, stop } = useCamera();
  const {
    elapsedMs,
    start: startTimer,
    stop: stopTimer,
    reset: resetTimer,
    getElapsed
  } = useChallengeTimer();
  const canvasRef = useRef(null);
  const detectorRef = useRef(createPushupDetector());
  const phaseRef = useRef('setup');
  const pushupsRef = useRef(0);
  const completedRef = useRef(false);
  const countdownStartedRef = useRef(false);
  const readySinceRef = useRef(null);
  const readyProgressUiRef = useRef(0);
  const countdownIntervalRef = useRef(0);

  const [phase, setPhase] = useState('setup');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [readyHoldRemainingMs, setReadyHoldRemainingMs] = useState(READY_HOLD_MS);
  const [modelStatus, setModelStatus] = useState('loading');
  const [modelError, setModelError] = useState('');
  const [landmarker, setLandmarker] = useState(null);
  const [pushups, setPushups] = useState(0);
  const [detection, setDetection] = useState(initialDetection);

  const isReady = cameraStatus === 'ready' && modelStatus === 'ready';
  const setupLabel = useMemo(() => {
    if (cameraStatus === 'error') {
      return cameraError || 'Caméra indisponible';
    }
    if (modelStatus === 'error') {
      return modelError || 'Modèle indisponible';
    }
    if (cameraStatus === 'requesting') {
      return cameraPermission === 'granted' ? 'Démarrage caméra' : 'Autorise la caméra';
    }
    if (modelStatus === 'loading') {
      return 'Chargement détection';
    }
    return 'Préparation';
  }, [cameraError, cameraPermission, cameraStatus, modelError, modelStatus]);

  const finishChallenge = useCallback(
    (reason = 'completed', finalCount = pushupsRef.current) => {
      if (completedRef.current) {
        return;
      }

      completedRef.current = true;
      const finalElapsedMs = getElapsed();
      stopTimer();
      stop();

      onComplete({
        goal,
        pushups: finalCount,
        timeMs: finalElapsedMs,
        reason
      });
    },
    [getElapsed, goal, onComplete, stop, stopTimer]
  );

  const handleStop = useCallback(() => {
    finishChallenge('forfeit', pushupsRef.current);
  }, [finishChallenge]);

  const beginCountdown = useCallback(() => {
    if (countdownStartedRef.current || phaseRef.current === 'countdown' || phaseRef.current === 'active') {
      return;
    }

    let remaining = COUNTDOWN_SECONDS;
    countdownStartedRef.current = true;
    readySinceRef.current = null;
    detectorRef.current.reset();
    window.clearInterval(countdownIntervalRef.current);
    setCountdown(remaining);
    phaseRef.current = 'countdown';
    setPhase('countdown');

    countdownIntervalRef.current = window.setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        window.clearInterval(countdownIntervalRef.current);
        detectorRef.current.reset();
        resetTimer();
        startTimer();
        phaseRef.current = 'active';
        setPhase('active');
        setDetection((current) => ({
          ...current,
          status: current.isValid ? 'Descends' : 'mal cadré'
        }));
        return;
      }

      setCountdown(remaining);
    }, 1000);
  }, [resetTimer, startTimer]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    pushupsRef.current = pushups;
  }, [pushups]);

  useEffect(() => {
    return () => {
      window.clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const requestCamera = useCallback(() => {
    return start()
      .then((stream) => {
        onCameraPermissionChange?.('granted');
        return stream;
      })
      .catch((error) => {
        onCameraPermissionChange?.('denied');
        throw error;
      });
  }, [onCameraPermissionChange, start]);

  useEffect(() => {
    requestCamera().catch(() => {});
    return () => {
      stop();
    };
  }, [requestCamera, stop]);

  useEffect(() => {
    let active = true;

    setModelStatus('loading');
    getPoseLandmarker()
      .then((nextLandmarker) => {
        if (!active) {
          return;
        }
        setLandmarker(nextLandmarker);
        setModelStatus('ready');
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setModelStatus('error');
        setModelError(error instanceof Error ? error.message : 'Chargement impossible');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || phaseRef.current !== 'setup') {
      return undefined;
    }

    detectorRef.current.reset();
    setPushups(0);
    setCountdown(COUNTDOWN_SECONDS);
    setReadyHoldRemainingMs(READY_HOLD_MS);
    setDetection({ ...initialDetection, status: 'Prêt' });
    readySinceRef.current = null;
    phaseRef.current = 'arming';
    setPhase('arming');

    return undefined;
  }, [isReady]);

  useEffect(() => {
    if (!landmarker || cameraStatus !== 'ready') {
      return undefined;
    }

    let frameId = 0;
    let lastInferenceMs = 0;
    let lastUiMs = 0;
    let lastVideoTime = -1;

    const publishDetection = (nextDetection, now, force = false) => {
      if (force || now - lastUiMs >= TARGET_UI_INTERVAL_MS) {
        lastUiMs = now;
        setDetection(nextDetection);
      }
    };

    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const now = performance.now();

      if (
        video &&
        canvas &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        now - lastInferenceMs >= TARGET_INFERENCE_INTERVAL_MS &&
        video.currentTime !== lastVideoTime
      ) {
        lastInferenceMs = now;
        lastVideoTime = video.currentTime;

        const result = landmarker.detectForVideo(video, now);
        const landmarks = result.landmarks?.[0] || null;

        if (phaseRef.current === 'active') {
          const update = detectorRef.current.update(landmarks, now);
          drawPose(canvas, landmarks, update.confidence, video.videoWidth, video.videoHeight);

          if (update.count !== pushupsRef.current) {
            pushupsRef.current = update.count;
            setPushups(update.count);
            publishDetection(update, now, true);
          } else {
            publishDetection(update, now);
          }

          const elapsed = getElapsed();

          if (challenge.mode === CHALLENGE_MODES.maxReps && elapsed >= challenge.durationMs) {
            finishChallenge('timeup', update.count);
            return;
          }

          if (challenge.mode === CHALLENGE_MODES.fixedGoal && update.count >= goal) {
            finishChallenge('completed', update.count);
            return;
          }
        } else {
          const preview = detectorRef.current.inspect(landmarks);
          drawPose(canvas, landmarks, preview.confidence, video.videoWidth, video.videoHeight);
          publishDetection(preview, now);

          if (phaseRef.current === 'arming') {
            if (preview.status === 'Prêt' && preview.isValid) {
              if (readySinceRef.current === null) {
                readySinceRef.current = now;
              }

              const heldMs = now - readySinceRef.current;
              const remainingReadyMs = Math.max(0, READY_HOLD_MS - heldMs);

              if (now - readyProgressUiRef.current >= READY_PROGRESS_UI_INTERVAL_MS) {
                readyProgressUiRef.current = now;
                setReadyHoldRemainingMs(remainingReadyMs);
              }

              if (heldMs >= READY_HOLD_MS) {
                setReadyHoldRemainingMs(0);
                beginCountdown();
              }
            } else {
              readySinceRef.current = null;
              setReadyHoldRemainingMs(READY_HOLD_MS);
            }
          }
        }
      }

      frameId = window.requestAnimationFrame(loop);
    };

    frameId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [beginCountdown, cameraStatus, challenge, finishChallenge, getElapsed, goal, landmarker, videoRef]);

  return (
    <main className="challenge-screen">
      <video className="camera-video mirrored" ref={videoRef} muted playsInline autoPlay />
      <canvas className="pose-canvas mirrored" ref={canvasRef} aria-hidden="true" />

      <StatsOverlay
        count={pushups}
        challenge={challenge}
        elapsedMs={elapsedMs}
        status={detection.status}
        confidence={detection.confidence}
        onStop={handleStop}
      />

      {phase !== 'active' && (
        <CountdownOverlay
          ready={isReady}
          count={phase === 'arming' ? Math.ceil(readyHoldRemainingMs / 1000) : countdown}
          label={getOverlayLabel({ isReady, phase, setupLabel, status: detection.status })}
          onCancel={handleStop}
        />
      )}

      {(cameraStatus === 'error' || modelStatus === 'error') && (
        <div className="permission-panel" role="alert">
          <p>{setupLabel}</p>
          <div className="permission-actions">
            <button className="secondary-button" type="button" onClick={handleStop}>
              Annuler
            </button>
            {cameraStatus === 'error' && (
              <button className="primary-button" type="button" onClick={() => requestCamera().catch(() => {})}>
                Réessayer
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function getOverlayLabel({ isReady, phase, setupLabel, status }) {
  if (!isReady) {
    return setupLabel;
  }

  if (phase === 'arming') {
    return status === 'Prêt' ? 'Reste prêt' : 'Place-toi en position de pompe';
  }

  if (phase === 'countdown') {
    return 'Place-toi en position';
  }

  return setupLabel;
}

function drawPose(canvas, landmarks, confidence, videoWidth, videoHeight) {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const nextWidth = Math.max(1, Math.round(videoWidth || canvas.clientWidth || canvas.width || 1));
  const nextHeight = Math.max(1, Math.round(videoHeight || canvas.clientHeight || canvas.height || 1));

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  if (!landmarks) {
    return;
  }

  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = Math.max(3, canvas.width * 0.008);
  context.strokeStyle = confidence >= 0.65 ? 'rgba(153, 246, 228, 0.95)' : 'rgba(249, 115, 22, 0.85)';
  context.fillStyle = 'rgba(248, 250, 252, 0.95)';

  POSE_CONNECTIONS.forEach(([startIndex, endIndex]) => {
    const start = landmarks[startIndex];
    const end = landmarks[endIndex];
    if (!isVisible(start) || !isVisible(end)) {
      return;
    }
    context.beginPath();
    context.moveTo(start.x * canvas.width, start.y * canvas.height);
    context.lineTo(end.x * canvas.width, end.y * canvas.height);
    context.stroke();
  });

  landmarks.forEach((landmark) => {
    if (!isVisible(landmark)) {
      return;
    }
    context.beginPath();
    context.arc(landmark.x * canvas.width, landmark.y * canvas.height, Math.max(3, canvas.width * 0.006), 0, Math.PI * 2);
    context.fill();
  });
}

function isVisible(landmark) {
  return landmark && (typeof landmark.visibility !== 'number' || landmark.visibility >= 0.4);
}
