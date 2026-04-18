import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CountdownOverlay from './CountdownOverlay.jsx';
import StatsOverlay from './StatsOverlay.jsx';
import { useCamera } from '../hooks/useCamera.js';
import { useChallengeTimer } from '../hooks/useChallengeTimer.js';
import { getPoseLandmarker } from '../services/poseLandmarkerService.js';
import { createPushupDetector } from '../utils/pushupDetector.js';

const TARGET_INFERENCE_INTERVAL_MS = 90;
const TARGET_UI_INTERVAL_MS = 140;
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

export default function CameraChallenge({ goal, onComplete, onCancel }) {
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

  const [phase, setPhase] = useState('setup');
  const [countdown, setCountdown] = useState(5);
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
      return 'Autorise la caméra';
    }
    if (modelStatus === 'loading') {
      return 'Chargement détection';
    }
    return 'Préparation';
  }, [cameraError, cameraStatus, modelError, modelStatus]);

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
    finishChallenge('stopped', pushupsRef.current);
  }, [finishChallenge]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    pushupsRef.current = pushups;
  }, [pushups]);

  useEffect(() => {
    start().catch(() => {});
    return () => {
      stop();
    };
  }, [start, stop]);

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
    if (!isReady || phaseRef.current !== 'setup' || countdownStartedRef.current) {
      return undefined;
    }

    let remaining = 5;
    countdownStartedRef.current = true;
    detectorRef.current.reset();
    setPushups(0);
    setCountdown(remaining);
    setDetection({ ...initialDetection, status: 'Prêt' });
    phaseRef.current = 'countdown';
    setPhase('countdown');

    const intervalId = window.setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        window.clearInterval(intervalId);
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

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isReady, resetTimer, startTimer]);

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

          if (update.count >= goal) {
            finishChallenge('completed', update.count);
            return;
          }
        } else {
          const preview = detectorRef.current.inspect(landmarks);
          drawPose(canvas, landmarks, preview.confidence, video.videoWidth, video.videoHeight);
          publishDetection(preview, now);
        }
      }

      frameId = window.requestAnimationFrame(loop);
    };

    frameId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [cameraStatus, finishChallenge, goal, landmarker, videoRef]);

  return (
    <main className="challenge-screen">
      <video className="camera-video mirrored" ref={videoRef} muted playsInline autoPlay />
      <canvas className="pose-canvas mirrored" ref={canvasRef} aria-hidden="true" />

      <StatsOverlay
        count={pushups}
        goal={goal}
        elapsedMs={elapsedMs}
        status={detection.status}
        confidence={detection.confidence}
        onStop={handleStop}
      />

      {phase !== 'active' && (
        <CountdownOverlay
          ready={isReady}
          count={countdown}
          label={isReady ? 'Place-toi en position' : setupLabel}
        />
      )}

      {(cameraStatus === 'error' || modelStatus === 'error') && (
        <div className="permission-panel" role="alert">
          <p>{setupLabel}</p>
          <div className="permission-actions">
            <button className="secondary-button" type="button" onClick={onCancel}>
              Accueil
            </button>
            {cameraStatus === 'error' && (
              <button className="primary-button" type="button" onClick={() => start().catch(() => {})}>
                Réessayer
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
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
