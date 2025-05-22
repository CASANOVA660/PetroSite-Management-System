import React from 'react';
import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js';
import { Bubble } from 'react-chartjs-2';

ChartJS.register(
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Title
);

interface BubbleDataPoint {
    x: number;
    y: number;
    r: number;
}

interface BubbleChartProps {
    title: string;
    data: {
        datasets: {
            label: string;
            data: BubbleDataPoint[];
            backgroundColor: string;
            borderColor?: string;
            borderWidth?: number;
        }[];
    };
    height?: number;
    showLegend?: boolean;
    minRadius?: number;
    maxRadius?: number;
}

const BubbleChart: React.FC<BubbleChartProps> = ({
    title,
    data,
    height = 300,
    showLegend = true,
    minRadius = 5,
    maxRadius = 20
}) => {
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
                callbacks: {
                    label: (context: any) => {
                        const label = context.dataset.label || '';
                        const x = context.raw.x;
                        const y = context.raw.y;
                        const r = context.raw.r;
                        return `${label}: (${x}, ${y}, Size: ${r})`;
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'linear' as const,
                position: 'bottom' as const,
                title: {
                    display: true,
                    text: 'X Axis'
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
            y: {
                type: 'linear' as const,
                title: {
                    display: true,
                    text: 'Y Axis'
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            }
        },
        elements: {
            point: {
                radius: (context: any) => {
                    const value = context.raw.r;
                    const size = (value - minRadius) / (maxRadius - minRadius);
                    return Math.max(5, Math.min(20, size * 15));
                }
            }
        }
    };

    return (
        <div style={{ height: `${height}px` }}>
            <Bubble data={data} options={options} />
        </div>
    );
};

export default BubbleChart; 