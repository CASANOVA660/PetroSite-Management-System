import React, { useEffect, useRef, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartData,
    ChartOptions,
    ChartType
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { addSeconds, format } from 'date-fns';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface LiveDataPoint {
    timestamp: Date;
    value: number;
}

interface LiveChartProps {
    title: string;
    initialData?: LiveDataPoint[];
    updateInterval?: number; // in milliseconds
    maxDataPoints?: number;
    height?: number;
    showLegend?: boolean;
    yAxisLabel?: string;
    animationDuration?: number;
    onDataUpdate?: (data: LiveDataPoint[]) => void;
}

const LiveChart: React.FC<LiveChartProps> = ({
    title,
    initialData = [],
    updateInterval = 1000,
    maxDataPoints = 20,
    height = 300,
    showLegend = true,
    yAxisLabel,
    animationDuration = 750,
    onDataUpdate
}) => {
    const [data, setData] = useState<LiveDataPoint[]>(initialData);
    const chartRef = useRef<ChartJS<'line'>>(null);

    // Generate random data for demonstration
    const generateRandomData = () => {
        const lastValue = data.length > 0 ? data[data.length - 1].value : 50;
        const newValue = Math.max(0, Math.min(100, lastValue + (Math.random() - 0.5) * 10));
        return {
            timestamp: new Date(),
            value: newValue
        };
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setData(prevData => {
                const newData = [...prevData, generateRandomData()];
                if (newData.length > maxDataPoints) {
                    newData.shift();
                }
                onDataUpdate?.(newData);
                return newData;
            });
        }, updateInterval);

        return () => clearInterval(interval);
    }, [updateInterval, maxDataPoints, onDataUpdate]);

    const chartData: ChartData<'line'> = {
        labels: data.map(point => format(point.timestamp, 'HH:mm:ss')),
        datasets: [
            {
                label: title,
                data: data.map(point => point.value),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.4,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5
            }
        ]
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: animationDuration
        },
        plugins: {
            legend: {
                display: showLegend,
                position: 'top' as const,
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            title: {
                display: true,
                text: title,
                font: {
                    size: 16,
                    weight: 'bold' as const
                },
                padding: {
                    top: 10,
                    bottom: 20
                }
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const value = context.raw;
                        return `${yAxisLabel || 'Value'}: ${value.toFixed(2)}`;
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'category' as const,
                grid: {
                    display: false
                },
                ticks: {
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 8
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: !!yAxisLabel,
                    text: yAxisLabel,
                    font: {
                        size: 12,
                        weight: 'bold' as const
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index' as const
        }
    };

    return (
        <div style={{ height: `${height}px` }}>
            <Line ref={chartRef} data={chartData} options={options} />
        </div>
    );
};

export default LiveChart; 