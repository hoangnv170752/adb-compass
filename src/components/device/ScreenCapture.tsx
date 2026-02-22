// Screen Capture Tab - Screenshot and Screen Recording
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Camera, Video, VideoOff, RefreshCw,
    FolderOpen, Image, ExternalLink, Zap, Settings,
    Home, Square, Power, Volume2, Volume1, VolumeX,
    Menu, Sun, Moon, Bell, Play, Triangle
} from 'lucide-react';
import { invoke } from '../../utils/tauri';
import { save } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';
import { DeviceInfo } from '../../types';
import { listItem } from '../../lib/animations';
import { StreamPlayer } from './StreamPlayer';
import { useLanguage } from '../../contexts/LanguageContext';

interface ScreenCaptureProps {
    device: DeviceInfo;
}

interface CaptureResult {
    success: boolean;
    path?: string;
    error?: string;
}

interface ScrcpyStatus {
    running: boolean;
    device_id: string | null;
    port: number | null;
}

type StreamMode = 'standard' | 'high-perf';

export function ScreenCapture({ device }: ScreenCaptureProps) {
    const [isCapturing, setIsCapturing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const { t } = useLanguage();

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [aspectRatio, setAspectRatio] = useState<number>(9 / 19.5); // Default modern phone ratio
    const [isLive, setIsLive] = useState(false);
    const [showFps, setShowFps] = useState(true);
    const [allowTouch, setAllowTouch] = useState(false);
    const [isMirroring, setIsMirroring] = useState(false);

    const handleStopMirror = async () => {
        setIsMirroring(false);
        try {
            const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
            const label = `mirror-${device.id.replace(/\./g, '_').replace(/:/g, '__')}`;
            const webview = await WebviewWindow.getByLabel(label);
            if (webview) {
                await webview.close();
            }
        } catch (e) {
            console.error('Failed to close mirror window:', e);
        }
    };

    const handleStartMirror = async () => {
        if (isMirroring) return;

        try {
            const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
            const label = `mirror-${device.id.replace(/\./g, '_').replace(/:/g, '__')}`;

            // Check if already exists
            const existing = await WebviewWindow.getByLabel(label);
            if (existing) {
                await existing.setFocus();
                setIsMirroring(true);
                return;
            }

            // Dynamic size calculation
            const targetHeight = 850;
            const headerHeight = 48;
            const padding = 16;
            const sidebarWidth = 48; // w-12
            const gap = 12; // gap-3

            const availableVideoHeight = targetHeight - headerHeight - padding;
            const calculatedVideoWidth = availableVideoHeight * (screenWidth / screenHeight);
            const targetWidth = Math.round(calculatedVideoWidth + sidebarWidth + gap + padding);

            const webview = new WebviewWindow(label, {
                title: `Mirror - ${device.model || device.id}`,
                width: targetWidth,
                height: targetHeight,
                resizable: true,
                decorations: true,
                alwaysOnTop: true,
            });

            webview.once('tauri://created', () => {
                setIsMirroring(true);
                toast.success("Mirror window opened");
            });

            webview.once('tauri://error', (e) => {
                console.error("Window error:", e);
                toast.error("Failed to create window");
            });

            // Handle window close to restore UI
            webview.onCloseRequested(() => {
                console.log("[ScreenCapture] Mirror window closed, restoring main preview");
                setIsMirroring(false);
            });

            // Fallback: lắng nghe sự kiện destroy nếu onCloseRequested không bắt được
            webview.once('tauri://destroyed', () => {
                setIsMirroring(false);
            });

        } catch (e) {
            console.error('Failed to open mirror window:', e);
            toast.error("Failed to open mirror window");
        }
    };

    // High-performance mode state
    const [streamMode, setStreamMode] = useState<StreamMode>('standard');
    const [scrcpyStatus, setScrcpyStatus] = useState<ScrcpyStatus | null>(null);
    const [isStartingScrcpy, setIsStartingScrcpy] = useState(false);
    const [screenWidth, setScreenWidth] = useState(1080);
    const [screenHeight, setScreenHeight] = useState(2340);

    // Fetch device aspect ratio and resolution
    useEffect(() => {
        const fetchProps = async () => {
            try {
                const props = await invoke<{ screen_resolution: string | null }>('get_device_props', { deviceId: device.id });
                if (props.screen_resolution) {
                    // scrcpy server usually uses physical size (e.g. "Physical size: 1080x2340")
                    const resMatch = props.screen_resolution.match(/(?:Physical|Override) size: (\d+)x(\d+)/);
                    if (resMatch) {
                        const w = parseInt(resMatch[1]);
                        const h = parseInt(resMatch[2]);
                        console.log(`[ScreenCapture] Device resolution detected: ${w}x${h}`);
                        setAspectRatio(w / h);
                        setScreenWidth(w);
                        setScreenHeight(h);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch device props:', e);
            }
        };
        fetchProps();
    }, [device.id]);

    // Check if mirror window already exists on mount
    useEffect(() => {
        const checkExisting = async () => {
            try {
                const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
                const label = `mirror-${device.id.replace(/\./g, '_').replace(/:/g, '__')}`;
                const existing = await WebviewWindow.getByLabel(label);
                if (existing) {
                    console.log(`[ScreenCapture] Detected existing mirror window for ${device.id}`);
                    setIsMirroring(true);
                }
            } catch (e) {
                console.error('Failed to check existing mirror window:', e);
            }
        };
        checkExisting();
    }, [device.id]);

    // Recording timer
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    // Format recording time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Take screenshot
    const handleScreenshot = async () => {
        setIsCapturing(true);
        try {
            const askBeforeSave = localStorage.getItem('askBeforeSave') === 'true';
            const captureSavePath = localStorage.getItem('captureSavePath');

            let customSavePath: string | undefined = undefined;
            if (askBeforeSave) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const defaultFilename = `screenshot-${device.id}-${timestamp}.png`;
                const selected = await save({
                    defaultPath: `${captureSavePath}/${defaultFilename}`,
                    filters: [{ name: 'Image', extensions: ['png'] }]
                });
                if (!selected) return; // User cancelled
                customSavePath = selected;
            }

            const result = await invoke<CaptureResult>('take_screenshot', {
                deviceId: device.id,
                customSavePath
            });

            if (result.success && result.path) {
                toast.success(t.screenshotSaved, {
                    description: result.path
                });
            } else {
                toast.error(t.screenshotFailed, {
                    description: result.error || t.unknown
                });
            }
        } catch (error) {
            toast.error(t.screenshotFailed, {
                description: String(error)
            });
        } finally {
            setIsCapturing(false);
        }
    };

    // Start/stop recording
    const handleRecordingToggle = async () => {
        if (isRecording) {
            // Stop recording
            try {
                const askBeforeSave = localStorage.getItem('askBeforeSave') === 'true';
                const captureSavePath = localStorage.getItem('captureSavePath');

                let customSavePath: string | undefined = undefined;
                if (askBeforeSave) {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const defaultFilename = `recording-${device.id}-${timestamp}.mp4`;
                    const selected = await save({
                        defaultPath: `${captureSavePath}/${defaultFilename}`,
                        filters: [{ name: 'Video', extensions: ['mp4'] }]
                    });
                    if (!selected) return; // User cancelled
                    customSavePath = selected;
                }

                const result = await invoke<CaptureResult>('stop_screen_recording', {
                    deviceId: device.id,
                    customSavePath
                });

                setIsRecording(false);
                setRecordingTime(0);

                if (result.success && result.path) {
                    toast.success(t.recordingSaved, {
                        description: result.path
                    });
                }
            } catch (error) {
                toast.error(t.failedToStopRecording, {
                    description: String(error)
                });
            }
        } else {
            // Start recording
            try {
                await invoke('start_screen_recording', {
                    deviceId: device.id
                });
                setIsRecording(true);
                toast.info(t.recordingStarted);
            } catch (error) {
                toast.error(t.failedToStartRecording, {
                    description: String(error)
                });
            }
        }
    };

    // Refresh screen preview
    const handleRefreshPreview = async () => {
        setIsLoadingPreview(true);
        const startTime = Date.now();
        try {
            const result = await invoke<number[]>('get_screen_frame', {
                deviceId: device.id
            });

            if (result && result.length > 0) {
                // Convert to base64
                const bytes = new Uint8Array(result);
                const blob = new Blob([bytes], { type: 'image/png' });
                const url = URL.createObjectURL(blob);
                setPreviewImage(url);
            }
        } catch (error) {
            toast.error(t.failedToGetScreenPreview, {
                description: String(error)
            });
        } finally {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 500 - elapsed);
            setTimeout(() => setIsLoadingPreview(false), remaining);
        }
    };

    // Live loop
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isLive) {
            interval = setInterval(() => {
                if (!isLoadingPreview && !isCapturing) {
                    handleRefreshPreview();
                }
            }, 1000); // 1 FPS fallback for ADB
        }
        return () => clearInterval(interval);
    }, [isLive, isLoadingPreview, isCapturing]);

    // Touch Event Handler
    const handleTouch = async (e: React.MouseEvent<HTMLDivElement>) => {
        if (!allowTouch || !previewImage) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const xPercent = (e.clientX - rect.left) / rect.width;
        const yPercent = (e.clientY - rect.top) / rect.height;

        // Fetch real resolution to map coordinates
        try {
            const props = await invoke<{ screen_resolution: string | null }>('get_device_props', { deviceId: device.id });
            if (props.screen_resolution) {
                const [w, h] = props.screen_resolution.replace('Physical size: ', '').replace('Override size: ', '').split('x').map(Number);
                if (w && h) {
                    const tapX = Math.round(xPercent * w);
                    const tapY = Math.round(yPercent * h);

                    await invoke('input_tap', { deviceId: device.id, x: tapX, y: tapY });

                    // Visual feedback
                    toast.success(`Tap: ${tapX}, ${tapY}`, { duration: 500 });
                }
            }
        } catch (error) {
            console.error('Touch failed', error);
        }
    };

    // Open Save Folder
    const handleOpenFolder = async () => {
        try {
            const captureSavePath = localStorage.getItem('captureSavePath');
            await invoke('open_captures_folder', { customSavePath: captureSavePath });
            toast.success(t.folderOpened);
        } catch (error) {
            toast.error(t.failedToOpenFolder, { description: String(error) });
        }
    };

    // Toggle high-performance mode
    const toggleHighPerfMode = async () => {
        if (streamMode === 'standard') {
            // Switch to high-perf mode
            setIsStartingScrcpy(true);
            const startTime = Date.now();
            try {
                console.log('Starting scrcpy server for device:', device.id);
                const status = await invoke<ScrcpyStatus>('start_scrcpy_server', {
                    deviceId: device.id,
                    maxSize: 1024,
                    bitRate: 4000000,
                    maxFps: 60,
                });
                console.log('Scrcpy status:', status);
                setScrcpyStatus(status);
                setStreamMode('high-perf');
                setIsLive(false); // Disable standard live mode
                toast.success(t.highPerfModeEnabled, { description: `Streaming on port ${status.port}` });
            } catch (error) {
                console.error('Scrcpy start error:', error);
                const errorMessage = (error as any)?.message || String(error);
                toast.error(t.failedToStartHighPerf, { description: errorMessage });
            } finally {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 500 - elapsed);
                setTimeout(() => setIsStartingScrcpy(false), remaining);
            }
        } else {
            // Switch back to standard mode
            try {
                await invoke('stop_scrcpy_server', { deviceId: device.id });
                setScrcpyStatus(null);
                setStreamMode('standard');
                toast.success(t.switchedToStandardMode);
            } catch (error) {
                toast.error(t.failedToStopHighPerf, { description: String(error) });
            }
        }
    };

    // Scrcpy touch handler
    const handleScrcpyTouch = useCallback(async (x: number, y: number, action: 'down' | 'up' | 'move') => {
        if (!allowTouch) return;
        const actionMap = { down: 0, up: 1, move: 2 };
        try {
            await invoke('scrcpy_touch', {
                deviceId: device.id,
                action: actionMap[action],
                x,
                y,
                width: screenWidth,
                height: screenHeight,
            });
        } catch (error) {
            console.error('Touch failed:', error);
        }
    }, [device.id, allowTouch, screenWidth, screenHeight]);

    // Scrcpy scroll handler
    const handleScrcpyScroll = useCallback(async (x: number, y: number, deltaX: number, deltaY: number) => {
        if (!allowTouch) return;
        try {
            await invoke('scrcpy_scroll', {
                deviceId: device.id,
                x,
                y,
                hScroll: Math.round(deltaX / 120) * -1,
                vScroll: Math.round(deltaY / 120) * -1,
                width: screenWidth,
                height: screenHeight,
            });
        } catch (error) {
            console.error('Scroll failed:', error);
        }
    }, [device.id, allowTouch, screenWidth, screenHeight]);

    // Handle Quick Actions (Key Events)
    const handleKeyEvent = async (keycode: number) => {
        try {
            await invoke('execute_shell', {
                deviceId: device.id,
                command: `input keyevent ${keycode}`
            });
        } catch (error) {
            console.error('Key event failed:', error);
            toast.error(t.failedToKey);
        }
    };

    return (
        <div className="h-full flex gap-4">
            {/* Controls Panel - Expands */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                {/* Top Row - Capture Actions */}
                <motion.div variants={listItem} className="bg-surface-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            <Camera size={16} className="text-accent" />
                            {t.capture}
                        </h4>
                        {isRecording && (
                            <div className="flex items-center gap-1.5 text-error text-sm font-mono">
                                <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                                {formatTime(recordingTime)}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleScreenshot}
                            disabled={isCapturing}
                            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-text-primary rounded-lg transition-all disabled:opacity-50"
                        >
                            {isCapturing ? <RefreshCw size={16} className="animate-spin" /> : <Camera size={16} />}
                            <span className="text-sm font-medium">{t.screenshot}</span>
                        </button>
                        <button
                            onClick={handleRecordingToggle}
                            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${isRecording
                                ? 'bg-error/20 text-error border border-error/30'
                                : 'bg-surface-elevated hover:bg-surface-hover border border-border'
                                }`}
                        >
                            {isRecording ? <VideoOff size={16} /> : <Video size={16} />}
                            <span className="text-sm font-medium">{isRecording ? t.stopRecording : t.record}</span>
                        </button>
                    </div>
                </motion.div>

                {/* Bottom Row - Config & Storage side by side */}
                <div className="flex flex-wrap gap-4">
                    {/* Configuration */}
                    <motion.div variants={listItem} className="flex-1 min-w-[200px] bg-surface-card border border-border rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <Settings size={16} className="text-accent" />
                            {t.configuration}
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-text-secondary">{t.livePreview}</span>
                                <button
                                    onClick={toggleHighPerfMode}
                                    disabled={isStartingScrcpy}
                                    className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 ${streamMode === 'high-perf' ? 'bg-success' : 'bg-surface-elevated border border-border'
                                        } disabled:opacity-50`}
                                >
                                    <motion.div
                                        animate={{ x: streamMode === 'high-perf' ? 16 : 0 }}
                                        className="w-4 h-4 rounded-full bg-white shadow-sm"
                                    />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-text-secondary">{t.enableTouch}</span>
                                <button
                                    onClick={() => setAllowTouch(!allowTouch)}
                                    className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 ${allowTouch ? 'bg-accent' : 'bg-surface-elevated border border-border'
                                        }`}
                                >
                                    <motion.div
                                        animate={{ x: allowTouch ? 16 : 0 }}
                                        className="w-4 h-4 rounded-full bg-white shadow-sm"
                                    />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-text-secondary">{t.showFps}</span>
                                <button
                                    onClick={() => setShowFps(!showFps)}
                                    className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 ${showFps ? 'bg-accent' : 'bg-surface-elevated border border-border'
                                        }`}
                                >
                                    <motion.div
                                        animate={{ x: showFps ? 16 : 0 }}
                                        className="w-4 h-4 rounded-full bg-white shadow-sm"
                                    />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Storage */}
                    <motion.div variants={listItem} className="flex-1 min-w-[200px] bg-surface-card border border-border rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <FolderOpen size={16} className="text-accent" />
                            {t.storage}
                        </h4>
                        <p className="text-xs text-text-muted mb-3">{t.storageLocation}</p>
                        <p className="text-sm text-text-secondary mb-4 font-mono">~/Pictures/ADB Compass/</p>
                        <button
                            onClick={handleOpenFolder}
                            className="flex items-center gap-2 px-3 py-2 bg-surface-elevated hover:bg-surface-hover border border-border text-text-secondary hover:text-text-primary rounded-lg transition-all text-sm"
                        >
                            <ExternalLink size={14} />
                            {t.openFolder}
                        </button>
                    </motion.div>

                </div>

                {/* Quick Actions - Full Width Row */}
                <motion.div variants={listItem} className="bg-surface-card border border-border rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <Zap size={16} className="text-accent" />
                        {t.quickActions}
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                        {/* Row 1: Navigation */}
                        <button onClick={() => handleKeyEvent(4)} className="p-2 bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg flex items-center justify-center transition-colors" title={t.back}>
                            <Triangle size={18} className="text-text-secondary -rotate-90" />
                        </button>
                        <button onClick={() => handleKeyEvent(3)} className="p-2 bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg flex items-center justify-center transition-colors" title={t.home}>
                            <Home size={18} className="text-text-secondary" />
                        </button>
                        <button onClick={() => handleKeyEvent(187)} className="p-2 bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg flex items-center justify-center transition-colors" title={t.recents}>
                            <Square size={18} className="text-text-secondary" />
                        </button>
                        <button onClick={() => handleKeyEvent(82)} className="p-2 bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg flex items-center justify-center transition-colors" title={t.menu}>
                            <Menu size={18} className="text-text-secondary" />
                        </button>

                        {/* Row 2: Volume & Power */}
                        <button onClick={() => handleKeyEvent(25)} className="p-2 bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg flex items-center justify-center transition-colors" title={t.volumeDown}>
                            <Volume1 size={18} className="text-text-secondary" />
                        </button>
                        <button onClick={() => handleKeyEvent(24)} className="p-2 bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg flex items-center justify-center transition-colors" title={t.volumeUp}>
                            <Volume2 size={18} className="text-text-secondary" />
                        </button>
                        <button onClick={() => handleKeyEvent(164)} className="p-2 bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg flex items-center justify-center transition-colors" title={t.mute}>
                            <VolumeX size={18} className="text-text-secondary" />
                        </button>
                        <button onClick={() => handleKeyEvent(26)} className="p-2 bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg flex items-center justify-center transition-colors" title={t.power}>
                            <Power size={18} className="text-error" />
                        </button>

                        {/* Row 3: System & Media */}
                        <button onClick={() => handleKeyEvent(220)} className="p-2 bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg flex items-center justify-center transition-colors" title={t.brightnessDown}>
                            <Moon size={18} className="text-text-secondary" />
                        </button>
                        <button onClick={() => handleKeyEvent(221)} className="p-2 bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg flex items-center justify-center transition-colors" title={t.brightnessUp}>
                            <Sun size={18} className="text-text-secondary" />
                        </button>
                        <button onClick={() => handleKeyEvent(83)} className="p-2 bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg flex items-center justify-center transition-colors" title={t.notifications}>
                            <Bell size={18} className="text-text-secondary" />
                        </button>
                        <button onClick={() => handleKeyEvent(85)} className="p-2 bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg flex items-center justify-center transition-colors" title={t.playPause}>
                            <Play size={18} className="text-success" />
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Phone Preview - Fixed width to ensure control buttons always visible */}
            <div className="w-[320px] shrink-0 h-full flex items-center gap-4 bg-surface-card rounded-xl border border-border p-4">
                {/* Phone Frame - Boxy Style */}
                <div
                    className={`flex-1 bg-black rounded-xl shadow-2xl relative transition-all focus-within:ring-2 focus-within:ring-accent/60 focus-within:ring-offset-[3px] focus-within:ring-offset-surface-card ${allowTouch ? 'cursor-pointer' : ''}`}
                    style={{ width: '100%', maxHeight: '100%', aspectRatio: aspectRatio }}
                    onClick={streamMode === 'standard' ? handleTouch : undefined}
                >
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                        {isMirroring ? (
                            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-center p-6 z-30">
                                <motion.div
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                                        <ExternalLink size={32} className="text-accent" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold mb-1">Mirroring Active</h3>
                                        <p className="text-text-muted text-xs">Device screen is being projected to a dedicated window.</p>
                                    </div>
                                    <button
                                        onClick={handleStopMirror}
                                        className="mt-4 px-4 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs text-text-secondary hover:text-white transition-colors"
                                    >
                                        Stop Mirroring
                                    </button>
                                </motion.div>
                            </div>
                        ) : streamMode === 'high-perf' && scrcpyStatus?.port ? (
                            <StreamPlayer
                                deviceId={device.id}
                                width={screenWidth}
                                height={screenHeight}
                                allowTouch={allowTouch}
                                onVideoDimensions={(w, h) => {
                                    console.log(`[ScreenCapture] StreamPlayer reported video dimensions: ${w}x${h}`);
                                    setAspectRatio(w / h);
                                    setScreenWidth(w);
                                    setScreenHeight(h);
                                }}
                                onTouch={handleScrcpyTouch}
                                onScroll={handleScrcpyScroll}
                                showFps={showFps}
                                windowLabel="main"
                                allowKeyboard={true}
                            />
                        ) : previewImage ? (
                            <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
                                <Image size={40} className="opacity-30 mb-1" />
                                <span className="text-xs opacity-50">{t.noSignal}</span>
                            </div>
                        )}

                        {/* Recording Overlay */}
                        {isRecording && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="text-center text-white">
                                    <div className="w-3 h-3 rounded-full bg-error animate-pulse mx-auto mb-1" />
                                    <span className="text-xs">{t.recording}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Vertical Controls Column */}
                <div className="flex flex-col gap-2 self-stretch justify-start">
                    <button
                        onClick={toggleHighPerfMode}
                        disabled={isStartingScrcpy}
                        className={`p-2.5 rounded-lg border transition-all shadow-sm ${streamMode === 'high-perf'
                            ? 'bg-success text-white border-success shadow-success/20'
                            : 'bg-surface-elevated border-border text-text-muted hover:text-text-primary'
                            }`}
                        title={streamMode === 'high-perf' ? 'Stop Live Preview' : 'Start Live Preview'}
                    >
                        {isStartingScrcpy ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
                    </button>

                    <button
                        onClick={handleRefreshPreview}
                        disabled={isLoadingPreview || streamMode === 'high-perf'}
                        className={`p-2.5 rounded-lg border border-border text-text-secondary hover:text-accent disabled:opacity-20 shadow-sm bg-surface-elevated`}
                        title={t.refresh}
                    >
                        <RefreshCw size={16} className={isLoadingPreview ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={handleStartMirror}
                        disabled={streamMode !== 'high-perf'}
                        className={`p-2.5 rounded-lg border transition-all shadow-sm ${isMirroring
                            ? 'bg-accent text-white border-accent'
                            : 'bg-surface-elevated border-border text-text-secondary hover:text-accent disabled:opacity-20'
                            }`}
                        title="Mirror in popup"
                    >
                        <ExternalLink size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
