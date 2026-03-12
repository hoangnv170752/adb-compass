import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Trash2,
  Pause,
  Play,
  Smartphone,
  Download,
  Search,
  X,
  FastForward,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { save } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { Select } from "./ui/Select";
import { useDevices } from "../hooks/useDevices";

interface LogcatViewProps {
  onBack: () => void;
}

type LogLevel = "V" | "D" | "I" | "W" | "E";

interface LogLine {
  id: number;
  text: string;
  level: LogLevel;
}

export function LogcatView({ onBack }: LogcatViewProps) {
  const { devices } = useDevices();
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [paused, setPaused] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [logLevel, setLogLevel] = useState<LogLevel>("V");
  const [searchQuery, setSearchQuery] = useState("");
  const [maxLines, setMaxLines] = useState(1000);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const logCounter = useRef(0);
  const unlistenRef = useRef<UnlistenFn | null>(null);
  const selectedDeviceRef = useRef<string>("");
  const pausedRef = useRef(false);
  const logBufferRef = useRef<LogLine[]>([]);
  const maxLinesRef = useRef(1000);
  const isAtBottomRef = useRef(true);

  // Keep refs in sync
  useEffect(() => {
    maxLinesRef.current = maxLines;
  }, [maxLines]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
  };

  // Keep refs in sync
  useEffect(() => {
    selectedDeviceRef.current = selectedDevice;
  }, [selectedDevice]);

  useEffect(() => {
    pausedRef.current = paused;
    // If unpaused, flush buffer
    if (!paused && logBufferRef.current.length > 0) {
      const buffered = [...logBufferRef.current];
      logBufferRef.current = [];
      setLogLines((prev) => {
        const updated = [...prev, ...buffered];
        return updated.slice(-maxLines);
      });
    }
  }, [paused, maxLines]);

  // Set initial device if not set
  useEffect(() => {
    if (!selectedDevice && devices.length > 0) {
      const firstAuthorized = devices.find((d) => d.status === "Device");
      if (firstAuthorized) setSelectedDevice(firstAuthorized.id);
    }
  }, [devices, selectedDevice]);

  // Streaming logic linked to selectedDevice
  useEffect(() => {
    if (!selectedDevice) return;

    let isMounted = true;
    let currentUnlisten: UnlistenFn | null = null;

        const startStream = async () => {
          const sanitizedId = selectedDevice.replace(/[^a-zA-Z0-9]/g, "_");
          try {
            // 1. Clean up existing stream for THIS device first (just in case)
            await invoke("stop_logcat_stream", { deviceId: selectedDevice });

            if (!isMounted) return;

            // 2. Start listening FIRST to avoid missing early logs
            currentUnlisten = await listen<any>(
              `logcat-line-${sanitizedId}`,
              (event) => {
            if (!isMounted) return;

            const newLines = event.payload.lines.map((text: string) => ({
              id: logCounter.current++,
              text,
              level: parseLogLevel(text),
            }));

            if (pausedRef.current) {
              logBufferRef.current.push(...newLines);
              if (logBufferRef.current.length > 5000) {
                logBufferRef.current = logBufferRef.current.slice(-5000);
              }
            } else {
              setLogLines((prev) => {
                const updated = [...prev, ...newLines];
                return updated.slice(-maxLinesRef.current);
              });
            }
          }
        );

        if (!isMounted) {
          if (currentUnlisten) currentUnlisten();
          return;
        }
        unlistenRef.current = currentUnlisten;

        // 3. Invoke backend to start streaming
        await invoke("start_logcat_stream", { deviceId: selectedDevice });
      } catch (err) {
        if (isMounted) {
          console.error("Streaming error:", err);
          toast.error(`Failed to stream Logcat: ${err}`);
        }
      }
    };

    startStream();

    return () => {
      isMounted = false;
      if (currentUnlisten) {
        currentUnlisten();
        unlistenRef.current = null;
      }
      invoke("stop_logcat_stream", { deviceId: selectedDevice }).catch(
        console.error
      );
    };
  }, [selectedDevice]);

  // Fetch history when level changes or device changes
  useEffect(() => {
    if (!selectedDevice) return;

    const fetchHistory = async () => {
      try {
        const filterStr = logLevel === "V" ? undefined : `*:${logLevel}`;
        const history = await invoke<string>("get_logcat", {
          deviceId: selectedDevice,
          lines: maxLinesRef.current,
          filter: filterStr,
        });

        if (history) {
          const processedLines = history
            .split("\n")
            .filter((l) => l.trim() && !l.includes("--------- beginning of"))
            .map((text) => ({
              id: logCounter.current++,
              text,
              level: parseLogLevel(text),
            }));

          setLogLines(processedLines);
          if (isAtBottomRef.current) {
            logsEndRef.current?.scrollIntoView({ behavior: "auto" });
          }
        }
      } catch (err) {
        console.error("Failed to fetch log history:", err);
      }
    };

    fetchHistory();
  }, [selectedDevice, logLevel]);

  const parseLogLevel = (line: string): LogLevel => {
    // Matches " E ", "/E ", " E/", or "[E]" patterns in logcat output
    const match = line.match(/\s([VDIWE])\s|([VDIWE])\/|\[([VDIWE])\]/);
    if (match) {
      return (match[1] || match[2] || match[3]) as LogLevel;
    }
    return "V";
  };

  const getLogLevelPriority = (level: LogLevel): number => {
    const priorities: Record<LogLevel, number> = {
      V: 0,
      D: 1,
      I: 2,
      W: 3,
      E: 4,
    };
    return priorities[level];
  };

  const filteredLogs = useMemo(() => {
    const minPriority = getLogLevelPriority(logLevel);
    return logLines.filter((line) => {
      const matchesLevel = getLogLevelPriority(line.level) >= minPriority;
      const matchesSearch =
        searchQuery.trim() === "" ||
        line.text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [logLines, logLevel, searchQuery]);

  useEffect(() => {
    if (!paused && isAtBottomRef.current && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [filteredLogs, paused]);

  const handleClear = async () => {
    if (!selectedDevice) return;
    try {
      await invoke("clear_logcat", { deviceId: selectedDevice });
      setLogLines([]);
      logBufferRef.current = [];
      toast.success("Logcat buffer cleared");
    } catch (err) {
      toast.error(String(err));
    }
  };

  const handleExport = async () => {
    try {
      const content = filteredLogs.map((l) => l.text).join("\n");
      const path = await save({
        filters: [{ name: "Log", extensions: ["log", "txt"] }],
        defaultPath: `logcat_${selectedDevice}_${new Date().getTime()}.log`,
      });

      if (path) {
        await invoke("save_capture_file", {
          path,
          content: btoa(unescape(encodeURIComponent(content))),
        });
        toast.success("Logs exported successfully");
      }
    } catch (err) {
      toast.error("Failed to export logs");
    }
  };

  const getLogColor = (level: LogLevel) => {
    switch (level) {
      case "E":
        return "text-error";
      case "W":
        return "text-warning";
      case "I":
        return "text-accent";
      case "D":
        return "text-text-secondary";
      default:
        return "text-text-muted";
    }
  };

  const logLevels: { value: LogLevel; label: string; color: string }[] = [
    { value: "V", label: "Verbose", color: "text-text-muted" },
    { value: "D", label: "Debug", color: "text-text-secondary" },
    { value: "I", label: "Info", color: "text-accent" },
    { value: "W", label: "Warning", color: "text-warning" },
    { value: "E", label: "Error", color: "text-error" },
  ];

  const deviceOptions = devices.map((d) => ({
    value: d.id,
    label: `${d.model || d.id}${d.status !== "Device" ? ` (${d.status})` : ""}`,
    icon: (
      <Smartphone
        size={14}
        className={d.status === "Device" ? "text-accent" : "text-text-muted"}
      />
    ),
    disabled: d.status !== "Device",
  }));

  const limitOptions = [
    { value: "500", label: "500 lines" },
    { value: "1000", label: "1000 lines" },
    { value: "2000", label: "2000 lines" },
    { value: "5000", label: "5000 lines" },
  ];

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all duration-200 border border-transparent hover:border-border"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <FileText className="text-accent" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              Logcat Viewer
            </h2>
            <div className="flex items-center gap-2">
              <span
                className={`flex h-1.5 w-1.5 rounded-full ${
                  !paused && selectedDevice
                    ? "bg-success animate-pulse"
                    : "bg-text-muted"
                }`}
              />
              <p className="text-xs text-text-muted">
                {!paused && selectedDevice ? "Live Streaming" : "Paused"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaused(!paused)}
            disabled={!selectedDevice}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm font-medium ${
              paused
                ? "bg-accent text-white border-accent"
                : "bg-surface-elevated border-border text-text-secondary hover:text-text-primary"
            } disabled:opacity-50`}
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
            {paused ? "Resume" : "Pause"}
          </button>

          <button
            onClick={handleExport}
            disabled={logLines.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-text-secondary hover:text-text-primary transition-all text-sm font-medium disabled:opacity-50"
          >
            <Download size={14} />
            Export
          </button>

          <button
            onClick={handleClear}
            disabled={!selectedDevice}
            className="p-2 rounded-lg bg-surface-elevated border border-border text-text-secondary hover:text-error transition-all disabled:opacity-50"
            title="Clear device buffer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-surface-elevated border border-border rounded-xl p-3 mb-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-56">
            <Select
              options={deviceOptions}
              value={selectedDevice}
              onChange={(val) => {
                setSelectedDevice(val);
                setLogLines([]);
                logBufferRef.current = [];
                logCounter.current = 0;
              }}
              placeholder="Select device..."
            />
          </div>

          <div className="flex-1 relative group">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="w-full bg-surface-card border border-border rounded-lg pl-9 pr-9 py-2 text-sm focus:outline-none focus:border-accent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="w-36">
            <Select
              options={limitOptions}
              value={String(maxLines)}
              onChange={(val) => setMaxLines(Number(val))}
              placeholder="Buffer limit"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-2">
            Minimum Level:
          </span>
          {logLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => setLogLevel(level.value)}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                logLevel === level.value
                  ? "bg-accent text-white shadow-sm"
                  : `bg-surface-card ${level.color} border border-border/50 hover:bg-surface-card-hover`
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Content Container */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Logs Content */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-auto font-mono text-[11px] bg-[#0c0c0c] border border-border rounded-xl p-4 custom-scrollbar selection:bg-accent/30"
        >
        {selectedDevice ? (
          filteredLogs.length > 0 ? (
            <div className="space-y-0.5">
              {filteredLogs.map((line) => (
                <div
                  key={line.id}
                  className={`${getLogColor(
                    line.level
                  )} hover:bg-white/5 px-1 rounded transition-colors group flex gap-3`}
                >
                  <span className="opacity-20 select-none w-8 text-right shrink-0">
                    {line.id}
                  </span>
                  <span className="whitespace-pre-wrap break-all">
                    {line.text}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-text-muted gap-2">
              {!paused ? (
                <>
                  <Loader size={24} className="animate-spin opacity-20" />
                  <p className="text-sm">Waiting for logs...</p>
                </>
              ) : (
                <p className="text-sm">Stream paused</p>
              )}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-muted gap-2">
            <FileText size={48} className="opacity-10" />
            <p className="text-sm">Select a device to start streaming</p>
          </div>
        )}
          <div ref={logsEndRef} />
        </div>

        {/* Floating Scroll to Bottom Button */}
        <AnimatePresence>
          {!isAtBottom && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              onClick={() => {
                isAtBottomRef.current = true;
                setIsAtBottom(true);
                logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="absolute bottom-6 right-8 bg-accent text-white px-4 py-2 rounded-full shadow-lg hover:bg-accent-secondary transition-all flex items-center gap-2 text-xs font-bold z-20 border border-white/10"
            >
              <FastForward size={14} className="rotate-90" />
              New Logs
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-2 px-2 flex justify-between items-center text-[10px] text-text-muted font-medium">
        <div className="flex items-center gap-4">
          <span>
            Showing {filteredLogs.length} of {logLines.length} lines
          </span>
          {paused && (
            <span className="text-warning flex items-center gap-1">
              <Pause size={8} /> Stream Paused
            </span>
          )}
        </div>
        <span>DeviceHub v1.0.1</span>
      </div>
    </motion.div>
  );
}

const Loader = ({ size, className }: { size: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
