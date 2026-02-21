import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { invoke } from '../utils/tauri';
import { listen } from '@tauri-apps/api/event';
import { toast } from 'sonner';
import type { DeviceInfo, AdbStatus } from '../types';
import { useLanguage } from './LanguageContext';

interface DeviceContextType {
    devices: DeviceInfo[];
    adbStatus: AdbStatus | null;
    loading: boolean;
    error: string | null;
    refreshDevices: () => Promise<void>;
    checkAdb: () => Promise<AdbStatus | null>;
    removeDevice: (deviceId: string) => void;
    addManualDevice: (ip: string) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

const STORAGE_KEY = 'adb-compass-devices';

export function DeviceProvider({ children }: { children: React.ReactNode }) {
    // Load initial state from local storage
    const [devices, setDevices] = useState<DeviceInfo[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load devices from storage', e);
        }
        return [];
    });

    const [adbStatus, setAdbStatus] = useState<AdbStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();

    // Ref to track previous devices for notifications
    const prevDevicesRef = useRef<DeviceInfo[]>(devices);

    // Persist devices to local storage whenever they change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));

        // Check for connections/disconnections to show toasts
        // We only toast for "Online" devices, not offline/unauthorized status changes
        const prevIds = new Set(prevDevicesRef.current.filter(d => d.status === 'Device').map(d => d.id));
        const currentIds = new Set(devices.filter(d => d.status === 'Device').map(d => d.id));

        // New connections
        devices.forEach(d => {
            if (d.status === 'Device' && !prevIds.has(d.id)) {
                toast.success(t.deviceConnected, { description: d.model || d.id });
            }
        });

        // Disconnections (change to Offline) relies on currentIds not having it
        // But since we persist them as Offline, we detect status change instead
        prevDevicesRef.current.forEach(prev => {
            if (prev.status === 'Device' && !currentIds.has(prev.id)) {
                toast.info(t.deviceDisconnected, { description: prev.model || prev.id });
            }
        });

        prevDevicesRef.current = devices;
    }, [devices, t]);

    // Merge logic:
    // 1. New list from ADB (freshDevices) are the source of truth for "Online/Unauthorized".
    // 2. Old list (devices) contains "Offline" devices or devices that might have just disconnected.
    // 3. Goal: Keep all currently known devices.
    //    - If in freshDevices -> Update status/info.
    //    - If NOT in freshDevices but WAS in old list -> Mark as Offline.
    const mergeDevices = useCallback(async (freshDevices: DeviceInfo[]) => {
        setDevices(prev => {
            const freshMap = new Map(freshDevices.map(d => [d.id, d]));
            const merged: DeviceInfo[] = [];

            // Process previous devices
            prev.forEach(p => {
                if (freshMap.has(p.id)) {
                    // Determine if we need to update
                    // Always take fresh data for active devices
                    merged.push(freshMap.get(p.id)!);
                    freshMap.delete(p.id); // Remove from map so we know it's handled
                } else {
                    // Device is no longer in fresh list -> Mark as Offline
                    // Preserve existing Model/Product info so it doesn't look blank
                    merged.push({ ...p, status: 'Offline' });
                }
            });

            // Add any NEW devices that weren't in previous list
            freshMap.forEach(d => merged.push(d));

            return merged;
        });
    }, []);

    const checkAdb = useCallback(async () => {
        try {
            const status = await invoke<AdbStatus>('check_adb_status');
            setAdbStatus(status);
            return status;
        } catch (err) {
            console.error('Failed to check ADB status', err);
            // Don't set global error here to avoid blocking UI if just ADB check fails
            return null;
        }
    }, []);

    const refreshDevices = useCallback(async () => {
        setLoading(true);
        const startTime = Date.now();
        try {
            // We purposefully don't clear current devices to avoid flicker
            // We just fetch new ones and merge
            const freshDevices = await invoke<DeviceInfo[]>('refresh_devices');
            await mergeDevices(freshDevices);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get devices';
            setError(errorMessage);
        } finally {
            // Ensure animation lasts at least 500ms for visual feedback
            const elapsed = Date.now() - startTime;
            if (elapsed < 500) {
                await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
            }
            setLoading(false);
        }
    }, [mergeDevices]);


    const removeDevice = useCallback((deviceId: string) => {
        setDevices(prev => prev.filter(d => d.id !== deviceId));
    }, []);

    const addManualDevice = useCallback((ip: string) => {
        // Add a placeholder device immediately
        const newDevice: DeviceInfo = {
            id: ip,
            status: 'Offline', // Will update to Device/Unauthorized once connected
            model: 'Connecting...',
            product: ip,
        };

        setDevices(prev => {
            if (prev.find(d => d.id === ip)) return prev;
            return [...prev, newDevice];
        });

        // Trigger a refresh/connect attempt logic if needed (usually handled by separate command)
        // For now, assume user will call connect command separately or this just adds to list
    }, []);

    // Auto-connect wireless devices that are offline
    const isReconnectingRef = useRef(false);
    useEffect(() => {
        const reconnectOfflineWireless = async () => {
            if (isReconnectingRef.current) return;

            const offlineWireless = devices.filter(d =>
                d.status === 'Offline' && 
                d.id.includes('.') && 
                d.id.includes(':')
            );

            if (offlineWireless.length === 0) return;

            isReconnectingRef.current = true;
            try {
                // Try to connect to all offline wireless devices
                const promises = offlineWireless.map(async (device) => {
                    try {
                        const [ip, port] = device.id.split(':');
                        await invoke('connect_wireless', { ip, port: port || '5555' });
                    } catch (e) {
                        // Ignore background connection errors
                    }
                });
                
                await Promise.all(promises);

                // If we attempted connections, trigger a refresh to see if they hooked up
                const freshDevices = await invoke<DeviceInfo[]>('get_devices');
                mergeDevices(freshDevices);
            } finally {
                isReconnectingRef.current = false;
            }
        };

        const interval = setInterval(reconnectOfflineWireless, 15000); // Check every 15s instead of 30s
        reconnectOfflineWireless(); // Run immediately on mount or status change

        return () => clearInterval(interval);
        // We watch for changes in the count of offline wireless devices to trigger immediately
    }, [devices.filter(d => d.status === 'Offline' && d.id.includes(':')).length, mergeDevices]);

    // Initialize
    useEffect(() => {
        checkAdb();
        refreshDevices();

        // Listen for backend events
        const unlisten = listen<{ devices: DeviceInfo[] }>('device-changed', (event) => {
            mergeDevices(event.payload.devices);
            // We don't set loading to false here to avoid interfering with manual refresh animation
            // The initial load and manual refreshes are handled by refreshDevices()
        });

        return () => {
            unlisten.then(fn => fn());
        };
    }, [checkAdb, refreshDevices]);

    return (
        <DeviceContext.Provider value={{
            devices,
            adbStatus,
            loading,
            error,
            refreshDevices,
            checkAdb,
            removeDevice,
            addManualDevice
        }}>
            {children}
        </DeviceContext.Provider>
    );
}

export function useDeviceContext() {
    const context = useContext(DeviceContext);
    if (context === undefined) {
        throw new Error('useDeviceContext must be used within a DeviceProvider');
    }
    return context;
}
