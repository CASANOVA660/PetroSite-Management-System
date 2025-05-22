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

interface AreaChartProps {
    title: string;
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            borderColor: string;
            backgroundColor: string;
            tension?: number;
            fill?: boolean;
        }[];
    };
    height?: number;
    showLegend?: boolean;
    gradient?: boolean;
}

const AreaChart: React.FC<AreaChartProps> = ({
    title,
    data,
    height = 300,
    showLegend = true,
    gradient = true
}) => {
    // Create gradient for each dataset if gradient is enabled
    const chartData = {
        ...data,
        datasets: data.datasets.map(dataset => {
            if (!gradient) return dataset;

            const ctx = document.createElement('canvas').getContext('2d');
            if (!ctx) return dataset;

            const gradientFill = ctx.createLinearGradient(0, 0, 0, height);
            const color = dataset.borderColor;
            gradientFill.addColorStop(0, color.replace('rgb', 'rgba').replace(')', ', 0.2)'));
            gradientFill.addColorStop(1, color.replace('rgb', 'rgba').replace(')', ', 0.0)'));

            return {
                ...dataset,
                backgroundColor: gradientFill,
                fill: true
            };
        })
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
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
                mode: 'index' as const,
                intersect: false,
                callbacks: {
                    label: (context: any) => {
                        const label = context.dataset.label || '';
                        const value = context.raw || 0;
                        return `${label}: ${value}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            }
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        },
        elements: {
            line: {
                tension: 0.4
            },
            point: {
                radius: 3,
                hitRadius: 10,
                hoverRadius: 5
            }
        }
    };

    return (
        <div style={{ height: `${height}px` }}>
            <Line data={chartData} options={options} />
        </div>
    );
};

export default AreaChart; 