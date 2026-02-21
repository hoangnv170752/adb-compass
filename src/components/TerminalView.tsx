import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Terminal, Loader2, Trash2, Smartphone, Command, ChevronRight, Sparkles } from 'lucide-react';
import { invoke } from '../utils/tauri';
import { useDevices } from '../hooks/useDevices';
import { Select } from './ui/Select';
import { QuickActionMenu } from './device/QuickActionMenu';

interface TerminalViewProps {
    onBack: () => void;
}

interface CommandHistory {
    command: string;
    output: string;
    isError?: boolean;
}

const COMMON_COMMANDS = [
    { label: 'List Packages', cmd: 'pm list packages' },
    { label: 'Battery Stats', cmd: 'dumpsys battery' },
    { label: 'Memory Info', cmd: 'cat /proc/meminfo' },
    { label: 'Screen Cap', cmd: 'screencap -p /sdcard/screen.png' },
    { label: 'Process List', cmd: 'top -n 1' },
    { label: 'IP Address', cmd: 'ip addr show wlan0' },
    { label: 'Clear Logcat', cmd: 'logcat -c' },
    { label: 'Install APK', cmd: 'install ' },
    { label: 'Uninstall Package', cmd: 'uninstall ' },
    { label: 'Device Properties', cmd: 'getprop' },
    { label: 'Activity Stack', cmd: 'dumpsys activity activities' },
    { label: 'CPU Info', cmd: 'cat /proc/cpuinfo' },
];

