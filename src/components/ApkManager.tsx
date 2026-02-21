import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    FolderOpen, RefreshCw, Package, FileCheck, X
} from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import type { ApkInfo } from '../types';
import { ApkDropzone } from './ApkDropzone';
import { ToolsPanel, type ActiveToolView } from './ToolsPanel';
import { useLanguage } from '../contexts/LanguageContext';

interface ApkManagerProps {
    apkInfo: ApkInfo | null;
    onSelect: (path: string) => void;
    onClear: () => void;
    onScan: (path: string) => Promise<ApkInfo[]>;
    onSelectFromList: (info: ApkInfo) => void;
    onOpenToolView: (view: ActiveToolView) => void;
}

export function ApkManager({
    apkInfo,
    onClear,
    onScan,
    onSelectFromList,
    onOpenToolView
}: ApkManagerProps) {
    // unified 'apk' tab vs 'tools' placeholder
    const [activeTab, setActiveTab] = useState<'apk' | 'tools'>('apk');
    const { t } = useLanguage();

    // Folder state
    const [folderPath, setFolderPath] = useState<string | null>(null);
    const [scannedApks, setScannedApks] = useState<ApkInfo[]>([]);
    const [scanning, setScanning] = useState(false);

    // Manual APK state
    const [manualApks, setManualApks] = useState<ApkInfo[]>([]);
    // Track paths being processed to prevent duplicate additions
    const processingPaths = useRef<Set<string>>(new Set());

    const handleSelectFolder = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
            });
            if (selected && typeof selected === 'string') {
                setFolderPath(selected);
                handleScan(selected);
            }
        } catch (error) {
            console.error('Error selecting folder:', error);
        }
    };

    const handleScan = async (path: string) => {
        setScanning(true);
        try {
            const [apks] = await Promise.all([
                onScan(path),
                new Promise(resolve => setTimeout(resolve, 500))
            ]);
            setScannedApks(apks);
        } finally {
            setScanning(false);
        }
    };

    const handleManualApkSelected = async (path: string) => {
        // Prevent duplicate processing using ref (handles race conditions)
        if (processingPaths.current.has(path)) {
            return;
        }
        processingPaths.current.add(path);

        try {
            // Check manual list for duplicates
            if (manualApks.some(a => a.path === path)) {
                const existing = manualApks.find(a => a.path === path);
                if (existing) onSelectFromList(existing);
                return;
            }

            // Invoke validation to get info
            const { invoke } = await import('../utils/tauri');
            const info = await invoke<ApkInfo | null>('validate_apk', { path });

            if (info && info.valid) {
                // Use functional update to check for duplicates with latest state
                setManualApks(prev => {
                    if (prev.some(a => a.path === path)) {
                        return prev;
                    }
                    return [...prev, info];
                });
                onSelectFromList(info);
            }
        } catch (e) {
            console.error("Failed to add manual apk", e);
        } finally {
            processingPaths.current.delete(path);
        }
    };

    // Derived combined logic or separate? text says: "apk of folder displays below select folder... add manual apk displays below Select Apk"
    // So distinct lists.

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Tab Switcher with sliding background */}
            <div className="flex p-1 mb-4 bg-surface-elevated rounded-xl border border-border/50">
                <button
                    className={`relative flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors ${activeTab === 'apk'
                        ? 'text-text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                        }`}
                    onClick={() => setActiveTab('apk')}
                >
                    {activeTab === 'apk' && (
                        <motion.div
                            layoutId="sidebarActiveTab"
                            className="absolute inset-0 bg-surface-card rounded-lg shadow-sm border border-border/50"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10">{t.apk}</span>
                </button>
                <button
                    className={`relative flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors ${activeTab === 'tools'
                        ? 'text-text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                        }`}
                    onClick={() => setActiveTab('tools')}
                >
                    {activeTab === 'tools' && (
                        <motion.div
                            layoutId="sidebarActiveTab"
                            className="absolute inset-0 bg-surface-card rounded-lg shadow-sm border border-border/50"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10">{t.tabAdvanced}</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-1">
                {activeTab === 'apk' && (
                    <div className="flex flex-col gap-6 pb-4">
                        {/* Section 1: Folder Selection */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSelectFolder}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 
                                            bg-surface-elevated border border-border rounded-lg 
                                            text-xs font-medium text-text-primary hover:border-accent transition-all"
                                >
                                    <FolderOpen size={14} />
                                    <span className="truncate max-w-[120px]">
                                        {folderPath ? folderPath.split(/[\\/]/).pop() : t.selectFolder}
                                    </span>
                                </button>
                                {folderPath && (
                                    <button
                                        onClick={() => handleScan(folderPath)}
                                        className="p-2 bg-surface-elevated border border-border rounded-lg 
                                                text-text-secondary hover:text-accent disabled:cursor-not-allowed"
                                        disabled={scanning}
                                        title={t.reloadFolder}
                                    >
                                        <RefreshCw size={14} className={scanning ? 'animate-spin text-accent' : ''} />
                                    </button>
                                )}
                            </div>

                            {/* Folder List */}
                            {folderPath && (
                                <div className="space-y-2">
                                    {scannedApks.length === 0 && !scanning && (
                                        <div className="text-center text-text-muted text-xs italic">
                                            {t.noValidApks}
                                        </div>
                                    )}
                                    {scannedApks.map((apk) => (
                                        <ApkListItem
                                            key={apk.path}
                                            apk={apk}
                                            isSelected={apkInfo?.path === apk.path}
                                            onSelect={() => {
                                                if (apkInfo?.path === apk.path) {
                                                    onClear();
                                                } else {
                                                    onSelectFromList(apk);
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Section 2: Manual Selection */}
                        <div className="space-y-3 pt-6 border-t border-border">
                            <ApkDropzone
                                apkInfo={null}
                                onApkSelected={handleManualApkSelected}
                                onApkClear={() => { }}
                            />

                            {/* Manual List */}
                            {manualApks.length > 0 && (
                                <div className="space-y-2">
                                    {manualApks.map((apk) => (
                                        <ApkListItem
                                            key={apk.path}
                                            apk={apk}
                                            isSelected={apkInfo?.path === apk.path}
                                            onSelect={() => {
                                                if (apkInfo?.path === apk.path) {
                                                    onClear();
                                                } else {
                                                    onSelectFromList(apk);
                                                }
                                            }}
                                            onRemove={() => {
                                                setManualApks(prev => prev.filter(a => a.path !== apk.path));
                                                if (apkInfo?.path === apk.path) onClear();
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'tools' && (
                    <ToolsPanel onOpenToolView={onOpenToolView} />
                )}
            </div>
        </div >
    );
}

// Sub-component for list item
function ApkListItem({ apk, isSelected, onSelect, onRemove }: { apk: ApkInfo, isSelected: boolean, onSelect: () => void, onRemove?: () => void }) {
    const { t } = useLanguage();
    // Format date modified
    const dateStr = apk.last_modified
        ? new Date(Number(apk.last_modified)).toLocaleDateString()
        : '';

    return (
        <div className="group relative">
            <button
                onClick={onSelect}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${isSelected
                    ? 'bg-accent/10 border-accent'
                    : 'bg-surface-elevated border-transparent hover:border-border'
                    }`}
            >
                <div className="mt-0.5 text-accent">
                    <Package size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                        {apk.file_name}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted font-mono">
                        {dateStr && (
                            <span className="bg-surface-card px-1.5 py-0.5 rounded">
                                {dateStr}
                            </span>
                        )}
                        <span className="bg-surface-card px-1.5 py-0.5 rounded">
                            {(apk.size_bytes / (1024 * 1024)).toFixed(1)} MB
                        </span>
                    </div>
                </div>
                {isSelected && (
                    <FileCheck size={14} className="text-success mt-0.5" />
                )}
            </button>
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="absolute right-2 top-2 p-1 text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t.removeFromList}
                >
                    {/* Reuse Lucide X icon properly imported */}
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
