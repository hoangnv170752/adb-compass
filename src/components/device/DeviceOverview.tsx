// Device Overview Tab - Shows device information with live data
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Smartphone, Cpu, HardDrive, Battery, BatteryCharging,
    Wifi, Signal, Monitor, MemoryStick, Building2,
    Shield, Hash, Loader2
} from 'lucide-react';
import { invoke } from '../../utils/tauri';
import { DeviceInfo } from '../../types';
import { listContainer, listItem } from '../../lib/animations';
import { useDeviceCache } from '../../contexts/DeviceCacheContext';
import { useDeviceStatus } from '../../hooks/useDeviceStatus';
import { useLanguage } from '../../contexts/LanguageContext';

interface DeviceOverviewProps {
    device: DeviceInfo;
}

interface DeviceProps {
    model: string;
    android_version: string;
    sdk_version: string;
    battery_level: number | null;
    is_charging: boolean;
    screen_resolution: string | null;
    storage_total: string | null;
    storage_free: string | null;
    ram_total: string | null;
    manufacturer: string | null;
    cpu: string | null;
    build_number: string | null;
    security_patch: string | null;
}

interface InfoCardProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    loading?: boolean;
}

function InfoCard({ icon, label, value, loading }: InfoCardProps) {
    return (
        <motion.div
            variants={listItem}
            className="bg-surface-card border border-border rounded-xl p-4 hover:border-accent/30 transition-colors"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{label}</p>
                    {loading ? (
                        <div className="flex items-center h-5">
                            <Loader2 className="animate-spin text-accent/50" size={14} />
                        </div>
                    ) : (
                        <p className="text-sm font-semibold text-text-primary truncate h-5">
                            {value}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// Helper component for value with secondary text
function ValueWithSub({ main, sub, unknownLabel }: { main: string | null | undefined; sub?: string | null, unknownLabel: string }) {
    if (!main) return <>{unknownLabel}</>;
    return (
        <>
            {main}
            {sub && <span className="text-text-secondary font-normal"> ({sub})</span>}
        </>
    );
}

export function DeviceOverview({ device }: DeviceOverviewProps) {
    const [props, setProps] = useState<DeviceProps | null>(null);
    const [loading, setLoading] = useState(true);
    const { getCached, setData } = useDeviceCache();
    const { getStatusTranslation } = useDeviceStatus();
    const { t } = useLanguage();
    const cacheKey = `device_props_${device.id}`;

    useEffect(() => {
        const loadProps = async () => {
            // 1. Try cache first
            const { data, isStale } = getCached<DeviceProps>(cacheKey);

            if (data) {
                setProps(data);
                if (!isStale) {
                    setLoading(false);
                    return;
                }
            }

            // 2. Fetch fresh data if needed (no data or stale)
            if (!data) setLoading(true);

            try {
                const result = await invoke<DeviceProps>('get_device_props', { deviceId: device.id });
                setProps(result);
                setData(cacheKey, result);
            } catch (e) {
                console.error('Failed to fetch device props:', e);
            } finally {
                setLoading(false);
            }
        };

        loadProps();
    }, [device.id, getCached, setData, cacheKey]);

    const getBatteryIcon = () => {
        if (props?.is_charging) {
            return <BatteryCharging className="text-accent" size={20} />;
        }
        return <Battery className="text-accent" size={20} />;
    };

    return (
        <div className="h-full overflow-hidden">
            <div className="h-full overflow-y-auto custom-scrollbar pr-2">
                <motion.div
                    variants={listContainer}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {/* Row 1: Identity */}
                    <InfoCard
                        icon={<Smartphone className="text-accent" size={20} />}
                        label={t.deviceId}
                        value={device.id}
                    />

                    <InfoCard
                        icon={<Building2 className="text-accent" size={20} />}
                        label={t.manufacturer}
                        value={props?.manufacturer}
                        loading={loading}
                    />

                    <InfoCard
                        icon={<Cpu className="text-accent" size={20} />}
                        label={t.model}
                        value={
                            <ValueWithSub
                                main={props?.model || device.model}
                                sub={props?.android_version ? `Android ${props.android_version}` : null}
                                unknownLabel={t.unknown}
                            />
                        }
                        loading={loading}
                    />

                    {/* Row 2: Hardware */}
                    <InfoCard
                        icon={<Monitor className="text-accent" size={20} />}
                        label={t.screen}
                        value={props?.screen_resolution}
                        loading={loading}
                    />

                    <InfoCard
                        icon={<HardDrive className="text-accent" size={20} />}
                        label={t.storage}
                        value={
                            <ValueWithSub
                                main={props?.storage_total}
                                sub={props?.storage_free ? `${props.storage_free} ${t.free}` : null}
                                unknownLabel={t.unknown}
                            />
                        }
                        loading={loading}
                    />

                    <InfoCard
                        icon={<MemoryStick className="text-accent" size={20} />}
                        label={t.ram}
                        value={props?.ram_total}
                        loading={loading}
                    />

                    {/* Row 3: System */}
                    <InfoCard
                        icon={<Cpu className="text-accent" size={20} />}
                        label={t.chipset}
                        value={props?.cpu}
                        loading={loading}
                    />

                    <InfoCard
                        icon={getBatteryIcon()}
                        label={t.battery}
                        value={
                            <ValueWithSub
                                main={props?.battery_level !== null && props?.battery_level !== undefined
                                    ? `${props.battery_level}%`
                                    : null}
                                sub={props?.is_charging ? t.charging : null}
                                unknownLabel={t.unknown}
                            />
                        }
                        loading={loading}
                    />

                    <InfoCard
                        icon={<Hash className="text-accent" size={20} />}
                        label={t.build}
                        value={props?.build_number}
                        loading={loading}
                    />

                    {/* Row 4: Security & Connection */}
                    <InfoCard
                        icon={<Shield className="text-accent" size={20} />}
                        label={t.securityPatch}
                        value={props?.security_patch}
                        loading={loading}
                    />

                    <InfoCard
                        icon={<Signal className="text-accent" size={20} />}
                        label={t.connection}
                        value={device.id.includes(':') ? t.wireless : t.usb}
                    />

                    <InfoCard
                        icon={<Wifi className="text-accent" size={20} />}
                        label={t.status}
                        value={getStatusTranslation(device.status)}
                    />
                </motion.div>
            </div>
        </div>
    );
}
