import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CircleStop, Loader2, Play } from 'lucide-react';
import { createPoseRuntime, type PosePoint, type PoseRuntime } from '../lib/mediapipePose';
import { drawPose } from '../lib/drawPose';
import { evaluatePoseRules } from '../lib/poseRules';
import { ControlPanel, type DemoOptions } from './ControlPanel';

const DEFAULT_OPTIONS: DemoOptions = {
  showSkeleton: true,
  showPoints: true,
  showLabels: false,
  showTrail: false,
  mirror: true
};

export function CameraPoseDemo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<PoseRuntime | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const previousLandmarksRef = useRef<PosePoint[] | undefined>(undefined);
  const optionsRef = useRef<DemoOptions>(DEFAULT_OPTIONS);
  const lastUiUpdateRef = useRef(0);
  const frameCounterRef = useRef({ frames: 0, last: performance.now(), fps: 0 });

  const [options, setOptions] = useState<DemoOptions>(DEFAULT_OPTIONS);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('准备就绪');
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [fps, setFps] = useState(0);
  const [personDetected, setPersonDetected] = useState(false);
  const [actionLabel, setActionLabel] = useState('等待识别');
  const [delegate, setDelegate] = useState<'GPU' | 'CPU' | '-'>('-');

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    previousLandmarksRef.current = undefined;
    setIsRunning(false);
    setPersonDetected(false);
    setActionLabel('已停止');
    setStatus('摄像头已关闭');
  }, []);

  const predictLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const runtime = runtimeRef.current;

    if (!video || !canvas || !runtime || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(predictLoop);
      return;
    }

    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      rafRef.current = requestAnimationFrame(predictLoop);
      return;
    }

    const now = performance.now();
    const result = runtime.landmarker.detectForVideo(video, now);
    const landmarks = result.landmarks?.[0] as PosePoint[] | undefined;

    drawPose(ctx, landmarks, optionsRef.current);

    const rule = evaluatePoseRules(landmarks, previousLandmarksRef.current);
    previousLandmarksRef.current = landmarks?.map((point) => ({ ...point }));

    const counter = frameCounterRef.current;
    counter.frames += 1;
    if (now - counter.last >= 1000) {
      counter.fps = Math.round((counter.frames * 1000) / (now - counter.last));
      counter.frames = 0;
      counter.last = now;
    }

    if (now - lastUiUpdateRef.current > 180) {
      lastUiUpdateRef.current = now;
      setFps(counter.fps);
      setPersonDetected(Boolean(landmarks?.length));
      setActionLabel(rule.label);
    }

    rafRef.current = requestAnimationFrame(predictLoop);
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    setIsLoading(true);
    setStatus('正在请求摄像头权限...');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('当前浏览器不支持摄像头调用。请使用 Safari、Chrome 或 Edge 的较新版本。');
      }

      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 30 }
        }
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('视频元素初始化失败。');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      if (!runtimeRef.current) {
        const runtime = await createPoseRuntime(setStatus);
        runtimeRef.current = runtime;
        setDelegate(runtime.delegate);
      }

      setIsRunning(true);
      setStatus('识别中：请站到镜头前');
      rafRef.current = requestAnimationFrame(predictLoop);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStatus('启动失败');
      stopCamera();
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, predictLoop, stopCamera]);

  const switchCamera = useCallback(() => {
    const nextFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacingMode);

    if (isRunning) {
      stopCamera();
      window.setTimeout(() => {
        void startCamera();
      }, 120);
    }
  }, [facingMode, isRunning, startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
      runtimeRef.current?.landmarker.close();
      runtimeRef.current = null;
    };
  }, [stopCamera]);

  return (
    <section className="demo-card">
      <div className="camera-stage">
        <video
          ref={videoRef}
          className={`camera-video ${options.mirror ? 'is-mirrored' : ''}`}
          autoPlay
          muted
          playsInline
        />
        <canvas ref={canvasRef} className={`pose-canvas ${options.mirror ? 'is-mirrored' : ''}`} />

        {!isRunning && !isLoading && (
          <div className="camera-placeholder">
            <Camera size={46} />
            <h2>手机扫码，即刻体验</h2>
            <p>授权摄像头后，AI 会把你的身体变成 33 个关键点。</p>
          </div>
        )}

        {isLoading && (
          <div className="camera-placeholder">
            <Loader2 className="spin" size={44} />
            <h2>正在加载模型</h2>
            <p>{status}</p>
          </div>
        )}

        <div className="status-bar">
          <span className={`dot ${personDetected ? 'is-on' : ''}`} />
          <span>{personDetected ? 'Person detected' : 'No person'}</span>
          <span>FPS {fps}</span>
          <span>{delegate}</span>
        </div>
      </div>

      <div className="demo-meta">
        <div>
          <p className="eyebrow">Live Recognition</p>
          <h2>{actionLabel}</h2>
          <p>{status}</p>
        </div>
        <button
          type="button"
          className={`primary-action ${isRunning ? 'is-stop' : ''}`}
          onClick={isRunning ? stopCamera : startCamera}
          disabled={isLoading}
        >
          {isRunning ? <CircleStop size={18} /> : <Play size={18} />}
          <span>{isRunning ? '停止识别' : '开启摄像头'}</span>
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      <ControlPanel
        options={options}
        onChange={setOptions}
        onSwitchCamera={switchCamera}
        disabled={isLoading}
      />
    </section>
  );
}
