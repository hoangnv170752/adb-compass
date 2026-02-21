import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Home, Triangle, Square, Power, Volume2, Volume1, Sun, Camera, Video } from 'lucide-react';
import { invoke } from '../../utils/tauri';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { StreamPlayer } from '../device/StreamPlayer';
import { save } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';

export function MirrorWindow() {
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [screenWidth, setScreenWidth] = useState(1080);
    const [screenHeight, setScreenHeight] = useState(2340);
    const [allowTouch, setAllowTouch] = useState(true);
    const [isLoadingRes, setIsLoadingRes] = useState(true);
    const [currentFps, setCurrentFps] = useState(0);
    // const { t } = useLanguage(); // Unused here

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isFlashActive, setIsFlashActive] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const [windowLabel, setWindowLabel] = useState("");

    useEffect(() => {
        const win = getCurrentWindow();
        const label = win.label;
        console.log(`[MirrorWindow] Initializing with label: ${label}`);
        setWindowLabel(label);
        if (label.startsWith('mirror-')) {
            const id = label.replace('mirror-', '').replace(/__/g, ':').replace(/_/g, '.');
            console.log(`[MirrorWindow] Derived deviceId: ${id}`);
            setDeviceId(id);
        }
    }, []);

    useEffect(() => {
        if (!deviceId) return;

        const initScrcpy = async () => {
            try {
                // Fetch resolution
                const props = await invoke<{ screen_resolution: string | null }>('get_device_props', { deviceId });
                if (props.screen_resolution) {
                    const clean = props.screen_resolution.replace('Physical size: ', '').replace('Override size: ', '');
                    const [w, h] = clean.split('x').map(Number);
                    if (w && h) {
                        setScreenWidth(w);
                        setScreenHeight(h);
                        setIsLoadingRes(false);
                    }
                }
                setIsLoadingRes(false);

                // Check if server already running
                const status = await invoke<{ running: boolean }>('get_scrcpy_status', { deviceId });
                if (!status.running) {
                    await invoke('start_scrcpy_server', {
                        deviceId,
                        maxSize: 1024,
                        bitRate: 4000000,
                        maxFps: 60,
                    });
                }
            } catch (e) {
                console.error('Failed to init mirror window:', e);
                toast.error("Failed to start mirror: " + String(e));
            }
        };

        initScrcpy();
    }, [deviceId]);

    // Timer for recording
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            setRecordingTime(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleScreenshot = useCallback(async () => {
        if (!canvasRef.current) return;
        setIsFlashActive(true);
        setTimeout(() => setIsFlashActive(false), 150);

        try {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            const base64Data = dataUrl.split(',')[1];
            const filename = `screenshot-${deviceId}-${Date.now()}.png`;

            const askBeforeSave = localStorage.getItem('askBeforeSave') === 'true';
            const captureSavePath = localStorage.getItem('captureSavePath');

            let absolutePath: string | undefined = undefined;
            if (askBeforeSave) {
                const selected = await save({
                    defaultPath: `${captureSavePath}/${filename}`,
                    filters: [{ name: 'Image', extensions: ['png'] }]
                });
                if (!selected) return; // User cancelled
                absolutePath = selected;
            }

            const result = await invoke<{ success: boolean; path?: string; error?: string }>('save_capture_file', {
                dataBase64: base64Data,
                filename,
                subfolder: 'screenshots',
                customBasePath: captureSavePath,
                absolutePath
            });

            if (result.success) {
                toast.success("Screenshot saved", { description: result.path });
            } else {
                throw new Error(result.error);
            }
        } catch (e) {
            console.error("Screenshot failed:", e);
            toast.error("Failed to save screenshot: " + String(e));
        }
    }, [deviceId]);

    const handleToggleRecording = useCallback(async () => {
        if (!canvasRef.current) return;

        if (!isRecording) {
            const stream = canvasRef.current.captureStream(60);
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64withHeader = reader.result as string;
                    const base64Data = base64withHeader.split(',')[1];
                    const filename = `recording-${deviceId}-${Date.now()}.webm`;

                    try {
                        const askBeforeSave = localStorage.getItem('askBeforeSave') === 'true';
                        const captureSavePath = localStorage.getItem('captureSavePath');

                        let absolutePath: string | undefined = undefined;
                        if (askBeforeSave) {
                            const selected = await save({
                                defaultPath: `${captureSavePath}/${filename}`,
                                filters: [{ name: 'Video', extensions: ['webm'] }]
                            });
                            if (!selected) return; // User cancelled
                            absolutePath = selected;
                        }

                        const result = await invoke<{ success: boolean; path?: string; error?: string }>('save_capture_file', {
                            dataBase64: base64Data,
                            filename,
                            subfolder: 'recordings',
                            customBasePath: captureSavePath,
                            absolutePath
                        });

                        if (result.success) {
                            toast.success("Recording saved", { description: result.path });
                        } else {
                            toast.error("Failed to save recording: " + result.error);
                        }
                    } catch (err) {
                        toast.error("Failed to save recording: " + String(err));
                    }
                };
                reader.readAsDataURL(blob);
            };

            recorder.start();
            setIsRecording(true);
        } else {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        }
    }, [isRecording, deviceId]);

    const handleTouch = useCallback(async (x: number, y: number, action: 'down' | 'up' | 'move') => {
        if (!allowTouch || !deviceId) return;
        const actionMap = { down: 0, up: 1, move: 2 };
        try {
            await invoke('scrcpy_touch', {
                deviceId,
                action: actionMap[action],
                x,
                y,
                width: screenWidth,
                height: screenHeight,
            });
        } catch (error) {
            console.error('Touch failed:', error);
        }
    }, [deviceId, allowTouch, screenWidth, screenHeight]);

    const handleScroll = useCallback(async (x: number, y: number, deltaX: number, deltaY: number) => {
        if (!allowTouch || !deviceId) return;
        try {
            await invoke('scrcpy_scroll', {
                deviceId,
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
    }, [deviceId, allowTouch, screenWidth, screenHeight]);

    const handleKeyEvent = async (keycode: number) => {
        if (!deviceId) return;
        try {
            await invoke('execute_shell', {
                deviceId,
                command: `input keyevent ${keycode}`
            });
        } catch (error) {
            console.error('Key event failed:', error);
        }
    };

    if (!deviceId) {
        return <div className="h-screen flex items-center justify-center bg-black text-white">Loading Window...</div>;
    }

    return (
        <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden p-2">
            {/* Minimal Header - Fixed Height */}
            <div className="h-12 flex items-center justify-between px-4 shrink-0 bg-black/40 border-b border-white/5 relative">
                <div className="flex items-center gap-4">
                    {/* [ID] [FPS: 60] */}
                    <div className="flex items-center gap-2">
                        <Smartphone size={14} className="text-accent" />
                        <span className="text-xs font-bold text-text-primary whitespace-nowrap">{deviceId}</span>
                    </div>

                    <div className="flex items-center gap-2 px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
                        <div className={`w-1.5 h-1.5 rounded-full ${currentFps > 0 ? 'bg-success animate-pulse' : 'bg-warning'}`} />
                        <span className="text-[10px] font-mono font-medium text-text-secondary uppercase">FPS: {currentFps}</span>
                    </div>
                </div>

                {/* [[icon_pause] mm:ss] - Recording Indicator */}
                <div className="flex items-center">
                    <AnimatePresence>
                        {isRecording && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center gap-2 px-3 py-1 bg-error/20 border border-error/30 rounded-lg"
                            >
                                <div className="w-2 h-2 rounded-full bg-error animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                <span className="text-[10px] font-mono font-bold text-error tracking-wider">{formatTime(recordingTime)}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex-1 flex gap-3 min-h-0">
                <div className="flex-1 relative flex items-center justify-center">
                    {!isLoadingRes ? (
                        <div
                            className="bg-black rounded-xl overflow-hidden shadow-2xl relative"
                            style={{
                                height: '100%',
                                maxHeight: '100%',
                                aspectRatio: screenWidth / screenHeight
                            }}
                        >
                            <StreamPlayer
                                deviceId={deviceId}
                                width={screenWidth}
                                height={screenHeight}
                                allowTouch={allowTouch}
                                onTouch={handleTouch}
                                onScroll={handleScroll}
                                showFps={false} // Hidden in canvas, shown in header
                                canvasRef={canvasRef}
                                windowLabel={windowLabel}
                                onFpsUpdate={setCurrentFps}
                                onVideoDimensions={(w, h) => {
                                    console.log(`[MirrorWindow] StreamPlayer reported dimensions: ${w}x${h}`);
                                    setScreenWidth(w);
                                    setScreenHeight(h);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="animate-pulse flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                            <span className="text-xs opacity-50">Initializing...</span>
                        </div>
                    )}

                    <AnimatePresence>
                        {isFlashActive && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white z-50 pointer-events-none"
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Control Panel (Side) */}
                <div className="w-12 flex flex-col gap-2 py-2 shrink-0">
                    <ControlBtn icon={<Triangle size={18} className="-rotate-90" />} onClick={() => handleKeyEvent(4)} title="Back" />
                    <ControlBtn icon={<Home size={18} />} onClick={() => handleKeyEvent(3)} title="Home" />
                    <ControlBtn icon={<Square size={18} />} onClick={() => handleKeyEvent(187)} title="Recents" />

                    <div className="h-px bg-white/10 my-1" />

                    <ControlBtn
                        icon={<Camera size={18} className="text-accent" />}
                        onClick={handleScreenshot}
                        title="Take Screenshot"
                    />
                    <ControlBtn
                        icon={<Video size={18} className={isRecording ? "text-error" : "text-text-secondary"} />}
                        onClick={handleToggleRecording}
                        title={isRecording ? "Stop Recording" : "Start Recording"}
                    />

                    <div className="h-px bg-white/10 my-1" />

                    <ControlBtn icon={<Volume2 size={18} />} onClick={() => handleKeyEvent(24)} title="Vol +" />
                    <ControlBtn icon={<Volume1 size={18} />} onClick={() => handleKeyEvent(25)} title="Vol -" />
                    <ControlBtn icon={<Power size={18} className="text-error" />} onClick={() => handleKeyEvent(26)} title="Power" />

                    <div className="h-px bg-white/10 my-1" />

                    <ControlBtn
                        icon={<Sun size={18} className={allowTouch ? "text-accent" : "opacity-30"} />}
                        onClick={() => setAllowTouch(!allowTouch)}
                        title="Toggle Touch"
                    />
                </div>
            </div>
        </div>
    );
}

function ControlBtn({ icon, onClick, title, className = "" }: { icon: React.ReactNode, onClick: () => void, title: string, className?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95 ${className}`}
        >
            {icon}
        </button>
    );
}
