import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wifi, WifiOff, Loader2, Copy, Check, Smartphone } from 'lucide-react';
import { invoke } from '../../utils/tauri';
import { toast } from 'sonner';
import { Select } from '../ui/Select';
import { useLanguage } from '../../contexts/LanguageContext';
import { modalBackdrop, modalContent } from '../../lib/animations';
import { createPortal } from 'react-dom';

interface WirelessConnectModalProps {
    onClose: () => void;
}

export function WirelessConnectModal({ onClose }: WirelessConnectModalProps) {
    const { t } = useLanguage();
    const [ip, setIp] = useState('');
    const [port, setPort] = useState('5555');
    const [loading, setLoading] = useState(false);
    const [deviceIp, setDeviceIp] = useState<string | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<string>('');
    const [devices, setDevices] = useState<Array<{ id: string; model?: string }>>([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Fetch connected devices
        invoke<Array<{ id: string; model?: string }>>('get_devices')
            .then(setDevices)
            .catch(console.error);
    }, []);

    const handleEnableTcpip = async () => {
        if (!selectedDevice) {
            toast.error(t.selectDeviceFirst);
            return;
        }

        setLoading(true);
        try {
            const result = await invoke<string>('enable_tcpip', {
                deviceId: selectedDevice,
                port,
            });
            toast.success(result);

            // Retry fetching IP for up to 6 seconds (3 attempts x 2s)
            // ADB restart can cause temporary disconnect
            let retries = 3;
            let ip = null;
            let lastError = null;

            while (retries > 0 && !ip) {
                try {
                    // Wait 2 seconds before each attempt
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    ip = await invoke<string>('get_device_ip', { deviceId: selectedDevice });
                } catch (e) {
                    lastError = e;
                    retries--;
                    if (retries > 0) {
                        toast.loading(`${t.waitingForDevice} (${retries})`);
                    }
                }
            }

            toast.dismiss(); // dismiss loading toast

            if (ip) {
                setDeviceIp(ip);
                setIp(ip);
                toast.success(`${t.foundIp}: ${ip}`);
            } else {
                toast.error(`${t.couldNotGetIp}: ${lastError}`);
            }

        } catch (err) {
            toast.error(String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        if (!ip) {
            toast.error(t.enterIpAddress);
            return;
        }

        setLoading(true);
        try {
            const result = await invoke<string>('connect_wireless', { ip, port });
            toast.success(result);
            onClose();
        } catch (err) {
            toast.error(String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!ip) return;

        setLoading(true);
        try {
            const result = await invoke<string>('disconnect_wireless', { ip, port });
            toast.info(result);
        } catch (err) {
            toast.error(String(err));
        } finally {
            setLoading(false);
        }
    };

    const copyIp = () => {
        if (deviceIp) {
            navigator.clipboard.writeText(`${deviceIp}:${port}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Device options for Select component
    const deviceOptions = devices
        .filter((d) => !d.id.includes(':'))
        .map((d) => ({
            value: d.id,
            label: d.model || d.id,
            icon: <Smartphone size={14} className="text-accent" />,
        }));

    return createPortal(
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                variants={modalBackdrop}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none p-4">
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
                                <Wifi size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary">{t.wirelessAdb}</h3>
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
                        {/* Step 1: Enable on USB device */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-primary">
                                {t.step1EnableWireless}
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Select
                                        options={deviceOptions}
                                        value={selectedDevice}
                                        onChange={setSelectedDevice}
                                        placeholder={t.selectUsbDevice}
                                    />
                                </div>
                                <button
                                    onClick={handleEnableTcpip}
                                    disabled={loading || !selectedDevice}
                                    className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : t.btnEnable}
                                </button>
                            </div>
                            {deviceIp && (
                                <div className="flex items-center gap-2 p-2 bg-success/10 text-success rounded-lg text-sm">
                                    <span>Device IP: {deviceIp}:{port}</span>
                                    <button onClick={copyIp} className="p-1 hover:bg-success/20 rounded">
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-border pt-4 space-y-2">
                            <label className="text-sm font-medium text-text-primary">
                                {t.step2ConnectWirelessly}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="192.168.1.xxx"
                                    value={ip}
                                    onChange={(e) => setIp(e.target.value)}
                                    className="flex-1 bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                                />
                                <input
                                    type="text"
                                    placeholder="5555"
                                    value={port}
                                    onChange={(e) => setPort(e.target.value)}
                                    className="w-20 bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary text-center focus:outline-none focus:border-accent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-2 px-6 py-4 border-t border-border">
                        <button
                            onClick={handleDisconnect}
                            disabled={loading || !ip}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-elevated border border-border rounded-lg text-sm font-medium text-text-secondary hover:text-error hover:border-error disabled:opacity-50 transition-colors"
                        >
                            <WifiOff size={16} />
                            {t.btnDisconnect}
                        </button>
                        <button
                            onClick={handleConnect}
                            disabled={loading || !ip}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-secondary disabled:opacity-50 transition-colors"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
                            {t.btnConnect}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
