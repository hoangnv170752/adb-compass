// StreamPlayer - Display H.264 stream using WebCodecs
import { useEffect, useRef, useState, useMemo } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '../../utils/tauri';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useLanguage } from '../../contexts/LanguageContext';

interface StreamPlayerProps {
    deviceId: string;
    width: number;
    height: number;
    onTouch?: (x: number, y: number, action: 'down' | 'up' | 'move') => void;
    onScroll?: (x: number, y: number, deltaX: number, deltaY: number) => void;
    allowTouch?: boolean;
    onVideoDimensions?: (width: number, height: number) => void;
    showFps?: boolean;
    canvasRef?: React.RefObject<HTMLCanvasElement | null>;
    windowLabel?: string;
    onFpsUpdate?: (fps: number) => void;
    allowKeyboard?: boolean;
}

const ANDROID_KEYMAP: Record<string, number> = {
    'Enter': 66,
    'Backspace': 67,
    'Tab': 61,
    'Escape': 111,
    'ArrowUp': 19,
    'ArrowDown': 20,
    'ArrowLeft': 21,
    'ArrowRight': 22,
    'Home': 3,
    'PageUp': 92,
    'PageDown': 93,
    'Delete': 122,
    'End': 123,
    'Meta': 3, // Windows Key -> Home
};

