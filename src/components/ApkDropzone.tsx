// ApkDropzone Component - Compact APK selection with drop overlay
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCheck, X, Package, FolderOpen } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import type { ApkInfo } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ApkDropzoneProps {
    apkInfo: ApkInfo | null;
    onApkSelected: (path: string) => void;
    onApkClear: () => void;
}

interface TauriDropPayload {
    paths: string[];
    position: { x: number; y: number };
}

export function ApkDropzone({ apkInfo, onApkSelected, onApkClear }: ApkDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const { t } = useLanguage();
    
    const onApkSelectedRef = useRef(onApkSelected);
    onApkSelectedRef.current = onApkSelected;
    
    const lastProcessedRef = useRef<string | null>(null);

    useEffect(() => {
        const unlistenHover = listen<TauriDropPayload>('tauri://drag-over', () => {
            setIsDragging(true);
        });

        const unlistenDrop = listen<TauriDropPayload>('tauri://drag-drop', (event) => {
            setIsDragging(false);
            const paths = event.payload.paths;
            if (paths && paths.length > 0) {
                const filePath = paths[0];
                if (filePath === lastProcessedRef.current) {
                    return;
                }
                if (filePath.toLowerCase().endsWith('.apk')) {
                    lastProcessedRef.current = filePath;
                    onApkSelectedRef.current(filePath);
                    setTimeout(() => {
                        lastProcessedRef.current = null;
                    }, 1000);
                }
            }
        });

        const unlistenCancel = listen('tauri://drag-cancelled', () => {
            setIsDragging(false);
        });

        const unlistenLeave = listen('tauri://drag-leave', () => {
            setIsDragging(false);
        });

        return () => {
            unlistenHover.then(fn => fn());
            unlistenDrop.then(fn => fn());
            unlistenCancel.then(fn => fn());
            unlistenLeave.then(fn => fn());
        };
    }, []);

    const handleSelectFile = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{ name: t.apkFiles, extensions: ['apk'] }]
            });
            if (selected && typeof selected === 'string') {
                onApkSelected(selected);
            }
        } catch (error) {
            console.error('Error selecting file:', error);
        }
    };

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <>
            {/* Fullscreen Drop Overlay */}
            <AnimatePresence>
                {isDragging && (
                    <motion.div
                        className="fixed inset-0 bg-accent/15 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="flex flex-col items-center gap-4 p-12 bg-surface-card border-2 border-dashed border-accent rounded-3xl shadow-2xl">
                            <Package size={64} className="text-accent" />
                            <p className="text-xl font-semibold text-text-primary">{t.dropApkHere}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Compact APK Section */}
            <div className="flex items-center w-full">
                {apkInfo ? (
                    <motion.div
                        className="flex items-center justify-between w-full px-3 py-2 bg-surface-elevated border border-accent rounded-xl"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="flex items-center gap-3">
                            <Package size={18} className="text-accent" />
                            <span className="text-sm font-medium text-text-primary max-w-[300px] truncate">
                                {apkInfo.file_name}
                            </span>
                            <span className="text-xs text-text-muted font-mono">
                                {formatSize(apkInfo.size_bytes)}
                            </span>
                            {apkInfo.valid && <FileCheck size={14} className="text-success" />}
                        </div>
                        <button
                            className="p-1.5 rounded-md hover:bg-error/10 text-text-muted hover:text-error transition-all"
                            onClick={onApkClear}
                            title={t.removeApk}
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                ) : (
                    <button
                        onClick={handleSelectFile}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 
                                   bg-surface-elevated border border-border rounded-lg 
                                   text-xs font-medium text-text-primary hover:border-accent transition-all w-full"
                    >
                        <FolderOpen size={14} />
                        <span>{t.selectApk}</span>
                    </button>
                )}
            </div >
        </>
    );
}
