import { API_LIST_LIMIT_MAX } from '../constants/apiValues.js';

export function clampApiListLimit(limit, fallback = 50) {
  const parsed = Number(limit);
  const safeLimit = Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
  return Math.max(1, Math.min(API_LIST_LIMIT_MAX, safeLimit));
}

export function clampApiListOffset(offset) {
  const parsed = Number(offset);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}
