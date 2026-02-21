// Hook for managing APK state
import { useState, useCallback } from 'react';
import { invoke } from '../utils/tauri';
import type { ApkInfo } from '../types';

interface UseApkReturn {
    apkInfo: ApkInfo | null;
    loading: boolean;
    error: string | null;
    selectApk: (path: string) => Promise<void>;
    clearApk: () => void;
    scanFolder: (path: string) => Promise<ApkInfo[]>;
    setApkFromList: (info: ApkInfo) => void;
}

export function useApk(): UseApkReturn {
    const [apkInfo, setApkInfo] = useState<ApkInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectApk = useCallback(async (path: string) => {
        setLoading(true);
        setError(null);

        try {
            const info = await invoke<ApkInfo | null>('validate_apk', { path });
            if (info) {
                if (info.valid) {
                    setApkInfo(info);
                } else {
                    setError('Invalid APK file');
                }
            } else {
                setError('File not found');
            }
        } catch (err) {
            setError('Failed to validate APK');
        } finally {
            setLoading(false);
        }
    }, []);
    const scanFolder = useCallback(async (path: string) => {
        setLoading(true);
        setError(null);
        try {
            const apks = await invoke<ApkInfo[]>('scan_apks_in_folder', { path });
            return apks;
        } catch (err) {
            setError('Failed to scan folder');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const clearApk = useCallback(() => {
        setApkInfo(null);
        setError(null);
    }, []);

    const setApkFromList = useCallback((info: ApkInfo) => {
        setApkInfo(info);
        setError(null);
    }, []);


    return {
        apkInfo,
        loading,
        error,
        selectApk,
        clearApk,
        scanFolder,
        setApkFromList
    };
}
