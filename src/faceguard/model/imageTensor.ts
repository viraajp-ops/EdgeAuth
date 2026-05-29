import * as FileSystem from 'expo-file-system';
import { decode } from 'jpeg-js';

export type RgbaImage = {
  width: number;
  height: number;
  data: Uint8Array;
};

export type LetterboxTensor = {
  tensor: Float32Array;
  srcWidth: number;
  srcHeight: number;
  scale: number;
  padX: number;
  padY: number;
};

const BLAZE_SIZE = 128;
const MOBILE_FACE_SIZE = 112;

export async function loadRgbaFromPhotoPath(photoPath: string): Promise<RgbaImage> {
  const uri = photoPath.startsWith('file://') ? photoPath : `file://${photoPath}`;
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    throw new Error('Captured photo is not available on disk.');
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64
  });
  const bytes = base64ToUint8Array(base64);
  const decoded = decode(bytes, { useTArray: true });
  return {
    width: decoded.width,
    height: decoded.height,
    data: decoded.data
  };
}

export function letterboxToBlazeFace(image: RgbaImage): LetterboxTensor {
  const scale = Math.min(BLAZE_SIZE / image.width, BLAZE_SIZE / image.height);
  const resizedWidth = Math.round(image.width * scale);
  const resizedHeight = Math.round(image.height * scale);
  const padX = Math.floor((BLAZE_SIZE - resizedWidth) / 2);
  const padY = Math.floor((BLAZE_SIZE - resizedHeight) / 2);

  const resized = resizeRgba(image, resizedWidth, resizedHeight);
  const tensor = new Float32Array(BLAZE_SIZE * BLAZE_SIZE * 3);

  for (let y = 0; y < BLAZE_SIZE; y += 1) {
    for (let x = 0; x < BLAZE_SIZE; x += 1) {
      const offset = (y * BLAZE_SIZE + x) * 3;
      const inside =
        x >= padX && x < padX + resizedWidth && y >= padY && y < padY + resizedHeight;
      if (!inside) {
        tensor[offset] = -1;
        tensor[offset + 1] = -1;
        tensor[offset + 2] = -1;
        continue;
      }

      const sx = x - padX;
      const sy = y - padY;
      const pixel = sampleRgba(resized, sx, sy);
      tensor[offset] = pixel.r / 127.5 - 1;
      tensor[offset + 1] = pixel.g / 127.5 - 1;
      tensor[offset + 2] = pixel.b / 127.5 - 1;
    }
  }

  return {
    tensor,
    srcWidth: image.width,
    srcHeight: image.height,
    scale,
    padX,
    padY
  };
}

export function mapNormalizedBoxToSource(
  box: { xmin: number; ymin: number; xmax: number; ymax: number },
  letterbox: LetterboxTensor
): { left: number; top: number; width: number; height: number } {
  const resizedWidth = Math.round(letterbox.srcWidth * letterbox.scale);
  const resizedHeight = Math.round(letterbox.srcHeight * letterbox.scale);

  const xMin = (box.xmin * BLAZE_SIZE - letterbox.padX) / resizedWidth;
  const xMax = (box.xmax * BLAZE_SIZE - letterbox.padX) / resizedWidth;
  const yMin = (box.ymin * BLAZE_SIZE - letterbox.padY) / resizedHeight;
  const yMax = (box.ymax * BLAZE_SIZE - letterbox.padY) / resizedHeight;

  const left = clamp(Math.floor(xMin * letterbox.srcWidth), 0, letterbox.srcWidth - 1);
  const top = clamp(Math.floor(yMin * letterbox.srcHeight), 0, letterbox.srcHeight - 1);
  const right = clamp(Math.ceil(xMax * letterbox.srcWidth), left + 1, letterbox.srcWidth);
  const bottom = clamp(Math.ceil(yMax * letterbox.srcHeight), top + 1, letterbox.srcHeight);

  let width = right - left;
  let height = bottom - top;
  const margin = Math.floor((height - width) / 2);
  const expandedLeft = clamp(left - margin, 0, letterbox.srcWidth - 1);
  const expandedRight = clamp(right + margin, expandedLeft + 1, letterbox.srcWidth);
  width = expandedRight - expandedLeft;
  height = bottom - top;

  return {
    left: expandedLeft,
    top,
    width,
    height
  };
}

