import { EnrolledIdentity } from '../types/faceguard';
import { normalizeEmbedding } from './model/vector';

const baseEmbedding = normalizeEmbedding(
  Array.from({ length: 512 }, (_, index) => {
    const wave = Math.sin(index * 0.23) + Math.cos(index * 0.07);
    return Number((wave / 2).toFixed(6));
  })
);

export const SAMPLE_IDENTITIES: EnrolledIdentity[] = [
  {
    userId: 'DL-FIELD-1027',
    name: 'Aarav Sharma',
    role: 'Remote Field Operator',
    embedding: baseEmbedding,
    updatedAt: '2026-05-22T09:00:00.000Z'
  }
];
