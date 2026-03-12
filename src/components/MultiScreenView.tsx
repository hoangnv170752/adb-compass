import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, Reorder } from 'framer-motion';
import {
    ArrowLeft, Smartphone, Maximize2, Minimize2, MonitorX,
    Camera, Link, Link2Off, GripVertical
} from 'lucide-react';
import { invoke } from '../utils/tauri';
import { toast } from 'sonner';
import { StreamPlayer } from './device/StreamPlayer';
import type { DeviceInfo } from '../types';

interface MultiScreenViewProps {
    devices: DeviceInfo[];
    onBack: () => void;
}

interface DeviceStreamState {
    running: boolean;
    loading: boolean;
    error: string | null;
}

function useScrcpyStream(deviceId: string) {
    const [state, setState] = useState<DeviceStreamState>({
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
                if (!cancelled) setState({ running: true, loading: false, error: null });
            } catch (e) {
                if (!cancelled) setState({ running: false, loading: false, error: String(e) });
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
    syncEnabled: boolean;
    allDeviceIds: string[];
    onFocus: () => void;
    onExpand: () => void;
}

function DevicePanel({ device, focused, syncEnabled, allDeviceIds, onFocus, onExpand }: PanelProps) {
    const stream = useScrcpyStream(device.id);
    const label = device.model || device.id;

    const handleTouch = useCallback(async (x: number, y: number, action: 'down' | 'up' | 'move') => {
        const actionMap = { down: 0, up: 1, move: 2 };
        const targets = syncEnabled
            ? allDeviceIds
            : [device.id];
        await Promise.allSettled(
            targets.map(id =>
                invoke('scrcpy_touch', { deviceId: id, action: actionMap[action], x, y })
            )
        );
    }, [device.id, syncEnabled, allDeviceIds]);

    const handleScroll = useCallback(async (x: number, y: number, deltaX: number, deltaY: number) => {
        const targets = syncEnabled ? allDeviceIds : [device.id];
        await Promise.allSettled(
            targets.map(id =>
                invoke('scrcpy_scroll', { deviceId: id, x, y, deltaX, deltaY })
            )
        );
    }, [device.id, syncEnabled, allDeviceIds]);

    return (
        <div
            className={`relative flex flex-col bg-surface-card border rounded-2xl overflow-hidden transition-colors duration-200 min-h-0
                ${focused ? 'border-accent shadow-lg shadow-accent/20' : 'border-border hover:border-accent/50'}`}
            onClick={onFocus}
        >
            {/* Panel header */}
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-surface-elevated border-b border-border flex-shrink-0 cursor-grab active:cursor-grabbing select-none">
                <GripVertical size={12} className="text-text-muted flex-shrink-0" />
                <Smartphone size={12} className="text-accent flex-shrink-0" />
                <span className="text-[11px] font-medium text-text-primary truncate flex-1">{label}</span>
                <span className="font-mono text-[9px] text-text-muted hidden sm:block">{device.id}</span>
                {syncEnabled && (
                    <span className="text-[9px] text-accent font-medium px-1 py-0.5 rounded bg-accent/10">SYNC</span>
                )}
                {focused && !syncEnabled && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse flex-shrink-0" />
                )}
                <button
                    onClick={e => { e.stopPropagation(); onExpand(); }}
                    className="p-0.5 rounded hover:bg-surface-hover text-text-muted hover:text-accent transition-colors flex-shrink-0"
                    title="Expand"
                >
                    <Maximize2 size={11} />
                </button>
            </div>

            {/* Stream area */}
            <div className="flex-1 relative flex items-center justify-center bg-black min-h-0 overflow-hidden">
                {stream.loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 bg-black">
                        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] text-text-muted">Connecting...</span>
                    </div>
                )}
                {stream.error && !stream.loading && (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <MonitorX size={24} className="text-error opacity-50" />
                        <span className="text-[10px] text-text-muted leading-relaxed">{stream.error}</span>
                    </div>
                )}
                {stream.running && !stream.error && (
                    <StreamPlayer
                        deviceId={device.id}
                        width={720}
                        height={1280}
                        allowTouch={focused || syncEnabled}
                        showFps={focused}
                        allowKeyboard={focused}
                        onTouch={handleTouch}
                        onScroll={handleScroll}
                    />
                )}
            </div>
        </div>
    );
}

