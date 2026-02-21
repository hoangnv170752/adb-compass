import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wifi, Loader2, ArrowRight } from 'lucide-react';
import { modalBackdrop, modalContent } from '../../lib/animations';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDevices } from '../../hooks/useDevices';
import { invoke } from '../../utils/tauri';
import { toast } from 'sonner';

interface ManualConnectModalProps {
    onClose: () => void;
}

export function ManualConnectModal({ onClose }: ManualConnectModalProps) {
    const { t } = useLanguage();
    const { addManualDevice, refreshDevices } = useDevices();
    const [ip, setIp] = useState('');
    const [connecting, setConnecting] = useState(false);

    const handleConnect = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!ip.trim()) return;

        try {
            // Split ip and port if provided
            let finalIp = ip.trim();
            let finalPort = '5555';

            if (finalIp.includes(':')) {
                const parts = finalIp.split(':');
                finalIp = parts[0];
                finalPort = parts[1] || '5555';
            }

            const targetFull = `${finalIp}:${finalPort}`;

            // Add to list immediately as "Connecting..."
            addManualDevice(targetFull);
            onClose(); // Close immediately to show feedback in list

            toast.promise(
                invoke('connect_wireless', { ip: finalIp, port: finalPort }),
                {
                    loading: `${t.connectingTo} ${targetFull}...`,
                    success: () => {
                        refreshDevices(); // Refresh to get the real status
                        return `${t.connectedTo} ${targetFull}`;
                    },
                    error: (err: any) => {
                        return `${t.failedToConnect}: ${err}`;
                    }
                }
            );

        } catch (err) {
            console.error(err);
        } finally {
            setConnecting(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                variants={modalBackdrop}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={onClose}
            >
                <motion.div
                    className="bg-surface-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden"
                    variants={modalContent}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                <Wifi size={24} />
                            </div>
                            <h3 className="text-xl font-semibold text-text-primary">{t.connectViaIp}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        <p className="text-text-secondary mb-4 text-sm">
                            {t.enterIpPort}
                        </p>

                        <form onSubmit={handleConnect}>
                            <div className="mb-6">
                                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                                    {t.ipAddress}
                                </label>
                                <input
                                    type="text"
                                    value={ip}
                                    onChange={(e) => setIp(e.target.value)}
                                    placeholder={t.ipPlaceholder}
                                    className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-mono"
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-text-secondary hover:bg-surface-elevated rounded-lg font-medium transition-colors"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    type="submit"
                                    disabled={!ip.trim() || connecting}
                                    className="flex items-center gap-2 px-6 py-2 bg-accent hover:bg-accent-secondary text-white rounded-lg font-medium transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {connecting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>{t.btnConnecting}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{t.btnConnect}</span>
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
