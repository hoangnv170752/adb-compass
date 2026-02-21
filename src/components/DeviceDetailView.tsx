import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Monitor, Smartphone, AppWindow,
    FolderOpen
} from 'lucide-react';
import { invoke } from '../utils/tauri';
import { DeviceInfo, getDeviceStatusText } from '../types';
import { pageTransition, tabContent } from '../lib/animations';
import { DeviceOverview } from './device/DeviceOverview';
import { ScreenCapture } from './device/ScreenCapture';
import { AppManager } from './device/AppManager';
import { FileManager } from './device/FileManager';

// Tab definitions
type TabId = 'overview' | 'screen' | 'apps' | 'files';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

interface DeviceDetailViewProps {
    device: DeviceInfo;
    onBack: () => void;
}

export function DeviceDetailView({ device, onBack }: DeviceDetailViewProps) {
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    // Eagerly initialize service (Agent) as soon as we enter detail view
    useEffect(() => {
        if (device.status === 'Device') {
            console.log(`[DeviceDetailView] Eagerly connecting to agent for ${device.id}...`);
            invoke('test_agent_connection', { deviceId: device.id })
                .then(() => console.log(`[DeviceDetailView] Agent connected for ${device.id}`))
                .catch((err) => console.error(`[DeviceDetailView] Failed to eagerly connect to agent:`, err));
        }
    }, [device.id, device.status]);

    const tabs: Tab[] = [
        { id: 'overview', label: 'Overview', icon: <Smartphone size={18} /> },
        { id: 'screen', label: 'Screen', icon: <Monitor size={18} /> },
        { id: 'apps', label: 'Apps', icon: <AppWindow size={18} /> },
        { id: 'files', label: 'Files', icon: <FolderOpen size={18} /> },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <DeviceOverview device={device} />;
            case 'screen':
                return <ScreenCapture device={device} />;
            case 'apps':
                return <AppManager device={device} />;
            case 'files':
                return <FileManager device={device} />;
            default:
                return null;
        }
    };

    return (
        <motion.div
            className="h-full flex flex-col"
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2.5 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all duration-200 border border-transparent hover:border-border"
                >
                    <ArrowLeft size={22} />
                </button>

                <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent-secondary/20 flex items-center justify-center">
                        <Smartphone className="text-accent" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">
                            {device.model || device.id}
                        </h2>
                        <p className="text-sm text-text-muted">
                            {device.product || 'Android Device'}
                        </p>
                    </div>
                </div>

                {/* Device Status Badge */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${device.status === 'Device'
                    ? 'bg-success/10 border-success/20'
                    : 'bg-warning/10 border-warning/20'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${device.status === 'Device' ? 'bg-success' : 'bg-warning'
                        }`} />
                    <span className="text-sm font-medium">
                        {getDeviceStatusText(device.status)}
                    </span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-surface-elevated rounded-xl border border-border mb-6 overflow-hidden">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                            ? 'text-text-primary'
                            : 'text-text-muted hover:text-text-secondary'
                            }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-surface-card rounded-lg shadow-sm border border-border/50"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{tab.icon}</span>
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                <AnimatePresence>
                    <motion.div
                        key={activeTab}
                        variants={tabContent}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="h-full"
                    >
                        {renderTabContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

