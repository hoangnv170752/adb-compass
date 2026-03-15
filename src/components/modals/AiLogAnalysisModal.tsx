import { useState, type ReactNode } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BrainCircuit, FlaskConical, AlertTriangle, Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { analyzeLogs, getConfiguredProvider, type AiAnalysisResult } from '../../utils/aiService';

interface AiLogAnalysisModalProps {
    logs: string;
    onClose: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
    openai: 'OpenAI GPT-4o mini',
    anthropic: 'Anthropic Claude Haiku',
    gemini: 'Google Gemini 1.5 Flash',
};

function MarkdownContent({ content }: { content: string }) {
    const lines = content.split('\n');
    return (
        <div className="space-y-1 text-sm text-text-primary leading-relaxed">
            {lines.map((line, i) => {
                if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-base font-bold text-text-primary mt-4 mb-1 first:mt-0">{line.slice(3)}</h2>;
                }
                if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-sm font-bold text-accent mt-3 mb-1">{line.slice(4)}</h3>;
                }
                if (line.startsWith('# ')) {
                    return <h1 key={i} className="text-lg font-bold text-text-primary mt-2 mb-2 first:mt-0">{line.slice(2)}</h1>;
                }
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    return (
                        <div key={i} className="flex gap-2 ml-2">
                            <span className="text-accent mt-1.5 text-[8px]">●</span>
                            <span className="text-text-secondary">{formatInline(line.slice(2))}</span>
                        </div>
                    );
                }
                if (/^\d+\. /.test(line)) {
                    const num = line.match(/^(\d+)\. /)?.[1];
                    return (
                        <div key={i} className="flex gap-2 ml-2">
                            <span className="text-accent font-bold text-xs shrink-0 w-4">{num}.</span>
                            <span className="text-text-secondary">{formatInline(line.replace(/^\d+\. /, ''))}</span>
                        </div>
                    );
                }
                if (line.startsWith('```')) {
                    return null;
                }
                if (line.trim() === '') {
                    return <div key={i} className="h-1" />;
                }
                return <p key={i} className="text-text-secondary">{formatInline(line)}</p>;
            })}
        </div>
    );
}

function formatInline(text: string): ReactNode {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="bg-surface-elevated px-1.5 py-0.5 rounded text-[11px] font-mono text-accent">{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="text-text-primary font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={i} className="text-text-secondary italic">{part.slice(1, -1)}</em>;
        }
        return part;
    });
}

export function AiLogAnalysisModal({ logs, onClose }: AiLogAnalysisModalProps) {
    const { t } = useLanguage();
    const [result, setResult] = useState<AiAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [started, setStarted] = useState(false);

    const provider = getConfiguredProvider();

    const runAnalysis = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        setStarted(true);
        try {
            const res = await analyzeLogs(logs);
            setResult(res);
        } catch (err: any) {
            setError(err?.message || 'Analysis failed');
            toast.error('AI analysis failed', { description: err?.message });
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.content);
        setCopied(true);
        toast.success(t.copied);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col bg-surface-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                                <BrainCircuit size={18} className="text-accent" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-text-primary">{t.aiLogAnalysis}</h2>
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 border border-warning/30 text-warning text-[10px] font-bold">
                                        <FlaskConical size={10} />
                                        {t.experimental}
                                    </span>
                                </div>
                                <p className="text-xs text-text-muted">
                                    {provider ? `${t.aiUsingProvider} ${PROVIDER_LABELS[provider]}` : t.aiNoKeyConfigured}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-all"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Experimental Warning */}
                    <div className="mx-5 mt-4 shrink-0">
                        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-warning/8 border border-warning/20">
                            <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
                            <p className="text-[11px] text-warning/90 leading-relaxed">
                                {t.aiExperimentalWarning}
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
                        {!provider ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                                <BrainCircuit size={40} className="text-text-muted/20" />
                                <p className="text-sm font-semibold text-text-primary">{t.aiNoKeyConfigured}</p>
                                <p className="text-xs text-text-muted max-w-xs">{t.aiNoKeyDesc}</p>
                            </div>
                        ) : !started ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                                <BrainCircuit size={40} className="text-accent/30" />
                                <p className="text-sm font-semibold text-text-primary">{t.aiReadyToAnalyze}</p>
                                <p className="text-xs text-text-muted max-w-xs">
                                    {logs.length.toLocaleString()} {t.aiReadyDesc} {PROVIDER_LABELS[provider]} {t.aiReadyDesc2}
                                </p>
                            </div>
                        ) : loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                                >
                                    <BrainCircuit size={32} className="text-accent" />
                                </motion.div>
                                <p className="text-sm text-text-secondary">{t.aiAnalyzing}</p>
                                <p className="text-xs text-text-muted">{t.aiAnalyzingDesc}</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                                <AlertTriangle size={36} className="text-error/50" />
                                <p className="text-sm font-semibold text-error">{t.aiAnalysisFailed}</p>
                                <p className="text-xs text-text-muted max-w-sm break-words">{error}</p>
                            </div>
                        ) : result ? (
                            <MarkdownContent content={result.content} />
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-border shrink-0 bg-surface-elevated/30">
                        <span className="text-[10px] text-text-muted font-medium">
                            {result ? `${t.aiAnalysisBy} ${PROVIDER_LABELS[result.provider]}` : `${logs.length.toLocaleString()} ${t.aiChars}`}
                        </span>
                        <div className="flex items-center gap-2">
                            {result && (
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-xs text-text-secondary hover:text-text-primary transition-all"
                                >
                                    {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                                    {copied ? t.copied : t.copy}
                                </button>
                            )}
                            {provider && (
                                <button
                                    onClick={runAnalysis}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-light transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {loading ? (
                                        <RefreshCw size={12} className="animate-spin" />
                                    ) : (
                                        <BrainCircuit size={12} />
                                    )}
                                    {started && !loading ? t.aiReanalyze : t.aiAnalyze}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
