// StatusBar Component - Shows ADB status and quick actions
import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Circle, CheckCircle2, XCircle } from 'lucide-react';
import type { AdbStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface StatusBarProps {
    adbStatus: AdbStatus | null;
    loading: boolean;
    onRefresh: () => void;
}

export function StatusBar({ adbStatus, loading, onRefresh }: StatusBarProps) {
    const { t } = useLanguage();

    const getStatusIcon = () => {
        if (!adbStatus) return <Circle size={10} className="text-text-muted" />;
        return adbStatus.available
            ? <CheckCircle2 size={14} className="text-success" />
            : <XCircle size={14} className="text-error" />;
    };

    const getStatusColor = () => {
        if (!adbStatus) return 'text-text-muted';
        return adbStatus.available ? 'text-success' : 'text-error';
    };

    const [minSpinning, setMinSpinning] = useState(false);

    const handleRefresh = () => {
        setMinSpinning(true);
        onRefresh();
        setTimeout(() => setMinSpinning(false), 500);
    };

    const isSpinning = loading || minSpinning;

    return (
        <motion.div
            className="flex items-center justify-between px-6 py-3 bg-surface-card/50 border-b border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
        >
            <div className="flex items-center gap-3">
                <span className={`flex items-center gap-2 ${getStatusColor()}`}>
                    {getStatusIcon()}
                </span>
                <span className="text-sm text-text-secondary">
                    {!adbStatus ? 'Checking...' :
                        adbStatus.available
                            ? `ADB ${adbStatus.version?.match(/version\s+(\S+)/i)?.[1] ?? adbStatus.version ?? ''}`
                            : 'ADB Not Found'}
                </span>
            </div>

            <div>
                <button
                    className={`p-2 rounded-lg bg-surface-elevated hover:bg-surface-hover
                               text-text-secondary hover:text-accent
                               transition-all duration-200 disabled:opacity-50`}
                    onClick={handleRefresh}
                    disabled={isSpinning}
                    title={t.refresh}
                >
                    <RefreshCw size={18} className={isSpinning ? 'animate-spin' : ''} />
                </button>
            </div>
        </motion.div>
    );
}
