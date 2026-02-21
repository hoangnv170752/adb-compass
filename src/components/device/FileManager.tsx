// File Manager - Browse and manage files on device
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Folder, File, ChevronRight, Home, RefreshCw, Upload, Download,
    Trash2, FolderPlus, Loader2, AlertTriangle, HardDrive,
    Image, Film, Music, DownloadCloud, Camera
} from 'lucide-react';
import { invoke } from '../../utils/tauri';
import { open, save } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';
import { DeviceInfo } from '../../types';
import { listContainer, listItem } from '../../lib/animations';
import { useDeviceCache } from '../../contexts/DeviceCacheContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface FileManagerProps {
    device: DeviceInfo;
}

interface FileInfo {
    name: string;
    is_directory: boolean;
    size: number | null;
    permissions: string | null;
}

const QUICK_ACCESS_ITEMS = (t: any) => [
    { name: t.internalStorage, path: '/storage/emulated/0', icon: <Home size={18} /> },
    { name: t.dcim, path: '/storage/emulated/0/DCIM', icon: <Camera size={18} /> },
    { name: t.pictures, path: '/storage/emulated/0/Pictures', icon: <Image size={18} /> },
    { name: t.music, path: '/storage/emulated/0/Music', icon: <Music size={18} /> },
    { name: t.movies, path: '/storage/emulated/0/Movies', icon: <Film size={18} /> },
    { name: t.downloads, path: '/storage/emulated/0/Download', icon: <DownloadCloud size={18} /> },
    { name: t.root, path: '/', icon: <HardDrive size={18} /> },
];

