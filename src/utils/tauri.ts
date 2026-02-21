import { invoke as tauriInvoke } from '@tauri-apps/api/core';

/**
 * Check if the app is running in a Tauri context.
 * Returns true when running inside the Tauri webview, false in browser.
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * Safe wrapper around Tauri's invoke that throws a clear error
 * when called outside of Tauri context.
 */
export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) {
    throw new Error(
      `Tauri API not available. Make sure to run the app with "npm run tauri dev" instead of "npm run dev".`
    );
  }
  return tauriInvoke<T>(cmd, args);
}
