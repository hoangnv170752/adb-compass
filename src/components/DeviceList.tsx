import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Smartphone, Loader2, AlertTriangle, RefreshCw,
    Info, Trash2, Power, Keyboard, FileInput, Package, Plus, LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { DeviceInfo, ApkInfo } from '../types';
import { RequirementChecklist } from './RequirementChecklist';
import { ActionRequirementsChecklist } from './ActionRequirementsChecklist';
import { InstallButton } from './InstallButton';
import { DeviceInfoModal } from './modals/DeviceInfoModal';
import { RebootModal } from './modals/RebootModal';
import { InputTextModal } from './modals/InputTextModal';
import { UninstallModal } from './modals/UninstallModal';
import { FileTransferModal } from './modals/FileTransferModal';
import { useLanguage } from '../contexts/LanguageContext';
import { useDeviceStatus } from '../hooks/useDeviceStatus';
import { listContainer, listItem } from '../lib/animations';

interface DeviceListProps {
    devices: DeviceInfo[];
    loading: boolean;
    error: string | null;
    apkInfo: ApkInfo | null;
    onRefresh: () => void;
    onDeviceSelect?: (device: DeviceInfo) => void;
    onRemove?: (deviceId: string) => void;
    onAddDevice?: () => void;
    onMultiScreen?: () => void;
}

