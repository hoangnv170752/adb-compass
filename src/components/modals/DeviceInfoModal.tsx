import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Battery, BatteryCharging, Cpu, Hash, Loader2 } from 'lucide-react';
import { invoke } from '../../utils/tauri';
import { useLanguage } from '../../contexts/LanguageContext';
import { modalBackdrop, modalContent } from '../../lib/animations';

interface DeviceProps {
    model: string;
    android_version: string;
    sdk_version: string;
    battery_level: number | null;
    is_charging: boolean;
}

interface DeviceInfoModalProps {
    deviceId: string;
    onClose: () => void;
}

export function DeviceInfoModal({ deviceId, onClose }: DeviceInfoModalProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [props, setProps] = useState<DeviceProps | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProps = async () => {
            try {
                const result = await invoke<DeviceProps>('get_device_props', { deviceId });
                setProps(result);
            } catch (e) {
                setError(String(e));
            } finally {
                setLoading(false);
            }
        };
        fetchProps();
    }, [deviceId]);

    const getBatteryColor = (level: number | null) => {
        if (level === null) return 'text-text-muted';
        if (level > 60) return 'text-success';
        if (level > 20) return 'text-warning';
        return 'text-error';
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
                                <Smartphone size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary">{t.deviceInfo}</h3>
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
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={32} className="animate-spin text-accent" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-8 text-error">
                                <p>{error}</p>
                            </div>
                        ) : props ? (
                            <div className="space-y-4">
                                {/* Model */}
                                <div className="flex items-center gap-4 p-4 bg-surface-elevated rounded-xl">
                                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                                        <Smartphone size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-text-muted">{t.model}</p>
                                        <p className="text-sm font-medium text-text-primary">{props.model}</p>
                                    </div>
                                </div>

                                {/* Android Version & SDK */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-surface-elevated rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Cpu size={16} className="text-accent" />
                                            <p className="text-xs text-text-muted">{t.androidVersion}</p>
                                        </div>
                                        <p className="text-lg font-semibold text-text-primary">
                                            Android {props.android_version}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-surface-elevated rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Hash size={16} className="text-accent" />
                                            <p className="text-xs text-text-muted">{t.sdkVersion}</p>
                                        </div>
                                        <p className="text-lg font-semibold text-text-primary">
                                            API {props.sdk_version}
                                        </p>
                                    </div>
                                </div>

                                {/* Battery */}
                                <div className="p-4 bg-surface-elevated rounded-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {props.is_charging ? (
                                                <BatteryCharging size={20} className="text-success" />
                                            ) : (
                                                <Battery size={20} className={getBatteryColor(props.battery_level)} />
                                            )}
                                            <p className="text-sm text-text-muted">{t.battery}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {props.is_charging && (
                                                <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                                                    {t.charging}
                                                </span>
                                            )}
                                            <span className={`text-lg font-bold ${getBatteryColor(props.battery_level)}`}>
                                                {props.battery_level !== null ? `${props.battery_level}%` : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    {props.battery_level !== null && (
                                        <div className="w-full h-2 bg-surface-card rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${props.battery_level > 60 ? 'bg-success' :
                                                    props.battery_level > 20 ? 'bg-warning' : 'bg-error'
                                                    }`}
                                                style={{ width: `${props.battery_level}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Device ID */}
                                <div className="p-3 bg-surface-elevated rounded-xl">
                                    <p className="text-xs text-text-muted mb-1">{t.deviceId}</p>
                                    <p className="text-xs font-mono text-text-secondary break-all">{deviceId}</p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