export function MultiScreenView({ devices, onBack }: MultiScreenViewProps) {
    const connected = devices.filter(d => d.status === 'Device');
    const [order, setOrder] = useState<DeviceInfo[]>(connected);
    const [focusedId, setFocusedId] = useState<string | null>(connected[0]?.id ?? null);
    const [fullscreenId, setFullscreenId] = useState<string | null>(null);
    const [syncEnabled, setSyncEnabled] = useState(false);
    const [snapshotting, setSnapshotting] = useState(false);

    // Keep order in sync when devices change (new connect/disconnect)
    const prevConnectedRef = useRef(connected);
    useEffect(() => {
        const prev = prevConnectedRef.current;
        const prevIds = new Set(prev.map(d => d.id));
        const currIds = new Set(connected.map(d => d.id));
        const same = prev.length === connected.length && connected.every(d => prevIds.has(d.id));
        if (!same) {
            setOrder(o => {
                const kept = o.filter(d => currIds.has(d.id));
                const added = connected.filter(d => !prevIds.has(d.id));
                return [...kept, ...added];
            });
        }
        prevConnectedRef.current = connected;
    }, [connected.map(d => d.id).join(',')]);

    const allDeviceIds = order.map(d => d.id);

    const handleSnapshotAll = async () => {
        if (snapshotting) return;
        setSnapshotting(true);
        const savePath = localStorage.getItem('captureSavePath') ?? undefined;
        const results = await Promise.allSettled(
            connected.map(d =>
                invoke<{ success: boolean; path?: string; error?: string }>('take_screenshot', {
                    deviceId: d.id,
                    customSavePath: savePath ?? null,
                })
            )
        );
        const succeeded = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.success).length;
        const failed = results.length - succeeded;
        if (succeeded > 0) toast.success(`Saved ${succeeded} screenshot${succeeded > 1 ? 's' : ''}`);
        if (failed > 0) toast.error(`${failed} screenshot${failed > 1 ? 's' : ''} failed`);
        setSnapshotting(false);
    };

    const gridClass = () => {
        const n = fullscreenId ? 1 : order.length;
        if (n <= 1) return 'grid-cols-1';
        if (n === 2) return 'grid-cols-2';
        if (n <= 4) return 'grid-cols-2';
        return 'grid-cols-3';
    };

    const displayDevices = fullscreenId
        ? order.filter(d => d.id === fullscreenId)
        : order;

    return (
        <motion.div
            className="h-full flex flex-col"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                <button
                    onClick={onBack}
                    className="p-2.5 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all border border-transparent hover:border-border"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-text-primary">Multi-Screen View</h2>
                    <p className="text-[11px] text-text-muted truncate">
                        {connected.length} device{connected.length !== 1 ? 's' : ''}
                        {focusedId && !syncEnabled && ` · Active: ${connected.find(d => d.id === focusedId)?.model || focusedId}`}
                        {syncEnabled && ' · Sync ON — touch broadcasts to all'}
                    </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!fullscreenId && (
                        <button
                            onClick={handleSnapshotAll}
                            disabled={snapshotting}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-text-secondary hover:text-accent hover:border-accent text-xs transition-all disabled:opacity-50"
                            title="Snapshot All Devices"
                        >
                            <Camera size={13} className={snapshotting ? 'animate-pulse' : ''} />
                            <span>Snapshot All</span>
                        </button>
                    )}

                    {!fullscreenId && (
                        <button
                            onClick={() => setSyncEnabled(v => !v)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all
                                ${syncEnabled
                                    ? 'bg-accent text-white border-accent shadow-md shadow-accent/25'
                                    : 'bg-surface-elevated border-border text-text-secondary hover:text-accent hover:border-accent'
                                }`}
                            title={syncEnabled ? 'Disable synchronized touch' : 'Enable synchronized touch'}
                        >
                            {syncEnabled ? <Link size={13} /> : <Link2Off size={13} />}
                            <span>Sync</span>
                        </button>
                    )}

                    {/* Focus / Show All */}
                    {fullscreenId ? (
                        <button
                            onClick={() => setFullscreenId(null)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-text-secondary hover:text-text-primary text-xs transition-all"
                        >
                            <Minimize2 size={13} />
                            <span>Show All</span>
                        </button>
                    ) : focusedId ? (
                        <button
                            onClick={() => setFullscreenId(focusedId)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-text-secondary hover:text-accent hover:border-accent text-xs transition-all"
                        >
                            <Maximize2 size={13} />
                            <span>Focus</span>
                        </button>
                    ) : null}
                </div>
            </div>

            {connected.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-muted">
                    <MonitorX size={48} className="opacity-30" />
                    <p className="text-sm">No connected devices to display</p>
                    <button
                        onClick={onBack}
                        className="px-4 py-2 rounded-lg bg-surface-elevated border border-border text-sm hover:border-accent transition-all"
                    >
                        Go Back
                    </button>
                </div>
            ) : fullscreenId ? (
                <div className="flex-1 min-h-0">
                    {displayDevices.map(device => (
                        <DevicePanel
                            key={device.id}
                            device={device}
                            focused={true}
                            syncEnabled={false}
                            allDeviceIds={allDeviceIds}
                            onFocus={() => setFocusedId(device.id)}
                            onExpand={() => setFullscreenId(null)}
                        />
                    ))}
                </div>
            ) : (
                <Reorder.Group
                    axis="x"
                    values={order}
                    onReorder={setOrder}
                    className={`flex-1 grid ${gridClass()} gap-3 min-h-0`}
                    as="div"
                >
                    {order.map(device => (
                        <Reorder.Item key={device.id} value={device} as="div" className="min-h-0">
                            <DevicePanel
                                device={device}
                                focused={focusedId === device.id}
                                syncEnabled={syncEnabled}
                                allDeviceIds={allDeviceIds}
                                onFocus={() => setFocusedId(device.id)}
                                onExpand={() => setFullscreenId(device.id)}
                            />
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            )}
        </motion.div>
    );
}
