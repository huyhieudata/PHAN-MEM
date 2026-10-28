import { useSyncExternalStore } from 'react';
import { hr } from '../data/repositories';
import type { HrState } from '../data/types';

export function useHr(): HrState {
  return useSyncExternalStore(hr.subscribe, hr.getState, hr.getState);
}
