import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, FolderOpen, File, ChevronRight, Home, RefreshCw,
    Upload, Download, Trash2, FolderPlus, Loader2, AlertTriangle
} from 'lucide-react';
import { invoke } from '../../utils/tauri';
import { open, save } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import { modalBackdrop, modalContent } from '../../lib/animations';

interface FileInfo {
    name: string;
    is_directory: boolean;
    size: number | null;
    permissions: string | null;
}

interface FileTransferModalProps {
    deviceId: string;
    onClose: () => void;
}

export function FileTransferModal({ deviceId, onClose }: FileTransferModalProps) {
    const { t } = useLanguage();
    // Default to internal storage - the most commonly accessed location
    const [currentPath, setCurrentPath] = useState('/storage/emulated/0');
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
    const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadFiles();
    }, [currentPath]);

    const loadFiles = async () => {
        setLoading(true);
        setSelectedFile(null);
        try {
            // Add minimum 500ms delay for better UX feedback
            const [result] = await Promise.all([
                invoke<FileInfo[]>('list_files', {
                    deviceId,
                    path: currentPath
                }),
                new Promise(resolve => setTimeout(resolve, 500))
            ]);
            setFiles(result);
        } catch (e: unknown) {
            const errorMessage = typeof e === 'object' && e !== null && 'message' in e
                ? (e as { message: string }).message
                : String(e);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const navigateTo = (path: string) => {
        setCurrentPath(path);
    };

    const navigateToFolder = (folderName: string) => {
        const newPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
        navigateTo(newPath);
    };

    const navigateUp = () => {
        if (currentPath === '/') return;
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        navigateTo(parts.length === 0 ? '/' : `/${parts.join('/')}`);
    };

    const handleUpload = async () => {
        try {
            const selected = await open({
                multiple: false,
            });
            if (!selected) return;

            setActionLoading('upload');
            const localPath = typeof selected === 'string' ? selected : selected;
            const fileName = localPath.split(/[\\/]/).pop() || 'file';
            const remotePath = `${currentPath}/${fileName}`;

            await invoke('push_file', { deviceId, localPath, remotePath });
            toast.success(t.uploadFile, { description: fileName });
            loadFiles();
        } catch (e) {
            toast.error(String(e));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDownload = async () => {
        if (!selectedFile || selectedFile.is_directory) return;

        try {
            const localPath = await save({
                defaultPath: selectedFile.name,
            });
            if (!localPath) return;

            setActionLoading('download');
            const remotePath = `${currentPath}/${selectedFile.name}`;

            await invoke('pull_file', { deviceId, remotePath, localPath });
            toast.success(t.downloadFile, { description: selectedFile.name });
        } catch (e) {
            toast.error(String(e));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!selectedFile) return;

        setActionLoading('delete');
        try {
            const remotePath = `${currentPath}/${selectedFile.name}`;
            await invoke('delete_remote_file', { deviceId, remotePath });
            toast.success(t.deleteFile, { description: selectedFile.name });
            setSelectedFile(null);
            loadFiles();
        } catch (e) {
            toast.error(String(e));
        } finally {
            setActionLoading(null);
            setShowDeleteConfirm(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        setActionLoading('mkdir');
        try {
            const remotePath = `${currentPath}/${newFolderName.trim()}`;
            await invoke('create_remote_directory', { deviceId, remotePath });
            toast.success(t.createFolder, { description: newFolderName });
            setNewFolderName('');
            setShowNewFolderDialog(false);
            loadFiles();
        } catch (e) {
            toast.error(String(e));
        } finally {
            setActionLoading(null);
        }
    };

    const formatSize = (bytes: number | null) => {
        if (bytes === null) return '-';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    const pathParts = currentPath.split('/').filter(Boolean);

    return createPortal(
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                variants={modalBackdrop}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
                <motion.div
                    className="bg-surface-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto flex flex-col max-h-[85vh]"
                    variants={modalContent}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                <FolderOpen size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary">{t.fileTransfer}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Breadcrumb */}
                    <div className="px-6 py-3 border-b border-border shrink-0 flex items-center gap-1 overflow-x-auto custom-scrollbar">
                        <button
                            onClick={() => navigateTo('/')}
                            className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                        >
                            <Home size={16} />
                        </button>
                        {pathParts.map((part, index) => (
                            <div key={index} className="flex items-center">
                                <ChevronRight size={14} className="text-text-muted mx-1" />
                                <button
                                    onClick={() => navigateTo('/' + pathParts.slice(0, index + 1).join('/'))}
                                    className="px-2 py-1 text-sm text-text-secondary hover:text-accent rounded transition-colors truncate max-w-[120px]"
                                >
                                    {part}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Toolbar */}
                    <div className="px-6 py-3 border-b border-border shrink-0 flex items-center gap-2">
                        <button
                            onClick={loadFiles}
                            disabled={loading}
                            className="p-2 rounded-lg border border-border text-text-secondary hover:text-accent hover:border-accent transition-colors"
                            title={t.refresh}
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!!actionLoading}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-secondary 
                                       hover:text-accent hover:border-accent transition-colors text-sm"
                        >
                            {actionLoading === 'upload' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            {t.uploadFile}
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={!selectedFile || selectedFile.is_directory || !!actionLoading}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-secondary 
                                       hover:text-accent hover:border-accent transition-colors text-sm
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {actionLoading === 'download' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            {t.downloadFile}
                        </button>
                        <button
                            onClick={() => setShowNewFolderDialog(true)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-secondary 
                                       hover:text-accent hover:border-accent transition-colors text-sm"
                        >
                            <FolderPlus size={14} />
                            {t.createFolder}
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={!selectedFile || !!actionLoading}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-secondary 
                                       hover:text-error hover:border-error transition-colors text-sm ml-auto
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 size={14} />
                            {t.deleteFile}
                        </button>
                    </div>

                    {/* File List */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 size={32} className="animate-spin text-accent" />
                            </div>
                        ) : files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                                <FolderOpen size={48} className="mb-3 opacity-50" />
                                <p>{t.emptyFolder}</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {/* Parent directory */}
                                {currentPath !== '/' && (
                                    <button
                                        onClick={navigateUp}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                                                   hover:bg-surface-elevated transition-colors"
                                    >
                                        <FolderOpen size={18} className="text-warning" />
                                        <span className="text-sm text-text-secondary">..</span>
                                    </button>
                                )}
                                {files.map((file) => (
                                    <button
                                        key={file.name}
                                        onClick={() => {
                                            if (file.is_directory) {
                                                navigateToFolder(file.name);
                                            } else {
                                                setSelectedFile(file === selectedFile ? null : file);
                                            }
                                        }}
                                        onDoubleClick={() => {
                                            if (file.is_directory) {
                                                navigateToFolder(file.name);
                                            }
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors
                                            ${selectedFile?.name === file.name
                                                ? 'bg-accent/10 border border-accent'
                                                : 'hover:bg-surface-elevated border border-transparent'
                                            }`}
                                    >
                                        {file.is_directory ? (
                                            <FolderOpen size={18} className="text-warning shrink-0" />
                                        ) : (
                                            <File size={18} className="text-accent shrink-0" />
                                        )}
                                        <span className="text-sm text-text-primary truncate flex-1 text-left">
                                            {file.name}
                                        </span>
                                        {!file.is_directory && (
                                            <span className="text-xs text-text-muted shrink-0">
                                                {formatSize(file.size)}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* New Folder Dialog */}
                    {showNewFolderDialog && (
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                            <div className="bg-surface-card border border-border rounded-xl p-6 w-80 shadow-xl">
                                <h4 className="text-base font-semibold text-text-primary mb-4">{t.createFolder}</h4>
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder={t.folderName}
                                    className="w-full px-4 py-2.5 bg-surface-elevated border border-border rounded-lg
                                               text-text-primary placeholder:text-text-muted mb-4
                                               focus:outline-none focus:border-accent"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowNewFolderDialog(false)}
                                        className="flex-1 px-4 py-2 rounded-lg border border-border text-text-secondary
                                                   hover:bg-surface-elevated transition-colors text-sm"
                                    >
                                        {t.cancel}
                                    </button>
                                    <button
                                        onClick={handleCreateFolder}
                                        disabled={!newFolderName.trim() || actionLoading === 'mkdir'}
                                        className="flex-1 px-4 py-2 rounded-lg bg-accent text-white text-sm
                                                   hover:bg-accent-secondary transition-colors
                                                   disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {actionLoading === 'mkdir' && <Loader2 size={14} className="animate-spin" />}
                                        {t.create}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delete Confirmation */}
                    {showDeleteConfirm && selectedFile && (
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                            <div className="bg-surface-card border border-border rounded-xl p-6 w-80 shadow-xl">
                                <div className="flex items-center gap-3 text-warning mb-4">
                                    <AlertTriangle size={24} />
                                    <h4 className="text-base font-semibold">{t.confirmDelete}</h4>
                                </div>
                                <p className="text-sm text-text-secondary mb-4 truncate">{selectedFile.name}</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 px-4 py-2 rounded-lg border border-border text-text-secondary
                                                   hover:bg-surface-elevated transition-colors text-sm"
                                    >
                                        {t.cancel}
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={actionLoading === 'delete'}
                                        className="flex-1 px-4 py-2 rounded-lg bg-error text-white text-sm
                                                   hover:bg-error/80 transition-colors
                                                   disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {actionLoading === 'delete' && <Loader2 size={14} className="animate-spin" />}
                                        {t.deleteFile}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
