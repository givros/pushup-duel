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
        await waitForVideo(video);
        await video.play();
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

function waitForVideo(video) {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.videoWidth > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const handleLoaded = () => {
      video.removeEventListener('loadedmetadata', handleLoaded);
      resolve();
    };
    video.addEventListener('loadedmetadata', handleLoaded, { once: true });
  });
}
