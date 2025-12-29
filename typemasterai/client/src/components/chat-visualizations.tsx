import { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import { Loader2, Download, Maximize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";

// Initialize mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'inherit',
});

interface MermaidProps {
    chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
    const [svg, setSvg] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isZoomed, setIsZoomed] = useState(false);

    useEffect(() => {
        const renderChart = async () => {
            try {
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
                setError(null);
            } catch (err) {
                console.error("Mermaid render error:", err);
                setError("Failed to render diagram");
                // Mermaid keeps error text in the DOM, so needed to clean up? 
                // usually mermaid.render handles it but sometimes it throws.
            }
        };

        if (chart) {
            renderChart();
        }
    }, [chart]);

    if (error) {
        return (
            <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-lg text-red-400 text-sm font-mono">
                {error}
                <pre className="mt-2 text-xs opacity-50 whitespace-pre-wrap">{chart}</pre>
            </div>
        );
    }

    if (!svg) {
        return (
            <div className="flex items-center justify-center p-8 border border-zinc-800 rounded-lg bg-zinc-900/50">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="relative group my-4">
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8 bg-zinc-800/80 hover:bg-zinc-700 backdrop-blur-sm">
                            <Maximize2 className="w-4 h-4 text-zinc-300" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-zinc-950 border-zinc-800 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-[url('/grid.svg')] bg-center">
                            <div
                                className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
                                dangerouslySetInnerHTML={{ __html: svg }}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div
                className="p-6 overflow-x-auto bg-zinc-900/50 border border-zinc-800 rounded-lg flex justify-center [&>svg]:max-w-full"
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        </div>
    );
}

interface ChartData {
    type: "bar" | "line" | "area" | "pie";
    title?: string;
    data: any[];
    xKey: string;
    series: Array<{
        key: string;
        name?: string;
        color?: string;
        stack?: string; // For stacked bars
    }>;
}

const COLORS = ["#00ffff", "#a855f7", "#ec4899", "#ef4444", "#eab308", "#22c55e"];

export function ChartRenderer({ configStr }: { configStr: string }) {
    const [config, setConfig] = useState<ChartData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const parsed = JSON.parse(configStr);
            setConfig(parsed);
            setError(null);
        } catch (e) {
            setError("Invalid chart configuration");
        }
    }, [configStr]);

    if (error) {
        return (
            <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-lg text-red-400 text-sm">
                {error}
            </div>
        );
    }

    if (!config) return null;

    const renderChart = () => {
        const commonProps = {
            data: config.data,
            margin: { top: 10, right: 30, left: 0, bottom: 0 },
        };

        switch (config.type) {
            case "bar":
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey={config.xKey} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Legend />
                        {config.series.map((s, i) => (
                            <Bar
                                key={s.key}
                                dataKey={s.key}
                                name={s.name || s.key}
                                fill={s.color || COLORS[i % COLORS.length]}
                                radius={[4, 4, 0, 0]}
                                stackId={s.stack}
                            />
                        ))}
                    </BarChart>
                );
            case "line":
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey={config.xKey} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        {config.series.map((s, i) => (
                            <Line
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.name || s.key}
                                stroke={s.color || COLORS[i % COLORS.length]}
                                strokeWidth={2}
                                dot={{ fill: '#18181b', strokeWidth: 2 }}
                                activeDot={{ r: 6, opacity: 1 }}
                            />
                        ))}
                    </LineChart>
                );
            case "area":
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            {config.series.map((s, i) => (
                                <linearGradient key={s.key} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={s.color || COLORS[i % COLORS.length]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={s.color || COLORS[i % COLORS.length]} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey={config.xKey} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        {config.series.map((s, i) => (
                            <Area
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.name || s.key}
                                stroke={s.color || COLORS[i % COLORS.length]}
                                fill={`url(#gradient-${s.key})`}
                                strokeWidth={2}
                            />
                        ))}
                    </AreaChart>
                );
            case "pie":
                return (
                    <PieChart>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        <Pie
                            data={config.data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey={config.series[0].key}
                            nameKey={config.xKey}
                        >
                            {config.data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                            ))}
                        </Pie>
                    </PieChart>
                );
            default:
                return <div>Unsupported chart type</div>;
        }
    };

    return (
        <div className="my-6 border border-zinc-800 rounded-xl bg-zinc-900/30 overflow-hidden">
            {config.title && (
                <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                    <h3 className="font-medium text-sm text-zinc-200">{config.title}</h3>
                </div>
            )}
            <div className="p-4 h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
