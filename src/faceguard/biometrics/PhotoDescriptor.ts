import * as FileSystem from 'expo-file-system';
import { cosineSimilarity, normalizeEmbedding } from '../model/vector';

export type PhotoDescriptor = {
  vector: number[];
  qualityScore: number;
  byteLength: number;
};

const HISTOGRAM_BINS = 96;
const MAX_READ_BYTES = 512_000;

export async function createPhotoDescriptor(photoPath: string): Promise<PhotoDescriptor> {
  const uri = photoPath.startsWith('file://') ? photoPath : `file://${photoPath}`;
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    throw new Error('Captured photo is not available on disk.');
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
    length: MAX_READ_BYTES,
    position: 0
  });

  const histogram = Array.from({ length: HISTOGRAM_BINS }, () => 0);
  let transitions = 0;
  let previousCode = 0;

  for (let index = 0; index < base64.length; index += 1) {
    const code = base64.charCodeAt(index);
    histogram[code % HISTOGRAM_BINS] += 1;
    transitions += Math.abs(code - previousCode);
    previousCode = code;
  }

  const normalized = normalizeEmbedding(histogram);
  const entropyProxy = transitions / Math.max(base64.length, 1) / 64;
  const qualityScore = Math.max(0, Math.min(1, entropyProxy));

  return {
    vector: normalized,
    qualityScore,
    byteLength: base64.length
  };
}

export function comparePhotoDescriptors(a: PhotoDescriptor, b: PhotoDescriptor): number {
  return Number(cosineSimilarity(a.vector, b.vector).toFixed(4));
}

export function estimateSequenceLiveness(descriptors: PhotoDescriptor[]): number {
  if (descriptors.length < 2) {
    return 0;
  }

  const deltas: number[] = [];
  for (let index = 1; index < descriptors.length; index += 1) {
    deltas.push(1 - comparePhotoDescriptors(descriptors[index - 1], descriptors[index]));
  }

  const averageMotion = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  const averageQuality =
    descriptors.reduce((sum, descriptor) => sum + descriptor.qualityScore, 0) / descriptors.length;

  return Number(Math.max(0, Math.min(1, averageMotion * 7 + averageQuality * 0.25)).toFixed(4));
}
