import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: any) {
    if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
    }
}

const NAV_RETRY_MS = 400;
const NAV_RETRY_COUNT = 5;

/**
 * Navigate when answering a call from native (CallKeep). Native can fire before ref is ready.
 */
export function navigateWithRetry(
    name: keyof RootStackParamList,
    params?: any,
    attempt = 0
): void {
    if (navigationRef.isReady()) {
        console.log('[navigationRef] Navigating to', name, params);
        navigationRef.navigate(name, params);
        return;
    }
    if (attempt < NAV_RETRY_COUNT) {
        console.log('[navigationRef] Ref not ready, retrying in', NAV_RETRY_MS, 'ms, attempt', attempt + 1);
        setTimeout(() => navigateWithRetry(name, params, attempt + 1), NAV_RETRY_MS);
    } else {
        console.warn('[navigationRef] Ref not ready after', NAV_RETRY_COUNT, 'retries, cannot navigate to', name);
    }
}
