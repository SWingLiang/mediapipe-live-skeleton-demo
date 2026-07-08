import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

export type PosePoint = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
};

export type PoseRuntime = {
  landmarker: PoseLandmarker;
  delegate: 'GPU' | 'CPU';
  modelSource: string;
};

export const POSE_CONNECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],
  [9, 10],
  [11, 12],
  [11, 13],
  [13, 15],
  [15, 17],
  [15, 19],
  [15, 21],
  [17, 19],
  [12, 14],
  [14, 16],
  [16, 18],
  [16, 20],
  [16, 22],
  [18, 20],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [27, 29],
  [27, 31],
  [29, 31],
  [24, 26],
  [26, 28],
  [28, 30],
  [28, 32],
  [30, 32]
];

const WASM_SOURCES = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
  'https://unpkg.com/@mediapipe/tasks-vision@latest/wasm'
];

const MODEL_SOURCES = [
  '/models/pose_landmarker.task',
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task'
];

async function createWithDelegate(
  vision: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
  modelAssetPath: string,
  delegate: 'GPU' | 'CPU'
) {
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath,
      delegate
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
}

export async function createPoseRuntime(
  onStatus?: (message: string) => void
): Promise<PoseRuntime> {
  let lastError: unknown;

  for (const wasmSource of WASM_SOURCES) {
    try {
      onStatus?.('正在加载 MediaPipe WASM...');
      const vision = await FilesetResolver.forVisionTasks(wasmSource);

      for (const modelSource of MODEL_SOURCES) {
        try {
          onStatus?.('正在加载 Human Keypoints 33 模型...');
          const landmarker = await createWithDelegate(vision, modelSource, 'GPU');
          return { landmarker, delegate: 'GPU', modelSource };
        } catch (gpuError) {
          lastError = gpuError;
          try {
            onStatus?.('GPU 初始化失败，正在切换 CPU 模式...');
            const landmarker = await createWithDelegate(vision, modelSource, 'CPU');
            return { landmarker, delegate: 'CPU', modelSource };
          } catch (cpuError) {
            lastError = cpuError;
          }
        }
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `MediaPipe 初始化失败。请确认网络可访问模型资源，或将 pose_landmarker.task 放入 public/models。${String(
      lastError ?? ''
    )}`
  );
}