export function DeviceList({ devices, loading, error, apkInfo, onRefresh, onDeviceSelect, onRemove, onAddDevice, onMultiScreen }: DeviceListProps) {
    const prevDevicesRef = useRef<DeviceInfo[]>([]);
    const { t } = useLanguage();

    useEffect(() => {
        const prevIds = new Set(prevDevicesRef.current.map(d => d.id));
        const currentIds = new Set(devices.filter(d => d.status === 'Device').map(d => d.id));

        devices.forEach(device => {
            if (device.status === 'Device' && !prevIds.has(device.id)) {
                toast.success(t.deviceConnected, { description: device.model || device.id });
            }
        });

        // Only notify disconnect if it was previously connected and now it's not in the connected set
        prevDevicesRef.current.forEach(device => {
            if (device.status === 'Device' && !currentIds.has(device.id)) {
                // It might be still in 'devices' but as 'Offline'
                toast.info(t.deviceDisconnected, { description: device.model || device.id });
            }
        });

        prevDevicesRef.current = devices;
    }, [devices, t]);

    if (error) {
        return (
            <div>
                <motion.div
                    className="flex flex-col items-center justify-center py-16 text-error"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <AlertTriangle size={64} className="mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">{t.connectionError}</h3>
                    <p className="text-text-secondary">{error}</p>
                    <button
                        onClick={onRefresh}
                        className="mt-4 px-4 py-2 bg-surface-elevated hover:bg-surface-card rounded-lg border border-border transition-colors text-sm font-medium"
                    >
                        Retry
                    </button>
                </motion.div>
            </div>
        );
    }

    if (loading && devices.length === 0) {
        return (
            <div>
                <motion.div
                    className="flex flex-col items-center justify-center py-16 text-text-secondary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <Loader2 size={48} className="animate-spin mb-4 text-accent" />
                    <p>{t.searching}</p>
                </motion.div>
            </div>
        );
    }

    if (devices.length === 0) {
        return (
            <div>
                <motion.div
                    className="flex flex-col items-center justify-center py-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Smartphone size={64} className="mb-4 text-text-muted opacity-50" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">{t.noDevices}</h3>
                    <p className="text-text-secondary mb-6">{t.connectDevices}</p>
                    <div className="space-y-3 text-left max-w-md">
                        {[
                            t.hint1,
                            t.hint2,
                            t.hint3,
                            t.hint4,
                        ].map((hint, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-sm font-semibold flex items-center justify-center">
                                    {i + 1}
                                </span>
                                <span className="text-text-secondary text-sm">{hint}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div>
            <motion.div
                className="flex items-center justify-between mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-text-primary">{t.connectedDevices}</h2>
                    <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-sm font-semibold flex items-center justify-center">
                        {devices.filter(d => d.status === 'Device').length}
                    </span>
                    {/* Show offline count if any */}
                    {devices.filter(d => d.status === 'Offline').length > 0 && (
                        <span className="w-6 h-6 rounded-full bg-surface-elevated text-text-muted text-sm font-semibold flex items-center justify-center ml-2" title={t.offlineDevices}>
                            {devices.filter(d => d.status === 'Offline').length}
                        </span>
                    )}
                </div>

                <div className="flex gap-2">
                    {devices.filter(d => d.status === 'Device').length >= 2 && (
                        <button
                            onClick={onMultiScreen}
                            className="p-2 bg-surface-elevated border border-border text-text-secondary hover:text-accent hover:border-accent rounded-lg transition-all"
                            title="Multi-Screen View"
                        >
                            <LayoutGrid size={20} />
                        </button>
                    )}
                    <button
                        onClick={onAddDevice}
                        className="p-2 bg-surface-elevated border border-border text-text-secondary hover:text-accent hover:border-accent rounded-lg transition-all"
                        title={t.connectViaIp}
                    >
                        <Plus size={20} />
                    </button>
                    <button
                        onClick={onRefresh}
                        className="p-2 bg-surface-elevated border border-border text-text-secondary hover:text-accent hover:border-accent rounded-lg transition-all"
                        title={t.refreshDevices}
                        disabled={loading}
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </motion.div>

            <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full"
                layout
                variants={listContainer}
                initial="initial"
                animate="animate"
            >
                <AnimatePresence initial={false}>
                    {devices.map((device) => (
                        <DeviceCard
                            key={device.id}
                            device={device}
                            apkInfo={apkInfo}
                            onSelect={onDeviceSelect}
                            onRemove={onRemove}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

interface DeviceCardProps {
    device: DeviceInfo;
    apkInfo: ApkInfo | null;
    onSelect?: (device: DeviceInfo) => void;
    onRemove?: (deviceId: string) => void;
}

type ActionType = 'info' | 'uninstall' | 'reboot' | 'input' | 'file' | null;
type ChecklistType = 'requirements' | 'actions' | null;

function DeviceCard({ device, apkInfo, onSelect, onRemove }: DeviceCardProps) {
    const { t } = useLanguage();
    const { getStatusTranslation } = useDeviceStatus();
    const [activeAction, setActiveAction] = useState<ActionType>(null);
    const [expandedChecklist, setExpandedChecklist] = useState<ChecklistType>(null);

    const getStatusColor = () => {
        switch (device.status) {
            case 'Device': return 'text-success bg-success/10';
            case 'Unauthorized': return 'text-warning bg-warning/10';
            case 'Offline': return 'text-text-muted bg-surface-elevated';
            default: return 'text-error bg-error/10';
        }
    };

    const displayStatus = getStatusTranslation(device.status);

    // Action Button Styles
    const actionBtnBase = "flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 text-xs font-medium h-9";
    const actionBtnActive = "bg-surface-elevated border-border text-text-primary hover:border-accent hover:text-accent hover:shadow-sm";
    const actionBtnDisabled = "bg-surface-elevated/50 border-transparent text-text-muted cursor-not-allowed opacity-50";

    const isOffline = device.status === 'Offline';

    return (
        <motion.div
            className={`bg-surface-card border border-border rounded-2xl p-5 
                       hover:border-accent ${isOffline ? 'opacity-70 grayscale-[0.5]' : ''}`}
            layout
            initial="initial"
            animate="animate"
            exit="exit"
            variants={listItem}
            whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            transition={{ duration: 0.2, layout: { duration: 0.3 } }}
        >
            {/* Header: Icon + Info - Clickable to open detail view */}
            <div
                className="flex items-center gap-4 mb-4 cursor-pointer group relative"
                onClick={() => !isOffline && onSelect?.(device)}
            >
                <div className="w-12 h-12 rounded-xl bg-surface-elevated flex items-center justify-center text-accent group-hover:bg-accent/10 transition-colors">
                    <Smartphone size={28} />
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
                        {device.model || device.product || 'Android Device'}
                    </h3>
                    <p className="text-xs text-text-muted font-mono">{device.id}</p>
                </div>

                {/* Status or Remove Button */}
                <div className="flex items-center gap-2">
                    {isOffline && onRemove ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(device.id); }}
                            className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                            title={t.removeDevice}
                        >
                            <Trash2 size={16} />
                        </button>
                    ) : null}

                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor()}`}>
                        <span className="w-2 h-2 rounded-full bg-current"></span>
                        <span>{displayStatus}</span>
                    </div>
                </div>
            </div>

            {/* Checklist if issues */}
            {device.status === 'Unauthorized' && (
                <div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-warning/10 text-warning rounded-lg text-sm">
                        <AlertTriangle size={16} />
                        <span>{t.acceptUsbDebug}</span>
                    </div>
                </div>
            )}

            {device.status === 'Device' && (
                <div>
                    <RequirementChecklist
                        deviceId={device.id}
                        isAuthorized={true}
                        expanded={expandedChecklist === 'requirements'}
                        onToggle={() => setExpandedChecklist(expandedChecklist === 'requirements' ? null : 'requirements')}
                    />
                    <ActionRequirementsChecklist
                        deviceId={device.id}
                        isAuthorized={true}
                        expanded={expandedChecklist === 'actions'}
                        onToggle={() => setExpandedChecklist(expandedChecklist === 'actions' ? null : 'actions')}
                    />
                </div>
            )}

            {/* 6-Button Grid - Refactored to horizontal layout */}
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-3">
                {/* 1. Device Info */}
                <button
                    onClick={() => setActiveAction('info')}
                    className={`${actionBtnBase} ${actionBtnActive}`}
                    disabled={device.status !== 'Device'}
                >
                    <Info size={16} />
                    <span>Info</span>
                </button>

                {/* 2. Uninstall */}
                <button
                    onClick={() => setActiveAction('uninstall')}
                    className={`${actionBtnBase} ${actionBtnActive}`}
                    disabled={device.status !== 'Device'}
                >
                    <Trash2 size={16} />
                    <span>Uninstall</span>
                </button>

                {/* 3. Reboot */}
                <button
                    onClick={() => setActiveAction('reboot')}
                    className={`${actionBtnBase} ${actionBtnActive}`}
                    disabled={device.status !== 'Device'}
                >
                    <Power size={16} />
                    <span>Reboot</span>
                </button>

                {/* 4. Input Text */}
                <button
                    onClick={() => setActiveAction('input')}
                    className={`${actionBtnBase} ${actionBtnActive}`}
                    disabled={device.status !== 'Device'}
                >
                    <Keyboard size={16} />
                    <span>Input</span>
                </button>

                {/* 5. File Transfer */}
                <button
                    onClick={() => setActiveAction('file')}
                    className={`${actionBtnBase} ${actionBtnActive}`}
                    disabled={device.status !== 'Device'}
                >
                    <FileInput size={16} />
                    <span>Files</span>
                </button>

                {/* 6. Install (Special logic) */}
                {apkInfo && !isOffline ? (
                    <InstallButton
                        deviceId={device.id}
                        apkPath={apkInfo.path}
                        customRender={(onClick, loading) => (
                            <button
                                onClick={onClick}
                                disabled={loading || device.status !== 'Device'}
                                // Uses specialized style for Install (Accent filled)
                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 text-xs font-medium h-9
                                    ${loading ? 'bg-surface-elevated text-text-muted border-transparent cursor-wait' : 'bg-accent text-white border-accent shadow-lg shadow-accent/20 hover:bg-accent-secondary hover:border-accent-secondary hover:scale-[1.02]'}
                                `}
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
                                <span>{loading ? t.btnInstalling : t.btnInstall}</span>
                            </button>
                        )}
                    />
                ) : (
                    // Placeholder Disabled Install Button
                    <button
                        disabled
                        className={`${actionBtnBase} ${actionBtnDisabled}`}
                        title={isOffline ? t.deviceOffline : t.selectApkToEnable}
                    >
                        <Package size={16} />
                        <span>{t.btnInstall}</span>
                    </button>
                )}
            </div>

            {/* Modals for Actions */}
            {activeAction === 'info' && (
                <DeviceInfoModal deviceId={device.id} onClose={() => setActiveAction(null)} />
            )}
            {activeAction === 'uninstall' && (
                <UninstallModal deviceId={device.id} onClose={() => setActiveAction(null)} />
            )}
            {activeAction === 'reboot' && (
                <RebootModal deviceId={device.id} onClose={() => setActiveAction(null)} />
            )}
            {activeAction === 'input' && (
                <InputTextModal deviceId={device.id} onClose={() => setActiveAction(null)} />
            )}
            {activeAction === 'file' && (
                <FileTransferModal deviceId={device.id} onClose={() => setActiveAction(null)} />
            )}
        </motion.div>
    );
}