export function TerminalView({ onBack }: TerminalViewProps) {
    const { devices, loading: devicesLoading } = useDevices();
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState<CommandHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<string>('');
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // Suggestion states
    const [suggestions, setSuggestions] = useState<typeof COMMON_COMMANDS>([]);
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const outputRef = useRef<HTMLDivElement>(null);
    const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Auto-scroll logic for suggestions
    useEffect(() => {
        if (showSuggestions && suggestionRefs.current[suggestionIndex]) {
            suggestionRefs.current[suggestionIndex]?.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [suggestionIndex, showSuggestions]);

    // Set initial device if not set
    useEffect(() => {
        if (!selectedDevice && devices.length > 0) {
            const firstAuthorized = devices.find(d => d.status === 'Device');
            if (firstAuthorized) setSelectedDevice(firstAuthorized.id);
        }
    }, [devices, selectedDevice]);

    useEffect(() => {
        outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' });
    }, [history]);

    const executeCommand = async (cmdToRun?: string) => {
        const cmd = (cmdToRun || command).trim();
        if (!cmd || !selectedDevice) return;

        setLoading(true);
        setCommand('');
        setHistoryIndex(-1);
        setShowSuggestions(false);

        try {
            const output = await invoke<string>('execute_shell', {
                deviceId: selectedDevice,
                command: cmd,
            });
            setHistory((prev) => [...prev, { command: cmd, output }]);
        } catch (err) {
            setHistory((prev) => [...prev, { command: cmd, output: String(err), isError: true }]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    // Filter suggestions
    useEffect(() => {
        if (command.trim() && !loading) {
            const filtered = COMMON_COMMANDS.filter(c =>
                c.cmd.toLowerCase().includes(command.toLowerCase()) ||
                c.label.toLowerCase().includes(command.toLowerCase())
            );
            setSuggestions(filtered);
            setSuggestionIndex(0);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [command, loading]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSuggestionIndex(prev => (prev + 1) % suggestions.length);
                return;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
                return;
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                const selected = suggestions[suggestionIndex].cmd;
                setCommand(selected);
                setShowSuggestions(false);
                return;
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            executeCommand();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const commands = history.map((h) => h.command);
            if (commands.length > 0) {
                const newIndex = historyIndex < commands.length - 1 ? historyIndex + 1 : historyIndex;
                setHistoryIndex(newIndex);
                setCommand(commands[commands.length - 1 - newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const commands = history.map((h) => h.command);
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setCommand(commands[commands.length - 1 - newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setCommand('');
            }
        }
    };

    const clearHistory = () => {
        setHistory([]);
    };

    // Prepare options for Select component
    const deviceOptions = devices.map((d) => ({
        value: d.id,
        label: `${d.model || d.id}${d.status !== 'Device' ? ` (${d.status})` : ''}`,
        icon: <Smartphone size={14} className={d.status === 'Device' ? 'text-accent' : 'text-text-muted'} />,
        disabled: d.status !== 'Device'
    }));

    return (
        <motion.div
            className="flex flex-col h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={onBack}
                    className="p-2.5 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all duration-200 border border-transparent hover:border-border"
                >
                    <ArrowLeft size={22} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Terminal className="text-accent" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">Shell Terminal</h2>
                        <p className="text-sm text-text-muted">Execute ADB shell commands</p>
                    </div>
                </div>
            </div>

            {/* Controls - Device Selector and Clear Button */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-64">
                    <Select
                        options={deviceOptions}
                        value={selectedDevice}
                        onChange={setSelectedDevice}
                        placeholder="Select device..."
                    />
                </div>

                <div className="flex-1" />

                {selectedDevice && (
                    <QuickActionMenu deviceId={selectedDevice} />
                )}

                <button
                    onClick={clearHistory}
                    className="p-2 rounded-lg bg-surface-elevated border border-border text-text-secondary hover:text-error transition-all"
                    title="Clear history"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {/* Output Area */}
            <div
                ref={outputRef}
                className="flex-1 overflow-auto font-mono text-sm bg-surface-card border border-border rounded-xl p-4 space-y-3 custom-scrollbar"
            >
                {history.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-text-muted">
                        {devicesLoading ? 'Loading devices...' : 'Enter a command to get started'}
                    </div>
                ) : (
                    history.map((item, i) => (
                        <div key={i} className="space-y-1">
                            <div className="flex items-center gap-2 text-accent">
                                <span className="text-text-muted">$</span>
                                <span>{item.command}</span>
                            </div>
                            <pre
                                className={`whitespace-pre-wrap text-xs pl-4 ${item.isError ? 'text-error' : 'text-text-secondary'
                                    }`}
                            >
                                {item.output || '(no output)'}
                            </pre>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="mt-4 relative">
                {/* Suggestions Overlay */}
                <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-0 mb-2 w-[450px] bg-surface-card border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden"
                        >
                            <div className="p-2 border-b border-border bg-surface-elevated/50 text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                <Sparkles size={10} className="text-accent" />
                                Smart Suggestions
                            </div>
                            <div className="p-1 max-h-48 overflow-y-auto custom-scrollbar">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        ref={el => { suggestionRefs.current[i] = el; }}
                                        onClick={() => {
                                            setCommand(s.cmd);
                                            setShowSuggestions(false);
                                            inputRef.current?.focus();
                                        }}
                                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-all group ${i === suggestionIndex ? 'bg-accent text-white' : 'hover:bg-surface-elevated text-text-secondary hover:text-text-primary'}`}
                                    >
                                        <div className="flex flex-col items-start px-1">
                                            <span className="text-[10px] opacity-70 font-medium mb-0.5">{s.label}</span>
                                            <span className="text-xs font-mono">{s.cmd}</span>
                                        </div>
                                        <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-all ${i === suggestionIndex ? 'text-white' : 'text-text-muted'}`} />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-3 bg-surface-card border border-border rounded-xl px-4 py-3 shadow-inner group focus-within:border-accent transition-all">
                    <Terminal size={18} className="text-accent group-focus-within:scale-110 transition-transform" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={selectedDevice ? 'Enter command...' : 'Select a device first'}
                        disabled={!selectedDevice || loading}
                        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none font-mono"
                        autoFocus
                    />
                    {loading && <Loader2 size={16} className="animate-spin text-accent" />}
                </div>
                <p className="text-xs text-text-muted mt-2 ml-1 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Command size={10} /> Enter to execute</span>
                    <span className="flex items-center gap-1"><ChevronRight size={10} className="rotate-270" /> Arrow keys for history & suggestions</span>
                </p>
            </div>
        </motion.div>
    );
}
