import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Moon, Sun, MousePointer2, FastForward,
    RefreshCcw, Power,
    ChevronRight, Loader2, Sparkles
} from 'lucide-react';
import { invoke } from '../../utils/tauri';
import { toast } from 'sonner';

interface QuickActionMenuProps {
    deviceId: string;
    triggerIcon?: React.ReactNode;
}

export function QuickActionMenu({ deviceId, triggerIcon }: QuickActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const runAction = async (name: string, promise: Promise<any>) => {
        setLoading(name);
        try {
            await promise;
            toast.success(`${name} completed`);
        } catch (err) {
            toast.error(`${name} failed: ${String(err)}`);
        } finally {
            setLoading(null);
        }
    };

    const ActionItem = ({ icon, label, onClick, id, color = "text-accent" }: any) => (
        <button
            onClick={() => { onClick(); if (!id.includes('toggle')) setIsOpen(false); }}
            disabled={loading !== null}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-elevated transition-all group border border-transparent hover:border-border"
        >
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-surface-card border border-border flex items-center justify-center group-hover:scale-110 transition-transform ${color}/20 ${color}`}>
                    {loading === id ? <Loader2 size={16} className="animate-spin" /> : icon}
                </div>
                <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary">{label}</span>
            </div>
            <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
        </button>
    );

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-lg border transition-all ${isOpen ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' : 'bg-surface-elevated border-border text-text-secondary hover:text-accent hover:border-accent'}`}
                title="Quick Actions"
            >
                {triggerIcon || <Zap size={20} className={isOpen ? 'fill-current' : ''} />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-72 bg-surface-card border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden"
                    >
                        <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                            <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                <Sparkles size={10} /> System Toggles
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                                <ActionItem
                                    id="toggle-dark"
                                    icon={<Moon size={16} />}
                                    label="Force Dark Mode"
                                    onClick={() => runAction('Dark Mode', invoke('set_dark_mode', { deviceId, enabled: true }))}
                                />
                                <ActionItem
                                    id="toggle-light"
                                    icon={<Sun size={16} />}
                                    label="Force Light Mode"
                                    onClick={() => runAction('Light Mode', invoke('set_dark_mode', { deviceId, enabled: false }))}
                                />
                                <ActionItem
                                    id="toggle-taps"
                                    icon={<MousePointer2 size={16} />}
                                    label="Toggle Show Taps"
                                    onClick={() => runAction('Show Taps', invoke('set_show_taps', { deviceId, enabled: true }))}
                                />
                                <ActionItem
                                    id="toggle-anim"
                                    icon={<FastForward size={16} />}
                                    label="Speed up Anims (0.5x)"
                                    onClick={() => runAction('Animations', invoke('set_animations', { deviceId, scale: 0.5 }))}
                                />
                            </div>

                            <div className="h-px bg-border my-2 mx-2" />

                            <div className="px-3 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                <RefreshCcw size={10} /> Maintenance
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                                <ActionItem
                                    id="reboot-recovery"
                                    icon={<RefreshCcw size={16} />}
                                    label="Reboot to Recovery"
                                    onClick={() => runAction('Reboot Recovery', invoke('reboot_device', { deviceId, mode: 'recovery' }))}
                                    color="text-warning"
                                />
                                <ActionItem
                                    id="reboot-bootloader"
                                    icon={<Power size={16} />}
                                    label="Reboot to Bootloader"
                                    onClick={() => runAction('Reboot Bootloader', invoke('reboot_device', { deviceId, mode: 'bootloader' }))}
                                    color="text-error"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
