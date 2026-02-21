import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Search, Package, Loader2, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { invoke } from '../../utils/tauri';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import { modalBackdrop, modalContent } from '../../lib/animations';

interface UninstallModalProps {
    deviceId: string;
    onClose: () => void;
}

export function UninstallModal({ deviceId, onClose }: UninstallModalProps) {
    const { t } = useLanguage();
    const [packages, setPackages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [uninstalling, setUninstalling] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSystemApps, setShowSystemApps] = useState(false);
    const [confirmPackage, setConfirmPackage] = useState<string | null>(null);

    useEffect(() => {
        loadPackages();
    }, [showSystemApps]);

    const loadPackages = async () => {
        setLoading(true);
        try {
            const result = await invoke<string[]>('list_packages', {
                deviceId,
                includeSystem: showSystemApps
            });
            setPackages(result.sort());
        } catch (e) {
            toast.error(String(e));
        } finally {
            setLoading(false);
        }
    };

    const filteredPackages = useMemo(() => {
        if (!searchQuery.trim()) return packages;
        const query = searchQuery.toLowerCase();
        return packages.filter(pkg => pkg.toLowerCase().includes(query));
    }, [packages, searchQuery]);

    const handleUninstall = async (packageName: string) => {
        setUninstalling(packageName);
        try {
            await invoke('uninstall_app', { deviceId, packageName });
            toast.success(t.uninstallSuccess, { description: packageName });
            setPackages(prev => prev.filter(p => p !== packageName));
        } catch (e) {
            toast.error(t.uninstallFailed, { description: String(e) });
        } finally {
            setUninstalling(null);
            setConfirmPackage(null);
        }
    };

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
                    className="bg-surface-card border border-border rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto flex flex-col max-h-[80vh]"
                    variants={modalContent}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error">
                                <Trash2 size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary">{t.uninstallApp}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search & Toggle */}
                    <div className="px-6 py-4 border-b border-border shrink-0 space-y-3">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t.searchPackages}
                                className="w-full pl-10 pr-4 py-2.5 bg-surface-elevated border border-border rounded-xl
                                           text-text-primary placeholder:text-text-muted
                                           focus:outline-none focus:border-accent transition-colors"
                            />
                        </div>
                        <button
                            onClick={() => setShowSystemApps(!showSystemApps)}
                            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                        >
                            {showSystemApps ? (
                                <ToggleRight size={24} className="text-accent" />
                            ) : (
                                <ToggleLeft size={24} />
                            )}
                            {t.showSystemApps}
                        </button>
                    </div>

                    {/* Package List */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 size={32} className="animate-spin text-accent" />
                            </div>
                        ) : filteredPackages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                                <Package size={48} className="mb-3 opacity-50" />
                                <p>{t.noPackagesFound}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredPackages.map((pkg) => (
                                    <div
                                        key={pkg}
                                        className="flex items-center justify-between px-4 py-3 bg-surface-elevated rounded-xl
                                                   border border-transparent hover:border-border transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <Package size={18} className="text-accent shrink-0" />
                                            <span className="text-sm text-text-primary truncate font-mono">
                                                {pkg}
                                            </span>
                                        </div>
                                        {confirmPackage === pkg ? (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => setConfirmPackage(null)}
                                                    disabled={uninstalling === pkg}
                                                    className="px-3 py-1 text-xs rounded-lg border border-border text-text-secondary
                                                               hover:bg-surface-card transition-colors"
                                                >
                                                    {t.cancel}
                                                </button>
                                                <button
                                                    onClick={() => handleUninstall(pkg)}
                                                    disabled={uninstalling === pkg}
                                                    className="px-3 py-1 text-xs rounded-lg bg-error text-white
                                                               hover:bg-error/80 transition-colors
                                                               disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    {uninstalling === pkg && (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    )}
                                                    {t.confirm}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmPackage(pkg)}
                                                className="p-2 text-text-muted hover:text-error opacity-0 group-hover:opacity-100 
                                                           transition-all rounded-lg hover:bg-error/10 shrink-0"
                                                title={t.uninstallApp}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="px-6 py-3 border-t border-border shrink-0">
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                            <AlertTriangle size={14} />
                            <span>{t.confirmUninstall}?</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
