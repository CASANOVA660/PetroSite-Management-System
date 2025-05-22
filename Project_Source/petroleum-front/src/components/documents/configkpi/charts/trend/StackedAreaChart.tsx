import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface StackedAreaChartProps {
    title: string;
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            borderColor: string;
            backgroundColor: string;
            tension?: number;
            fill?: boolean | string;
        }[];
    };
    height?: number;
    gradient?: boolean;
}

const StackedAreaChart: React.FC<StackedAreaChartProps> = ({
    title,
    data,
    height = 300,
    gradient = true
}) => {
    // Apply gradient fill and stacking to datasets
    const chartData = {
        ...data,
        datasets: data.datasets.map((dataset, index) => ({
            ...dataset,
            fill: gradient
                ? {
                    target: index === 0 ? 'origin' : '-1',
                    above: dataset.backgroundColor
                }
                : index === 0 ? true : '-1',
            backgroundColor: gradient
                ? `rgba(${dataset.backgroundColor.replace(/[^\d,]/g, '')}, 0.1)`
                : dataset.backgroundColor,
            stack: 'stack0' // This enables stacking
        }))
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#6B7280',
                    font: {
                        family: "'Inter', sans-serif",
                    },
                },
            },
            title: {
                display: true,
                text: title,
                color: '#1F2937',
                font: {
                    family: "'Inter', sans-serif",
                    size: 16,
                    weight: 'bold' as const,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1F2937',
                bodyColor: '#4B5563',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                    label: function (context: any) {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        family: "'Inter', sans-serif",
                    },
                },
            },
            y: {
                grid: {
                    color: '#E5E7EB',
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        family: "'Inter', sans-serif",
                    },
                },
                stacked: true,
                beginAtZero: true,
            },
        },
        interaction: {
            intersect: false,
            mode: 'index',
        },
        elements: {
            line: {
                tension: 0.4,
            },
            point: {
                radius: 3,
                hoverRadius: 5,
            },
        },
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6" style={{ height }}>
            <Line options={options} data={chartData} />
        </div>
    );
};

export default StackedAreaChart; 