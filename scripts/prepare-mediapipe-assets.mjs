import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const wasmSourceDir = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const wasmTargetDir = join(root, 'public', 'wasm');
const modelTargetDir = join(root, 'public', 'models');
const modelTargetPath = join(modelTargetDir, 'pose_landmarker.task');
const modelUrl =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

function copyWasmFiles() {
  if (!existsSync(wasmSourceDir)) {
    console.warn(`[prepare] MediaPipe wasm folder not found: ${wasmSourceDir}`);
    return;
  }

  mkdirSync(wasmTargetDir, { recursive: true });
  const files = readdirSync(wasmSourceDir).filter((file) =>
    ['.wasm', '.js', '.data'].some((ext) => file.endsWith(ext))
  );

  for (const file of files) {
    copyFileSync(join(wasmSourceDir, file), join(wasmTargetDir, file));
  }

  console.log(`[prepare] Copied ${files.length} MediaPipe wasm assets to public/wasm`);
}

function downloadFile(url, targetPath) {
  return new Promise((resolvePromise, rejectPromise) => {
    const request = https.get(url, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        downloadFile(response.headers.location, targetPath).then(resolvePromise).catch(rejectPromise);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        rejectPromise(new Error(`HTTP ${response.statusCode} while downloading ${url}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        mkdirSync(dirname(targetPath), { recursive: true });
        writeFileSync(targetPath, Buffer.concat(chunks));
        resolvePromise();
      });
    });

    request.on('error', rejectPromise);
    request.setTimeout(30000, () => {
      request.destroy(new Error(`Timeout while downloading ${url}`));
    });
  });
}

async function ensureModel() {
  mkdirSync(modelTargetDir, { recursive: true });

  if (existsSync(modelTargetPath)) {
    console.log('[prepare] Local pose_landmarker.task already exists');
    return;
  }

  try {
    console.log('[prepare] Downloading MediaPipe pose_landmarker.task...');
    await downloadFile(modelUrl, modelTargetPath);
    console.log('[prepare] Downloaded public/models/pose_landmarker.task');
  } catch (error) {
    console.warn('[prepare] Could not download pose_landmarker.task automatically.');
    console.warn('[prepare] The app can still fall back to the official remote model URL if reachable.');
    console.warn(`[prepare] ${error instanceof Error ? error.message : String(error)}`);
  }
}

copyWasmFiles();
await ensureModel();