export function FileManager({ device }: FileManagerProps) {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [currentPath, setCurrentPath] = useState('/storage/emulated/0');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [newFolderMode, setNewFolderMode] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const { getCached, setData } = useDeviceCache();
    const { t } = useLanguage();

    const fetchFiles = async (path: string = currentPath) => {
        const cacheKey = `files_${device.id}_${path}`;

        // 1. Try cache
        const { data, isStale } = getCached<FileInfo[]>(cacheKey);

        if (data) {
            setFiles(data);
            setCurrentPath(path);
            if (!isStale) {
                setLoading(false);
                return;
            }
        }

        if (!data) setLoading(true);
        setError(null);

        // Start spinning minimum 0.5s
        const spinStart = Date.now();

        try {
            const result = await invoke<FileInfo[]>('list_files_fast', {
                deviceId: device.id,
                path
            });
            setFiles(result);
            setCurrentPath(path);
            setData(cacheKey, result);
        } catch (e) {
            setError(String(e));
        } finally {
            // Ensure minimum 500ms spin
            const elapsed = Date.now() - spinStart;
            const remaining = Math.max(0, 500 - elapsed);
            setTimeout(() => setLoading(false), remaining);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [device.id]);

    const navigateTo = (path: string) => {
        fetchFiles(path);
    };

    const navigateToFolder = (folderName: string) => {
        const newPath = currentPath === '/'
            ? `/${folderName}`
            : `${currentPath}/${folderName}`;
        fetchFiles(newPath);
    };

    const navigateUp = () => {
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        const newPath = parts.length === 0 ? '/' : '/' + parts.join('/');
        fetchFiles(newPath);
    };

    const pathParts = currentPath.split('/').filter(Boolean);

    const formatSize = (bytes: number | null): string => {
        if (bytes === null) return '';
        if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
        if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
        if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${bytes} B`;
    };

    const handleUpload = async () => {
        try {
            const selected = await open({
                multiple: false,
                title: t.selectFileUpload
            });

            if (selected && typeof selected === 'string') {
                setActionLoading('upload');
                const fileName = selected.split(/[/\\]/).pop() || 'file';
                const remotePath = `${currentPath}/${fileName}`;

                await invoke('push_file', {
                    deviceId: device.id,
                    localPath: selected,
                    remotePath
                });

                toast.success(t.fileUploaded, { description: fileName });
                fetchFiles();
            }
        } catch (e) {
            toast.error(t.uploadFailed, { description: String(e) });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDownload = async (file: FileInfo) => {
        try {
            const localPath = await save({
                defaultPath: file.name,
                title: t.downloadFile
            });

            if (localPath) {
                setActionLoading(file.name);
                const remotePath = `${currentPath}/${file.name}`;

                await invoke('pull_file', {
                    deviceId: device.id,
                    remotePath,
                    localPath
                });

                toast.success(t.fileDownloaded, { description: file.name });
            }
        } catch (e) {
            toast.error(t.downloadFailed, { description: String(e) });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (file: FileInfo) => {
        setActionLoading(file.name);
        setConfirmDelete(null);
        try {
            const remotePath = `${currentPath}/${file.name}`;
            await invoke('delete_remote_file', {
                deviceId: device.id,
                remotePath
            });
            toast.success(t.deleted, { description: file.name });
            setFiles(prev => prev.filter(f => f.name !== file.name));
        } catch (e) {
            toast.error(t.deleteFailed, { description: String(e) });
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        setActionLoading('newfolder');
        try {
            const remotePath = `${currentPath}/${newFolderName}`;
            await invoke('create_remote_directory', {
                deviceId: device.id,
                remotePath
            });
            toast.success(t.folderCreated, { description: newFolderName });
            setNewFolderMode(false);
            setNewFolderName('');
            fetchFiles();
        } catch (e) {
            toast.error(t.createFolderFailed, { description: String(e) });
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="h-full flex gap-4">
            {/* Sidebar - Quick Access */}
            <div className="w-48 shrink-0 flex flex-col gap-1 py-1 overflow-y-auto custom-scrollbar">
                <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {t.quickAccess}
                </div>
                {QUICK_ACCESS_ITEMS(t).map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigateTo(item.path)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === item.path || (currentPath.startsWith(item.path) && item.path !== '/' && item.path !== '/sdcard')
                            ? 'bg-accent/10 text-accent'
                            : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                            }`}
                    >
                        <span className={currentPath === item.path ? 'text-accent' : 'text-text-muted'}>
                            {item.icon}
                        </span>
                        {item.name}
                    </button>
                ))}
            </div>

            {/* Initial Vertical Divider */}
            <div className="w-px bg-border h-full" />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <div className="flex items-center gap-2 mb-4">
                    <button
                        onClick={handleUpload}
                        disabled={actionLoading === 'upload'}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-elevated border border-border text-text-muted hover:text-text-primary hover:border-accent transition-all text-sm disabled:opacity-50"
                    >
                        {actionLoading === 'upload' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {t.upload}
                    </button>

                    <button
                        onClick={() => setNewFolderMode(true)}
                        disabled={newFolderMode}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-elevated border border-border text-text-muted hover:text-text-primary hover:border-accent transition-all text-sm disabled:opacity-50"
                    >
                        <FolderPlus size={16} />
                        {t.newFolder}
                    </button>

                    <div className="flex-1" />

                    <button
                        onClick={() => fetchFiles()}
                        disabled={loading}
                        className="p-2 rounded-lg bg-surface-elevated border border-border text-text-muted hover:text-text-primary hover:border-accent transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Breadcrumb */}
                <div className="flex items-center gap-1 mb-4 text-sm overflow-x-auto pb-1 custom-scrollbar">
                    <button
                        onClick={() => navigateTo('/')}
                        className="text-text-muted hover:text-accent transition-colors shrink-0 font-medium"
                    >
                        /
                    </button>
                    {pathParts.map((part, index) => (
                        <div key={index} className="flex items-center shrink-0">
                            <ChevronRight size={14} className="text-text-muted mx-1" />
                            <button
                                onClick={() => navigateTo('/' + pathParts.slice(0, index + 1).join('/'))}
                                className={`transition-colors ${index === pathParts.length - 1
                                    ? 'text-text-primary font-semibold'
                                    : 'text-text-secondary hover:text-accent'
                                    }`}
                            >
                                {part}
                            </button>
                        </div>
                    ))}
                </div>

                {/* New Folder Input */}
                {newFolderMode && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-surface-elevated border border-border rounded-xl">
                        <FolderPlus size={18} className="text-accent shrink-0" />
                        <input
                            type="text"
                            placeholder={t.folderNamePlaceholder}
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                            autoFocus
                        />
                        <button
                            onClick={handleCreateFolder}
                            disabled={!newFolderName.trim() || actionLoading === 'newfolder'}
                            className="px-3 py-1 text-xs bg-accent text-white rounded-lg hover:bg-accent-secondary disabled:opacity-50"
                        >
                            {actionLoading === 'newfolder' ? <Loader2 size={12} className="animate-spin" /> : t.create}
                        </button>
                        <button
                            onClick={() => { setNewFolderMode(false); setNewFolderName(''); }}
                            className="px-3 py-1 text-xs bg-surface-card border border-border rounded-lg hover:bg-surface-hover text-text-secondary"
                        >
                            {t.cancel}
                        </button>
                    </div>
                )}

                {/* File List */}
                <div className="flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto custom-scrollbar pr-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 size={32} className="animate-spin text-accent" />
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-16 text-error">
                                <AlertTriangle size={32} className="mb-2 opacity-60" />
                                <p className="text-sm text-center">{error}</p>
                                <button
                                    onClick={navigateUp}
                                    className="mt-4 px-4 py-2 text-sm bg-surface-elevated border border-border rounded-lg hover:bg-surface-hover text-text-secondary"
                                >
                                    {t.goBack}
                                </button>
                            </div>
                        ) : files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                                <Folder size={32} className="mb-2 opacity-40" />
                                <p className="text-sm">{t.emptyFolder}</p>
                            </div>
                        ) : (
                            <motion.div
                                variants={listContainer}
                                initial="initial"
                                animate="animate"
                                className="space-y-1"
                            >
                                {/* Go Up */}
                                {currentPath !== '/' && (
                                    <motion.button
                                        variants={listItem}
                                        onClick={navigateUp}
                                        className="w-full flex items-center gap-3 p-3 bg-surface-card border border-border rounded-xl hover:border-accent/30 transition-colors text-left group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                                            <ChevronRight size={16} className="text-text-muted rotate-180 group-hover:text-accent transition-colors" />
                                        </div>
                                        <span className="text-sm text-text-secondary">..</span>
                                    </motion.button>
                                )}

                                {files.map((file) => (
                                    <motion.div
                                        key={file.name}
                                        variants={listItem}
                                        className="flex items-center gap-3 p-3 bg-surface-card border border-border rounded-xl hover:border-accent/30 transition-colors group"
                                    >
                                        {file.is_directory ? (
                                            <button
                                                onClick={() => navigateToFolder(file.name)}
                                                className="flex items-center gap-3 flex-1 min-w-0 text-left"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                                    <Folder size={16} className="text-accent" />
                                                </div>
                                                <span className="text-sm text-text-primary truncate">{file.name}</span>
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
                                                    <File size={16} className="text-text-muted" />
                                                </div>
                                                <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
                                                <span className="text-xs text-text-muted shrink-0 min-w-[60px] text-right">{formatSize(file.size)}</span>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!file.is_directory && (
                                                <button
                                                    onClick={() => handleDownload(file)}
                                                    disabled={actionLoading === file.name}
                                                    className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-all"
                                                    title={t.download}
                                                >
                                                    {actionLoading === file.name ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Download size={14} />
                                                    )}
                                                </button>
                                            )}

                                            {confirmDelete === file.name ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleDelete(file)}
                                                        className="px-2 py-1 text-xs bg-error text-white rounded shadow-sm hover:bg-error/90"
                                                    >
                                                        {t.confirm}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(null)}
                                                        className="px-2 py-1 text-xs bg-surface-elevated border border-border rounded shadow-sm hover:bg-surface-hover hover:text-text-primary text-text-secondary"
                                                    >
                                                        {t.cancel}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDelete(file.name)}
                                                    className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all"
                                                    title={t.delete}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
