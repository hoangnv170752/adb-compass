import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Send, Loader2 } from 'lucide-react';
import { invoke } from '../../utils/tauri';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import { modalBackdrop, modalContent } from '../../lib/animations';

interface InputTextModalProps {
    deviceId: string;
    onClose: () => void;
}

export function InputTextModal({ deviceId, onClose }: InputTextModalProps) {
    const { t } = useLanguage();
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!text.trim()) return;

        setLoading(true);
        try {
            await invoke('input_text', { deviceId, text: text.trim() });
            toast.success(t.textSent);
            setText('');
        } catch (e: unknown) {
            const errorMessage = typeof e === 'object' && e !== null && 'message' in e
                ? (e as { message: string }).message
                : String(e);
            toast.error(t.textFailed, { description: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
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
                                <Keyboard size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary">{t.inputText}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t.textPlaceholder}
                            className="w-full h-32 px-4 py-3 bg-surface-elevated border border-border rounded-xl
                                       text-text-primary placeholder:text-text-muted resize-none
                                       focus:outline-none focus:border-accent transition-colors"
                            disabled={loading}
                            autoFocus
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-secondary
                                           hover:bg-surface-elevated transition-colors"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={loading || !text.trim()}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-white
                                           hover:bg-accent-secondary transition-colors
                                           disabled:opacity-50 disabled:cursor-not-allowed
                                           flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Send size={18} />
                                )}
                                {t.sendText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
