import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

const WASM_BASE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm';
const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

let landmarkerPromise = null;

export function getPoseLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = createPoseLandmarker();
  }

  return landmarkerPromise;
}

async function createPoseLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);

  try {
    return await buildLandmarker(vision, 'GPU');
  } catch (gpuError) {
    return buildLandmarker(vision, 'CPU');
  }
}

function buildLandmarker(vision, delegate) {
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: POSE_MODEL_URL,
      delegate
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.55,
    minPosePresenceConfidence: 0.55,
    minTrackingConfidence: 0.55
  });
}
