import { CameraPoseDemo } from './components/CameraPoseDemo';

export default function App() {
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="brand-pill">Digital ICH Workshop · From Body to Data</div>
        <h1>AI 如何看见你的身体？</h1>
        <p className="hero-subtitle">
          MediaPipe Human Keypoints 33 · Real-time Body Skeleton
        </p>
        <p className="hero-note">
          打开手机摄像头，即时把身体动作转译为 33 个可计算关键点。视频流仅在本机浏览器处理，不上传服务器。
        </p>
      </section>

      <CameraPoseDemo />

      <footer className="site-footer">
        <span>Human Keypoints 33</span>
        <span>端侧实时识别</span>
        <span>适合手机扫码体验</span>
      </footer>
    </main>
  );
}
