import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Vitals } from '@/types';
import { format } from 'date-fns';

interface VitalsChartProps {
    data: Vitals[];
    type: 'heart_rate' | 'spo2' | 'temperature';
    title: string;
    color: string;
}

export function VitalsChart({ data, type, title, color }: VitalsChartProps) {
    const chartData = [...data].reverse().map(v => ({
        time: format(new Date(v.recorded_at), 'HH:mm'),
        value: v[type],
    }));

    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">{title}</CardTitle>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Live</span>
                    </div>
                </div>
                {chartData.length > 0 && (
                    <h3 className="text-2xl font-extrabold text-slate-900 mt-2 font-poppins">
                        {typeof chartData[chartData.length - 1].value === 'number'
                            ? (chartData[chartData.length - 1].value as number).toFixed(1)
                            : chartData[chartData.length - 1].value}
                        <span className="text-xs font-bold text-slate-400 ml-1">
                            {type === 'heart_rate' ? 'BPM' : type === 'spo2' ? '%' : '°C'}
                        </span>
                    </h3>
                )}
            </CardHeader>
            <CardContent className="p-0 h-[220px]">
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`color-${type}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                            minTickGap={30}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                fontSize: '12px',
                                fontWeight: '600'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#color-${type})`}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
