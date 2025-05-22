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
    label?: string;
}

interface BubbleChartProps {
    title: string;
    data: {
        datasets: {
            label: string;
            data: BubbleDataPoint[];
            backgroundColor?: string;
            borderColor?: string;
            borderWidth?: number;
        }[];
    };
    height?: number;
    showLegend?: boolean;
    xAxisLabel?: string;
    yAxisLabel?: string;
    minRadius?: number;
    maxRadius?: number;
}

const BubbleChart: React.FC<BubbleChartProps> = ({
    title,
    data,
    height = 300,
    showLegend = true,
    xAxisLabel,
    yAxisLabel,
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
                        const point = context.raw as BubbleDataPoint;
                        const label = context.dataset.label || '';
                        const customLabel = point.label || '';
                        const labels = [
                            `${label}`,
                            `X: ${point.x}`,
                            `Y: ${point.y}`,
                            `Size: ${point.r}`
                        ];
                        if (customLabel) {
                            labels.push(`Info: ${customLabel}`);
                        }
                        return labels;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: !!xAxisLabel,
                    text: xAxisLabel,
                    font: {
                        size: 12,
                        weight: 'bold' as const
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
            y: {
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
        elements: {
            point: {
                radius: (context: any) => {
                    const value = context.raw.r;
                    const min = Math.min(...data.datasets.flatMap(d => d.data.map(p => p.r)));
                    const max = Math.max(...data.datasets.flatMap(d => d.data.map(p => p.r)));
                    const scale = (value - min) / (max - min);
                    return minRadius + (maxRadius - minRadius) * scale;
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