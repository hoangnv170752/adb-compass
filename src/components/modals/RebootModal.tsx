import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Power, RotateCcw, HardDrive, Loader2, AlertTriangle } from 'lucide-react';
import { invoke } from '../../utils/tauri';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import { modalBackdrop, modalContent } from '../../lib/animations';

interface RebootModalProps {
    deviceId: string;
    onClose: () => void;
}

type RebootMode = 'normal' | 'recovery' | 'bootloader';

export function RebootModal({ deviceId, onClose }: RebootModalProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [confirmMode, setConfirmMode] = useState<RebootMode | null>(null);

    const handleReboot = async (mode: RebootMode) => {
        setLoading(true);
        try {
            const modeArg = mode === 'normal' ? null : mode;
            await invoke('reboot_device', { deviceId, mode: modeArg });
            toast.success(t.rebootDevice, {
                description: mode === 'normal' ? t.normalReboot :
                    mode === 'recovery' ? t.recoveryMode : t.bootloaderMode
            });
            onClose();
        } catch (e) {
            toast.error(String(e));
        } finally {
            setLoading(false);
            setConfirmMode(null);
        }
    };

    const rebootOptions = [
        {
            mode: 'normal' as RebootMode,
            icon: Power,
            title: t.normalReboot,
            description: t.normalRebootDesc,
            color: 'text-accent',
            bgColor: 'bg-accent/10',
        },
        {
            mode: 'recovery' as RebootMode,
            icon: RotateCcw,
            title: t.recoveryMode,
            description: t.recoveryModeDesc,
            color: 'text-warning',
            bgColor: 'bg-warning/10',
        },
        {
            mode: 'bootloader' as RebootMode,
            icon: HardDrive,
            title: t.bootloaderMode,
            description: t.bootloaderModeDesc,
            color: 'text-error',
            bgColor: 'bg-error/10',
        },
    ];

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
                    className="bg-surface-card border border-border rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto"
                    variants={modalContent}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                <Power size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary">{t.rebootDevice}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {confirmMode ? (
                            // Confirmation View
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-3 p-4 bg-warning/10 rounded-xl text-warning">
                                    <AlertTriangle size={24} />
                                    <p className="text-sm">{t.confirmReboot}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setConfirmMode(null)}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 rounded-lg border border-border text-text-secondary
                                                   hover:bg-surface-elevated transition-colors"
                                    >
                                        {t.cancel}
                                    </button>
                                    <button
                                        onClick={() => handleReboot(confirmMode)}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 rounded-lg bg-accent text-white
                                                   hover:bg-accent-secondary transition-colors
                                                   disabled:opacity-50 disabled:cursor-not-allowed
                                                   flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Power size={16} />
                                        )}
                                        {t.confirm}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            // Options View
                            <div className="space-y-3">
                                {rebootOptions.map((option) => (
                                    <button
                                        key={option.mode}
                                        onClick={() => setConfirmMode(option.mode)}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-border
                                                   hover:border-accent hover:bg-surface-elevated transition-all group"
                                    >
                                        <div className={`w-12 h-12 rounded-xl ${option.bgColor} flex items-center justify-center ${option.color}`}>
                                            <option.icon size={24} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-medium text-text-primary group-hover:text-accent transition-colors">
                                                {option.title}
                                            </p>
                                            <p className="text-sm text-text-muted">{option.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