export function cropAndNormalizeMobileFaceNet(image: RgbaImage, crop: {
  left: number;
  top: number;
  width: number;
  height: number;
}): Float32Array {
  const cropped = cropRgba(image, crop);
  const resized = resizeRgba(cropped, MOBILE_FACE_SIZE, MOBILE_FACE_SIZE);
  const tensor = new Float32Array(2 * MOBILE_FACE_SIZE * MOBILE_FACE_SIZE * 3);
  const single = normalizeMobileFaceNetFace(resized);

  tensor.set(single, 0);
  tensor.set(single, single.length);
  return tensor;
}

export function averageLuminance(image: RgbaImage): number {
  let sum = 0;
  const pixels = image.width * image.height;
  for (let index = 0; index < image.data.length; index += 4) {
    const r = image.data[index];
    const g = image.data[index + 1];
    const b = image.data[index + 2];
    sum += (r + g + b) / (3 * 255);
  }
  return sum / Math.max(pixels, 1);
}

export function estimateTextureScore(image: RgbaImage): number {
  let transitions = 0;
  const rowStride = image.width * 4;
  for (let y = 0; y < image.height - 1; y += 2) {
    for (let x = 0; x < image.width - 1; x += 2) {
      const index = y * rowStride + x * 4;
      const next = index + 4;
      const below = index + rowStride;
      transitions +=
        Math.abs(image.data[index] - image.data[next]) +
        Math.abs(image.data[index] - image.data[below]);
    }
  }
  const normalized = transitions / (image.width * image.height * 255 * 2);
  return Math.max(0.35, Math.min(0.98, normalized * 6 + 0.35));
}

function normalizeMobileFaceNetFace(image: RgbaImage): Float32Array {
  const tensor = new Float32Array(MOBILE_FACE_SIZE * MOBILE_FACE_SIZE * 3);
  const mean = 127.5;
  const std = 128;

  for (let y = 0; y < MOBILE_FACE_SIZE; y += 1) {
    for (let x = 0; x < MOBILE_FACE_SIZE; x += 1) {
      const pixel = sampleRgba(image, x, y);
      const offset = (y * MOBILE_FACE_SIZE + x) * 3;
      tensor[offset] = (pixel.r - mean) / std;
      tensor[offset + 1] = (pixel.g - mean) / std;
      tensor[offset + 2] = (pixel.b - mean) / std;
    }
  }

  return tensor;
}

function cropRgba(
  image: RgbaImage,
  crop: { left: number; top: number; width: number; height: number }
): RgbaImage {
  const data = new Uint8Array(crop.width * crop.height * 4);
  for (let y = 0; y < crop.height; y += 1) {
    for (let x = 0; x < crop.width; x += 1) {
      const srcIndex = ((crop.top + y) * image.width + (crop.left + x)) * 4;
      const dstIndex = (y * crop.width + x) * 4;
      data[dstIndex] = image.data[srcIndex];
      data[dstIndex + 1] = image.data[srcIndex + 1];
      data[dstIndex + 2] = image.data[srcIndex + 2];
      data[dstIndex + 3] = image.data[srcIndex + 3];
    }
  }
  return { width: crop.width, height: crop.height, data };
}

function resizeRgba(image: RgbaImage, width: number, height: number): RgbaImage {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const srcY = (y / Math.max(height - 1, 1)) * (image.height - 1);
    for (let x = 0; x < width; x += 1) {
      const srcX = (x / Math.max(width - 1, 1)) * (image.width - 1);
      const pixel = sampleRgba(image, srcX, srcY);
      const dstIndex = (y * width + x) * 4;
      data[dstIndex] = pixel.r;
      data[dstIndex + 1] = pixel.g;
      data[dstIndex + 2] = pixel.b;
      data[dstIndex + 3] = 255;
    }
  }
  return { width, height, data };
}

function sampleRgba(image: RgbaImage, x: number, y: number): { r: number; g: number; b: number } {
  const x0 = clamp(Math.floor(x), 0, image.width - 1);
  const y0 = clamp(Math.floor(y), 0, image.height - 1);
  const index = (y0 * image.width + x0) * 4;
  return {
    r: image.data[index],
    g: image.data[index + 1],
    b: image.data[index + 2]
  };
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
