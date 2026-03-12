import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Smartphone, Maximize2, Minimize2, MonitorX } from 'lucide-react';
import { invoke } from '../utils/tauri';
import { StreamPlayer } from './device/StreamPlayer';
import type { DeviceInfo } from '../types';

interface MultiScreenViewProps {
    devices: DeviceInfo[];
    onBack: () => void;
}

interface DeviceStreamState {
    deviceId: string;
    running: boolean;
    loading: boolean;
    error: string | null;
}

function useScrcpyStream(deviceId: string) {
    const [state, setState] = useState<DeviceStreamState>({
        deviceId,
        running: false,
        loading: true,
        error: null,
    });

    useEffect(() => {
        let cancelled = false;

        const start = async () => {
            setState(s => ({ ...s, loading: true, error: null }));
            try {
                const status = await invoke<{ running: boolean }>('get_scrcpy_status', { deviceId });
                if (!status.running) {
                    await invoke('start_scrcpy_server', {
                        deviceId,
                        maxSize: 720,
                        bitRate: 2000000,
                        maxFps: 30,
                    });
                }
                if (!cancelled) setState(s => ({ ...s, running: true, loading: false }));
            } catch (e) {
                if (!cancelled) setState(s => ({ ...s, loading: false, error: String(e) }));
            }
        };

        start();
        return () => { cancelled = true; };
    }, [deviceId]);

    return state;
}

interface PanelProps {
    device: DeviceInfo;
    focused: boolean;
    onFocus: () => void;
}

function DevicePanel({ device, focused, onFocus }: PanelProps) {
    const stream = useScrcpyStream(device.id);
    const label = device.model || device.id;

    return (
        <motion.div
            layout
            className={`relative flex flex-col bg-surface-card border rounded-2xl overflow-hidden transition-all duration-200
                ${focused ? 'border-accent shadow-lg shadow-accent/20' : 'border-border hover:border-accent/50'}`}
            onClick={onFocus}
        >
            {/* Panel header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-elevated border-b border-border flex-shrink-0">
                <Smartphone size={14} className="text-accent" />
                <span className="text-xs font-medium text-text-primary truncate flex-1">{label}</span>
                <span className="font-mono text-[10px] text-text-muted">{device.id}</span>
                {focused && (
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                )}
            </div>

            {/* Stream area */}
            <div className="flex-1 relative flex items-center justify-center bg-black min-h-0">
                {stream.loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] text-text-muted">Connecting...</span>
                    </div>
                )}

                {stream.error && (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <MonitorX size={28} className="text-error opacity-60" />
                        <span className="text-[10px] text-text-muted leading-relaxed">{stream.error}</span>
                    </div>
                )}

                {stream.running && !stream.error && (
                    <StreamPlayer
                        deviceId={device.id}
                        width={720}
                        height={1280}
                        allowTouch={focused}
                        showFps={focused}
                        allowKeyboard={focused}
                    />
                )}
            </div>
        </motion.div>
    );
}

export function MultiScreenView({ devices, onBack }: MultiScreenViewProps) {
    const [focusedId, setFocusedId] = useState<string | null>(
        devices[0]?.id ?? null
    );
    const [fullscreenId, setFullscreenId] = useState<string | null>(null);

    const connected = devices.filter(d => d.status === 'Device');

    const gridClass = () => {
        const n = fullscreenId ? 1 : connected.length;
        if (n === 1) return 'grid-cols-1';
        if (n === 2) return 'grid-cols-2';
        if (n <= 4) return 'grid-cols-2';
        return 'grid-cols-3';
    };

    const displayDevices = fullscreenId
        ? connected.filter(d => d.id === fullscreenId)
        : connected;

    return (
        <motion.div
            className="h-full flex flex-col"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-4 flex-shrink-0">
                <button
                    onClick={onBack}
                    className="p-2.5 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all border border-transparent hover:border-border"
                >
                    <ArrowLeft size={22} />
                </button>

                <div className="flex-1">
                    <h2 className="text-lg font-bold text-text-primary">Multi-Screen View</h2>
                    <p className="text-xs text-text-muted">
                        {connected.length} device{connected.length !== 1 ? 's' : ''} connected
                        {focusedId && ` · Active: ${connected.find(d => d.id === focusedId)?.model || focusedId}`}
                    </p>
                </div>

                {fullscreenId ? (
                    <button
                        onClick={() => setFullscreenId(null)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-text-secondary hover:text-text-primary text-xs transition-all"
                    >
                        <Minimize2 size={14} />
                        <span>Show All</span>
                    </button>
                ) : focusedId ? (
                    <button
                        onClick={() => setFullscreenId(focusedId)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-text-secondary hover:text-accent text-xs transition-all"
                    >
                        <Maximize2 size={14} />
                        <span>Focus</span>
                    </button>
                ) : null}
            </div>

            {connected.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-muted">
                    <MonitorX size={56} className="opacity-30" />
                    <p className="text-sm">No connected devices to display</p>
                    <button
                        onClick={onBack}
                        className="px-4 py-2 rounded-lg bg-surface-elevated border border-border text-sm hover:border-accent transition-all"
                    >
                        Go Back
                    </button>
                </div>
            ) : (
                <div className={`flex-1 grid ${gridClass()} gap-3 min-h-0`}>
                    {displayDevices.map(device => (
                        <DevicePanel
                            key={device.id}
                            device={device}
                            focused={focusedId === device.id}
                            onFocus={() => setFocusedId(device.id)}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
}