export function StreamPlayer({
    deviceId,
    width,
    height,
    onTouch,
    onScroll,
    allowTouch = false,
    onVideoDimensions,
    showFps = true,
    canvasRef: externalCanvasRef,
    windowLabel,
    onFpsUpdate,
    allowKeyboard = true,
}: StreamPlayerProps) {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    const canvasRef = externalCanvasRef || internalCanvasRef;
    const [fps, setFps] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const frameCountRef = useRef(0);
    const decoderRef = useRef<VideoDecoder | null>(null);
    const isConfiguredRef = useRef(false);
    const spsBufferRef = useRef<Uint8Array | null>(null);
    const ppsBufferRef = useRef<Uint8Array | null>(null);
    const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
    const timestampRef = useRef(0);
    const hasKeyframeRef = useRef(false);
    const lastFrameTimeRef = useRef(Date.now());
    const errorCountRef = useRef(0);
    const { t } = useLanguage();

    // Stall Detection & Recovery
    useEffect(() => {
        if (!isConnected) return;
        const checkStall = setInterval(() => {
            const timeSinceLastFrame = Date.now() - lastFrameTimeRef.current;
            if (timeSinceLastFrame > 3000) {
                console.warn(`[StreamPlayer] Stream stalled for ${timeSinceLastFrame}ms for ${deviceId}. Requesting emergency sync.`);
                const currentLabel = windowLabel || getCurrentWindow().label;
                invoke('request_scrcpy_sync', {
                    deviceId,
                    windowLabel: currentLabel
                }).catch(console.error);
                lastFrameTimeRef.current = Date.now(); // Rate limit sync requests
            }
        }, 1000);
        return () => clearInterval(checkStall);
    }, [isConnected, deviceId, windowLabel]);

    // FPS counter
    useEffect(() => {
        if (!showFps && !onFpsUpdate) return;
        const interval = setInterval(() => {
            const currentFps = frameCountRef.current;
            setFps(currentFps);
            if (onFpsUpdate) onFpsUpdate(currentFps);
            frameCountRef.current = 0;
        }, 1000);
        return () => clearInterval(interval);
    }, [showFps, onFpsUpdate]);

    // Initialize WebCodecs Decoder
    useEffect(() => {
        if (!('VideoDecoder' in window)) {
            console.error("WebCodecs API not supported");
            return;
        }

        const handleFrame = (frame: VideoFrame) => {
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    if (canvasRef.current.width !== frame.displayWidth || canvasRef.current.height !== frame.displayHeight) {
                        canvasRef.current.width = frame.displayWidth;
                        canvasRef.current.height = frame.displayHeight;
                        console.log(`[StreamPlayer] Video dimensions changed: ${frame.displayWidth}x${frame.displayHeight}`);
                        if (onVideoDimensions) {
                            onVideoDimensions(frame.displayWidth, frame.displayHeight);
                        }
                    }
                    ctx.drawImage(frame, 0, 0);
                    frameCountRef.current++;
                    lastFrameTimeRef.current = Date.now();
                    errorCountRef.current = 0;
                    setIsConnected(true);
                }
            }
            frame.close();
        };

        const handleError = (e: Error) => {
            console.error("VideoDecoder error:", e);
            setIsConnected(false);
            isConfiguredRef.current = false; // Allow re-configuration
        };

        try {
            decoderRef.current = new VideoDecoder({
                output: handleFrame,
                error: handleError,
            });
        } catch (e) {
            console.error("Failed to create decoder:", e);
        }

        return () => {
            if (decoderRef.current?.state !== 'closed') {
                decoderRef.current?.close();
            }
        };
    }, []); // Empty dependency array = Run once on mount

    // Listen for H.264 Text Frames (Base64 NALs)
    useEffect(() => {
        if (!deviceId || !decoderRef.current) return;

        const sanitizedId = deviceId.replace(/\./g, "_").replace(/:/g, "_");
        let active = true;
        let unlistenFn: (() => void) | null = null;

        const handleFrameData = (base64Data: string) => {
            if (!active) return;
            const binaryString = atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            let nalHeaderIndex = -1;
            if (bytes[0] === 0 && bytes[1] === 0) {
                if (bytes[2] === 1) nalHeaderIndex = 3;
                else if (bytes[2] === 0 && bytes[3] === 1) nalHeaderIndex = 4;
            }

            if (nalHeaderIndex === -1) return;

            const nalHeader = bytes[nalHeaderIndex];
            const nalType = nalHeader & 0x1F;
            // console.log(`NAL Type: ${nalType} (${base64Data.length} chars)`);

            // SPS (7)
            if (nalType === 7) {
                spsBufferRef.current = bytes;
                const profile = bytes[nalHeaderIndex + 1];
                const constraint = bytes[nalHeaderIndex + 2];
                const level = bytes[nalHeaderIndex + 3];
                const codecString = `avc1.${[profile, constraint, level].map(b => b.toString(16).padStart(2, '0')).join('')}`;

                if (!isConfiguredRef.current) {
                    try {
                        console.log(`[StreamPlayer] Configuring decoder for ${deviceId} with codec: ${codecString}`);
                        decoderRef.current?.configure({
                            codec: codecString,
                            optimizeForLatency: true,
                        });
                        isConfiguredRef.current = true;
                        hasKeyframeRef.current = false; // Need a new keyframe after re-config
                        timestampRef.current = 0; // Reset timestamps for new sequence
                        decoderRef.current?.flush().catch(console.error);
                    } catch (e: any) {
                        console.error(`Config Error: ${e.message}`);
                    }
                }
                return;
            }

            // PPS (8)
            if (nalType === 8) {
                ppsBufferRef.current = bytes;
                return;
            }

            // IDR (5) or Delta (1)
            if (nalType === 5 || nalType === 1) {
                let chunkData = bytes;
                if (nalType === 5) {
                    if (spsBufferRef.current && ppsBufferRef.current) {
                        const spsLen = spsBufferRef.current.length;
                        const ppsLen = ppsBufferRef.current.length;
                        const totalLen = spsLen + ppsLen + bytes.length;
                        const merged = new Uint8Array(totalLen);
                        merged.set(spsBufferRef.current, 0);
                        merged.set(ppsBufferRef.current, spsLen);
                        merged.set(bytes, spsLen + ppsLen);
                        chunkData = merged;
                    }
                    // console.log("Processing IDR frame");
                }

                try {
                    if (decoderRef.current?.state === 'configured') {
                        // CRITICAL: Ignore all Delta frames (1) until we have an IDR (5)
                        if (nalType === 1 && !hasKeyframeRef.current) {
                            return;
                        }

                        if (nalType === 5) {
                            if (!hasKeyframeRef.current) {
                                console.log("[StreamPlayer] First Keyframe received - Syncing stream display");
                            }
                            hasKeyframeRef.current = true;
                        }

                        const timestamp = timestampRef.current++;
                        const chunk = new EncodedVideoChunk({
                            type: nalType === 5 ? 'key' : 'delta',
                            timestamp: timestamp * 16666,
                            data: chunkData,
                        });
                        decoderRef.current.decode(chunk);
                    }
                } catch (e: any) {
                    console.error(`[StreamPlayer] Decode Error: ${e.message}`);
                    errorCountRef.current++;
                    if (errorCountRef.current > 5 || nalType === 5) {
                        console.warn("[StreamPlayer] High error rate - Resetting decoder state");
                        isConfiguredRef.current = false;
                        hasKeyframeRef.current = false;
                        errorCountRef.current = 0;
                    }
                }
                return;
            }
        };

        const setupListener = async () => {
            const currentLabel = windowLabel || getCurrentWindow().label;
            console.log(`[StreamPlayer] Setting up listeners for ${deviceId} in window ${currentLabel} (sanitized: ${sanitizedId})`);

            // 1. Normal frame listener (global for this device)
            const unlistenFrame = await listen<string>(`scrcpy-frame-${sanitizedId}`, (event) => {
                handleFrameData(event.payload);
            });

            // 2. Private sync listener (unique for this window)
            const unlistenSync = await listen<string>(`scrcpy-sync-${currentLabel}-${sanitizedId}`, (event) => {
                console.log(`[StreamPlayer] Sync packet received for window ${currentLabel} and device ${deviceId}`);
                handleFrameData(event.payload);
            });

            if (!active) {
                unlistenFrame();
                unlistenSync();
                return;
            }

            const cleanup = () => {
                console.log(`[StreamPlayer] Cleaning up listeners for ${deviceId} in window ${currentLabel}`);
                unlistenFrame();
                unlistenSync();
            };
            unlistenFn = cleanup;

            // Request SPS/PPS from backend via private channel
            setTimeout(() => {
                if (!active) return;
                console.log(`[StreamPlayer] Window: ${currentLabel} requesting private sync for ${deviceId}`);
                invoke('request_scrcpy_sync', {
                    deviceId,
                    windowLabel: currentLabel
                }).catch(err => {
                    console.error(`[StreamPlayer] Sync request failed for ${deviceId}:`, err);
                });
            }, 800);
        };

        setupListener();

        return () => {
            console.log(`[StreamPlayer] Effect cleanup for ${deviceId} in window ${windowLabel || 'current'}`);
            active = false;
            if (unlistenFn) {
                unlistenFn();
                unlistenFn = null;
            }
            setIsConnected(false);
            isConfiguredRef.current = false;
            hasKeyframeRef.current = false;
            spsBufferRef.current = null;
            ppsBufferRef.current = null;
        };
    }, [deviceId, windowLabel]);

    // Events Wrappers
    const handleEvents = useMemo(() => {
        const getXY = (e: React.MouseEvent | React.TouchEvent, rect: DOMRect) => {
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
            const x = Math.max(0, Math.round(((clientX - rect.left) / rect.width) * width));
            const y = Math.max(0, Math.round(((clientY - rect.top) / rect.height) * height));
            return { x, y };
        }

        return {
            onMouseDown: (e: React.MouseEvent) => {
                if (!allowTouch || !onTouch || !canvasRef.current) return;
                const { x, y } = getXY(e, canvasRef.current.getBoundingClientRect());
                console.log(`[StreamPlayer] Touch Down: ${x},${y} (ref: ${width}x${height})`);
                lastTouchRef.current = { x, y };
                onTouch(x, y, 'down');
            },
            onMouseUp: (e: React.MouseEvent) => {
                if (!allowTouch || !onTouch || !canvasRef.current) return;
                const { x, y } = getXY(e, canvasRef.current.getBoundingClientRect());
                lastTouchRef.current = null;
                onTouch(x, y, 'up');
            },
            onMouseMove: (e: React.MouseEvent) => {
                if (!allowTouch || !onTouch || !canvasRef.current || !lastTouchRef.current) return;
                const { x, y } = getXY(e, canvasRef.current.getBoundingClientRect());
                onTouch(x, y, 'move');
            },
            onWheel: (e: React.WheelEvent) => {
                if (!allowTouch || !onScroll || !canvasRef.current) return;
                e.preventDefault();
                const { x, y } = getXY(e, canvasRef.current.getBoundingClientRect());
                onScroll(x, y, Math.round(e.deltaX), Math.round(e.deltaY));
            },
            onKeyDown: (e: React.KeyboardEvent) => {
                if (!allowKeyboard || !allowTouch) return;

                const androidKeycode = ANDROID_KEYMAP[e.key];
                if (androidKeycode !== undefined) {
                    e.preventDefault();
                    invoke('scrcpy_key', { deviceId, action: 0, keycode: androidKeycode, metastate: 0 }).catch(console.error);
                } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    // It's a printable character, send as text event
                    e.preventDefault();
                    invoke('scrcpy_text', { deviceId, text: e.key }).catch(console.error);
                }
            },
            onKeyUp: (e: React.KeyboardEvent) => {
                if (!allowKeyboard || !allowTouch) return;

                const androidKeycode = ANDROID_KEYMAP[e.key];
                if (androidKeycode !== undefined) {
                    e.preventDefault();
                    invoke('scrcpy_key', { deviceId, action: 1, keycode: androidKeycode, metastate: 0 }).catch(console.error);
                }
            }
        };
    }, [allowTouch, allowKeyboard, onTouch, onScroll, width, height, deviceId]);

    return (
        <div
            className="relative w-full h-full flex items-center justify-center outline-none rounded-xl overflow-hidden group"
            tabIndex={0}
            onKeyDown={handleEvents.onKeyDown}
            onKeyUp={handleEvents.onKeyUp}
        >
            <canvas
                ref={canvasRef}
                className={`max-w-full max-h-full object-contain ${allowTouch ? 'cursor-pointer' : ''}`}
                onMouseDown={handleEvents.onMouseDown}
                onMouseUp={handleEvents.onMouseUp}
                onMouseMove={handleEvents.onMouseMove}
                onMouseLeave={handleEvents.onMouseUp}
                onWheel={handleEvents.onWheel}
            />

            {/* Loading / Status */}
            {!isConnected && (
                <div className="absolute flex flex-col items-center justify-center text-text-muted pointer-events-none">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-sm">{t.connectingStream}</span>
                </div>
            )}

            {/* FPS Counter */}
            {showFps && (
                <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 bg-black/60 backdrop-blur rounded-full pointer-events-none">
                    <span
                        className={`w-2 h-2 rounded-full ${isConnected && fps > 0 ? 'bg-success animate-pulse' : 'bg-warning'}`}
                    />
                    <span className="text-[10px] font-mono text-white">
                        {fps} {t.fps}
                    </span>
                </div>
            )}
        </div>
    );
}
