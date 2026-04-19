import { useCallback, useEffect, useRef, useState } from 'react';

const cameraConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: 'user' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 }
  }
};

const VIDEO_READY_TIMEOUT_MS = 3000;
const VIDEO_PLAY_TIMEOUT_MS = 1800;

export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const nextError = 'getUserMedia indisponible sur ce navigateur.';
      setStatus('error');
      setError(nextError);
      throw new Error(nextError);
    }

    stop();
    setStatus('requesting');
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia(cameraConstraints);
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        await playVideo(video, stream);
        await waitForVideo(video, stream);
      }

      setStatus('ready');
      return stream;
    } catch (err) {
      const nextError =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Permission caméra refusée.'
          : err instanceof Error
            ? err.message
            : 'Impossible de démarrer la caméra.';
      setStatus('error');
      setError(nextError);
      throw err;
    }
  }, [stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    videoRef,
    status,
    error,
    start,
    stop
  };
}

async function playVideo(video, stream) {
  if (!streamIsLive(stream)) {
    throw new Error('Flux caméra interrompu.');
  }

  try {
    await withTimeout(video.play(), VIDEO_PLAY_TIMEOUT_MS);
  } catch (error) {
    if (!streamIsLive(stream)) {
      throw error;
    }
  }
}

function waitForVideo(video, stream) {
  if (hasVideoFrame(video)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let timeoutId = 0;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener('loadedmetadata', handleReady);
      video.removeEventListener('canplay', handleReady);
      video.removeEventListener('playing', handleReady);
      video.removeEventListener('resize', handleReady);
    };

    const handleReady = () => {
      if (!hasVideoFrame(video) && streamIsLive(stream)) {
        return;
      }

      cleanup();
      resolve();
    };

    timeoutId = window.setTimeout(() => {
      cleanup();
      resolve();
    }, VIDEO_READY_TIMEOUT_MS);

    video.addEventListener('loadedmetadata', handleReady);
    video.addEventListener('canplay', handleReady);
    video.addEventListener('playing', handleReady);
    video.addEventListener('resize', handleReady);
    handleReady();
  });
}

function hasVideoFrame(video) {
  return video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0;
}

function streamIsLive(stream) {
  return stream.getVideoTracks().some((track) => track.readyState === 'live');
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    })
  ]);
}
