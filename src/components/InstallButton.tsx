// InstallButton Component - Install APK to device
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { invoke } from '../utils/tauri';
import { toast } from 'sonner';
import type { InstallResult } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface InstallButtonProps {
    deviceId: string;
    apkPath: string;
    disabled?: boolean;
    customRender?: (onClick: () => Promise<void>, loading: boolean) => React.ReactNode;
}

export function InstallButton({ deviceId, apkPath, disabled, customRender }: InstallButtonProps) {
    const [installing, setInstalling] = useState(false);
    const [result, setResult] = useState<'success' | 'error' | null>(null);
    const { t } = useLanguage();

    const handleInstall = async () => {
        setInstalling(true);
        setResult(null);

        try {
            const installResult = await invoke<InstallResult>('install_apk', { deviceId, apkPath });

            if (installResult.success) {
                setResult('success');
                toast.success(t.apkInstalled, { description: installResult.message });
            } else {
                setResult('error');
                toast.error(t.apkInstallFailed, { description: installResult.message });
            }

            setTimeout(() => setResult(null), 3000);
        } catch (error) {
            setResult('error');
            toast.error(t.apkInstallFailed, { description: 'An unexpected error occurred' });
            setTimeout(() => setResult(null), 3000);
        } finally {
            setInstalling(false);
        }
    };

    if (customRender) {
        return <>{customRender(handleInstall, installing)}</>;
    }

    const getIcon = () => {
        if (installing) return <Loader2 size={16} className="animate-spin" />;
        if (result === 'success') return <CheckCircle2 size={16} />;
        if (result === 'error') return <XCircle size={16} />;
        return <Download size={16} />;
    };

    const getLabel = () => {
        if (installing) return t.btnInstalling;
        if (result === 'success') return t.btnInstalled;
        if (result === 'error') return t.btnFailed;
        return t.btnInstall;
    };

    const getBgColor = () => {
        if (result === 'success') return 'bg-success shadow-success/30';
        if (result === 'error') return 'bg-error shadow-error/30';
        return 'bg-gradient-to-br from-accent to-accent-secondary shadow-accent/30';
    };

    return (
        <motion.button
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
                       text-white text-sm font-semibold
                       shadow-lg transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       ${getBgColor()}`}
            onClick={handleInstall}
            disabled={disabled || installing}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {getIcon()}
            <span>{getLabel()}</span>
        </motion.button>
    );
}
