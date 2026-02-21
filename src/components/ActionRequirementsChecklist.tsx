// ActionRequirementsChecklist Component - Shows requirements for advanced actions
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronDown, Zap } from 'lucide-react';
import { invoke } from '../utils/tauri';
import type { RequirementCheck } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ActionRequirementsChecklistProps {
    deviceId: string;
    isAuthorized: boolean;
    expanded: boolean;
    onToggle: () => void;
}

export function ActionRequirementsChecklist({ deviceId, isAuthorized, expanded, onToggle }: ActionRequirementsChecklistProps) {
    const [requirements, setRequirements] = useState<RequirementCheck[]>([]);
    const [loading, setLoading] = useState(true); // Start true to prevent flash
    const [hasChecked, setHasChecked] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        if (isAuthorized) {
            checkRequirements();
        }
    }, [deviceId, isAuthorized]);

    const checkRequirements = async () => {
        setLoading(true);
        try {
            const checks = await invoke<RequirementCheck[]>('check_action_requirements', { deviceId });
            setRequirements(checks);
        } catch (error) {
            console.error('Failed to check action requirements:', error);
        } finally {
            setLoading(false);
            setHasChecked(true);
        }
    };

    if (!isAuthorized) return null;

    // Calculate failed count for display
    const failedCount = requirements.filter(r => !r.passed).length;
    const allPassed = hasChecked && failedCount === 0;

    // Helper to translate requirement name
    const getTranslatedReqName = (req: RequirementCheck) => {
        if (req.id === 'usb_debug_security') return t.req_usb_debug_security;
        return req.name; // Fallback
    };

    return (
        <div className="mt-2 relative z-10">
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
                        <Zap size={16} className="text-warning" />
                    )}
                    <span className="text-text-primary">
                        {loading ? t.checking : t.advancedActions}
                    </span>
                    {!loading && failedCount > 0 && (
                        <span className="text-xs text-warning bg-warning/20 px-1.5 py-0.5 rounded">
                            {failedCount} {failedCount === 1 ? t.issue : t.issues}
                        </span>
                    )}
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
