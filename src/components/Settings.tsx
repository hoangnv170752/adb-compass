// Settings Component
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Moon, Sun, Monitor, FolderOpen, Globe,
    FileText, Settings as SettingsIcon, RotateCcw, Github
} from 'lucide-react';
import { toast } from 'sonner';
import { open as openDialog, confirm } from '@tauri-apps/plugin-dialog';
import { openUrl } from '@tauri-apps/plugin-opener';
import { invoke } from '../utils/tauri';
import { Select } from './ui/Select';
import { check } from '@tauri-apps/plugin-updater';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsProps {
    onBack: () => void;
}

type ThemeMode = 'light' | 'dark' | 'system';

export function Settings({ onBack }: SettingsProps) {
    const [notifications, setNotifications] = useState(true);
    const [adbPath, setAdbPath] = useState('');
    const [captureSavePath, setCaptureSavePath] = useState('');
    const [askBeforeSave, setAskBeforeSave] = useState(false);

    const { language, setLanguage, t } = useLanguage();
    const { theme, setTheme } = useTheme();

    const loadSettings = () => {
        const storedNotif = localStorage.getItem('notifications');
        const storedAdbPath = localStorage.getItem('adbPath');
        const storedCapturePath = localStorage.getItem('captureSavePath');
        const storedAskBeforeSave = localStorage.getItem('askBeforeSave');

        if (storedNotif) setNotifications(storedNotif === 'true');
        else setNotifications(true);

        if (storedAdbPath) setAdbPath(storedAdbPath);
        else setAdbPath('');

        if (storedAskBeforeSave) setAskBeforeSave(storedAskBeforeSave === 'true');
        else setAskBeforeSave(false);

        if (storedCapturePath) {
            setCaptureSavePath(storedCapturePath);
        } else {
            invoke<string>('get_default_media_dir').then(path => {
                setCaptureSavePath(path);
                localStorage.setItem('captureSavePath', path);
            }).catch(console.error);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const languages = [
        { value: 'en', label: 'English', icon: <span className="text-xs">🇺🇸</span> },
        { value: 'vi', label: 'Tiếng Việt', icon: <span className="text-xs">🇻🇳</span> },
    ];

    const themes: { value: ThemeMode; icon: React.ReactNode; label: string }[] = [
        { value: 'light', icon: <Sun size={16} />, label: t.light },
        { value: 'dark', icon: <Moon size={16} />, label: t.dark },
        { value: 'system', icon: <Monitor size={16} />, label: t.system },
    ];

    const handleLanguageChange = (val: string) => {
        setLanguage(val as any);
    };

    const handleThemeChange = (val: ThemeMode) => {
        setTheme(val);
    };

    const handleNotificationToggle = () => {
        const newState = !notifications;
        setNotifications(newState);
        localStorage.setItem('notifications', String(newState));
        toast.success(`Notifications ${newState ? 'Enabled' : 'Disabled'}`);
    };

    const handleBrowseAdb = async () => {
        toast.info("Browser unavailable in debug mode");
    };

    const handleBrowseCapturePath = async () => {
        try {
            const selected = await openDialog({
                directory: true,
                multiple: false,
                title: 'Select Capture Save Location',
            });

            if (selected && typeof selected === 'string') {
                setCaptureSavePath(selected);
                localStorage.setItem('captureSavePath', selected);
                toast.success('Capture save path updated');
            }
        } catch (err) {
            console.error('Failed to browse', err);
            toast.info("Browser feature not available");
        }
    };

    const handleAskBeforeSaveToggle = () => {
        const newState = !askBeforeSave;
        setAskBeforeSave(newState);
        localStorage.setItem('askBeforeSave', String(newState));
        toast.success(`Ask before save ${newState ? 'Enabled' : 'Disabled'}`);
    };

    const handleResetDefaults = async () => {
        const confirmed = await confirm(t.resetConfirm, {
            title: t.resetToDefaults,
            kind: 'warning',
        });

        if (confirmed) {
            localStorage.clear();
            setTheme('system');
            setLanguage('en');
            loadSettings();
            toast.success(t.resetSuccess);
        }
    };

    const handleViewLogs = async () => {
        toast.info("Logs unavailable in debug mode");
    };

    const handleCheckUpdates = async () => {
        try {
            const update = await check();
            if (update) {
                const confirmed = await confirm(
                    `New version ${update.version} is available! Would you like to update?`,
                    { title: 'Update Available', kind: 'info' }
                );
                if (confirmed) {
                    toast.info('Downloading update...');
                    await update.downloadAndInstall();
                    toast.success('Update installed! Please restart the app.');
                }
            } else {
                toast.success(t.latestVersion || 'You are on the latest version!');
            }
        } catch (err) {
            console.error('Failed to check for updates', err);
            toast.error('Failed to check for updates. Make sure you have an internet connection.');
        }
    };


    return (
        <motion.div
            className="flex flex-col h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-4 shrink-0 px-1">
                <button
                    onClick={onBack}
                    className="p-2.5 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all duration-200 border border-transparent hover:border-border"
                >
                    <ArrowLeft size={22} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <SettingsIcon className="text-accent" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-primary leading-tight">{t.settings}</h2>
                        <p className="text-xs text-text-muted">{t.managePrefs}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-8 space-y-6 px-1">
                {/* Appearance Section */}
                <section className="bg-surface-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-5 flex items-center gap-2">
                        <Monitor size={16} className="text-accent" />
                        {t.appearance}
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-text-primary">{t.appTheme}</p>
                            <p className="text-xs text-text-secondary mt-0.5">{t.selectTheme}</p>
                        </div>
                        <div className="flex bg-surface-elevated rounded-xl p-1 border border-border/50 relative isolate">
                            {themes.map((tItem) => (
                                <button
                                    key={tItem.value}
                                    onClick={() => handleThemeChange(tItem.value)}
                                    className={`relative px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center ${theme === tItem.value ? 'text-text-primary font-medium' : 'text-text-muted hover:text-text-primary'}`}
                                    title={tItem.label}
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {tItem.icon}
                                    </span>
                                    {theme === tItem.value && (
                                        <motion.div
                                            layoutId="activeTheme"
                                            className="absolute inset-0 bg-surface-card rounded-lg shadow-sm border border-border/10 z-0"
                                            transition={{ type: "spring", stiffness: 350, damping: 35 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* General Settings */}
                <section className="bg-surface-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-5 flex items-center gap-2">
                        <Globe size={16} className="text-accent" />
                        {t.general}
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-text-primary">{t.language}</p>
                                <p className="text-xs text-text-secondary mt-0.5">{t.changeLang}</p>
                            </div>
                            <div className="w-44">
                                <Select
                                    options={languages}
                                    value={language}
                                    onChange={handleLanguageChange}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-border/50">
                            <div>
                                <p className="text-sm font-semibold text-text-primary">{t.notifications}</p>
                                <p className="text-xs text-text-secondary mt-0.5">{t.showNotif}</p>
                            </div>
                            <div className="flex items-center">
                                <button
                                    onClick={handleNotificationToggle}
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none flex items-center ${notifications ? 'bg-accent border border-accent' : 'bg-surface-elevated border border-border'}`}
                                >
                                    <motion.div
                                        className="w-4 h-4 bg-white rounded-full shadow-sm ml-1"
                                        animate={{ x: notifications ? 18 : 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Path Configuration */}
                <section className="bg-surface-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-5 flex items-center gap-2">
                        <FolderOpen size={16} className="text-accent" />
                        Path Configuration
                    </h3>
                    <div className="space-y-6">
                        {/* ADB Path */}
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-2">{t.customPath}</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={t.bundledAdb}
                                    value={adbPath}
                                    className="flex-1 bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-muted/50"
                                    readOnly
                                />
                                <button
                                    onClick={handleBrowseAdb}
                                    className="px-5 py-2.5 bg-surface-elevated border border-border rounded-xl text-text-secondary hover:text-text-primary hover:border-text-secondary transition-all hover:bg-surface-hover font-medium text-sm"
                                >
                                    {t.browse}
                                </button>
                            </div>
                            <p className="text-[11px] text-text-muted mt-2 ml-1">{t.leaveEmpty}</p>
                        </div>

                        {/* Capture Save Path */}
                        <div className="pt-5 border-t border-border/50">
                            <label className="block text-sm font-semibold text-text-primary mb-2">
                                Capture Save Path
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="~/Pictures/DeviceHub"
                                    value={captureSavePath}
                                    className="flex-1 bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-muted/50"
                                    readOnly
                                />
                                <button
                                    onClick={handleBrowseCapturePath}
                                    className="px-5 py-2.5 bg-accent text-white font-medium rounded-xl hover:bg-accent-light transition-all shadow-sm active:scale-95 text-sm"
                                >
                                    {t.browse}
                                </button>
                            </div>
                            <p className="text-[11px] text-text-muted mt-2 ml-1">{t.defaultSavePath}</p>
                        </div>

                        {/* Ask Before Save Toggle */}
                        <div className="pt-5 border-t border-border/50 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-text-primary">{t.askBeforeSave}</p>
                                <p className="text-xs text-text-secondary mt-0.5">{t.askBeforeSaveDesc}</p>
                            </div>
                            <div className="flex items-center">
                                <button
                                    onClick={handleAskBeforeSaveToggle}
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none flex items-center ${askBeforeSave ? 'bg-accent border border-accent' : 'bg-surface-elevated border border-border'}`}
                                >
                                    <motion.div
                                        className="w-4 h-4 bg-white rounded-full shadow-sm ml-1"
                                        animate={{ x: askBeforeSave ? 18 : 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* About Section - Simplified */}
                <section className="bg-surface-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <img src="/icon.png" alt="DeviceHub" className="w-8 h-8 rounded-lg shadow-sm" />
                                <h2 className="text-xl font-bold text-text-primary">DeviceHub</h2>
                                <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                                    v{t.version.split(':')[1].trim()}
                                </span>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed mb-4">
                                {t.aboutDesc}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => openUrl('https://github.com/h1dr0nn/adb-compass')}
                                    className="text-xs font-medium text-text-secondary hover:text-accent transition-colors bg-surface-elevated px-3 py-1.5 rounded-lg border border-border/50 flex items-center gap-2"
                                >
                                    <Github size={14} />
                                    GitHub
                                </button>
                                <button
                                    onClick={() => openUrl('https://github.com/h1dr0nn')}
                                    className="text-xs font-medium text-text-secondary hover:text-accent transition-colors bg-surface-elevated px-3 py-1.5 rounded-lg border border-border/50 flex items-center gap-2"
                                >
                                    <Globe size={14} />
                                    {t.officialWebsite}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border/50 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                            <span className="text-text-muted">{t.developedBy}</span>
                            <button
                                onClick={() => openUrl('https://github.com/h1dr0nn')}
                                className="font-bold hover:text-accent transition-colors"
                            >
                                h1dr0n
                            </button>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleResetDefaults}
                                className="text-[11px] font-bold text-error/60 hover:text-error transition-colors flex items-center gap-1"
                            >
                                <RotateCcw size={12} />
                                {t.resetToDefaults}
                            </button>
                            <span className="text-text-muted/20">|</span>
                            <button
                                onClick={handleCheckUpdates}
                                className="text-[11px] font-bold text-accent/60 hover:text-accent transition-colors"
                            >
                                {t.checkUpdates}
                            </button>
                        </div>
                    </div>
                </section>

                <div className="flex justify-center pb-4">
                    <button
                        onClick={handleViewLogs}
                        className="flex items-center gap-2 text-[10px] font-bold text-text-muted hover:text-text-secondary transition-colors"
                    >
                        <FileText size={12} />
                        {t.viewLogs}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
