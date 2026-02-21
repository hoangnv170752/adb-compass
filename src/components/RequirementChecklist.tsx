// RequirementChecklist Component - Shows device requirement status
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronDown, Info } from 'lucide-react';
import { invoke } from '../utils/tauri';
import type { RequirementCheck } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface RequirementChecklistProps {
    deviceId: string;
    isAuthorized: boolean;
    expanded: boolean;
    onToggle: () => void;
}

export function RequirementChecklist({ deviceId, isAuthorized, expanded, onToggle }: RequirementChecklistProps) {
    const [requirements, setRequirements] = useState<RequirementCheck[]>([]);
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        if (isAuthorized) {
            checkRequirements();
        }
    }, [deviceId, isAuthorized]);

    const checkRequirements = async () => {
        setLoading(true);
        try {
            const checks = await invoke<RequirementCheck[]>('check_device_requirements', { deviceId });
            setRequirements(checks);
        } catch (error) {
            console.error('Failed to check requirements:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthorized) return null;

    const allPassed = requirements.every(r => r.passed);
    const failedCount = requirements.filter(r => !r.passed).length;

    // Pluralization logic for "issue/issues"
    const issueText = failedCount === 1 ? t.issue : t.issues;

    // Helper to translate requirement name based on ID
    // We assume backend returns specific IDs like 'developer_options', 'usb_debugging'
    // If not, we fall back to the name from backend.
    const getTranslatedReqName = (req: RequirementCheck) => {
        // Map backend IDs to translation keys
        // IDs must match src-tauri/src/adb/executor.rs
        if (req.id === 'developer_options') return t.req_developer_options;
        if (req.id === 'usb_debugging') return t.req_usb_debugging;
        if (req.id === 'unknown_sources') return t.req_unknown_sources;
        if (req.id === 'device_authorization') return t.req_auth;

        return req.name; // Fallback
    };

    return (
        <div className="mt-4 pt-4 pb-1 border-t border-border relative z-20">
            <button
                className={`flex items-center justify-between w-full px-3 py-2 
                           ${allPassed
                        ? 'bg-success/10 border border-success/30 hover:border-success/50'
                        : 'bg-warning/10 border border-warning/30 hover:border-warning/50'}
                           rounded-lg text-sm transition-all duration-200
                           ${expanded ? (allPassed ? 'border-success ring-1 ring-success/20' : 'border-warning ring-1 ring-warning/20') : ''}`}
                onClick={onToggle}
            >
                <div className="flex items-center gap-2">
                    {allPassed ? (
                        <CheckCircle2 size={16} className="text-success" />
                    ) : (
                        <Info size={16} className="text-warning" />
                    )}
                    <span className="text-text-primary">
                        {loading ? t.checking :
                            allPassed ? t.readyToInstall :
                                `${failedCount} ${issueText} found`}
                    </span>
                </div>
                <div className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={16} className="text-text-muted" />
                </div>
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        className="absolute left-0 right-0 top-full mt-1 bg-surface-card border border-border rounded-lg shadow-2xl overflow-hidden z-[100] py-1"
                        initial={{ opacity: 0, y: -5, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                    >
                        {requirements.map((req) => (
                            <div
                                key={req.id}
                                className="px-3 py-2 border-b border-border last:border-0 bg-surface-card hover:bg-surface-elevated"
                            >
                                <div className="flex items-start gap-2">
                                    {req.passed ? (
                                        <CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" />
                                    ) : (
                                        <XCircle size={14} className="text-error mt-0.5 shrink-0" />
                                    )}
                                    <div>
                                        <div className="text-sm text-text-primary">{getTranslatedReqName(req)}</div>
                                        {!req.passed && req.hint && (
                                            <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{req.hint}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
