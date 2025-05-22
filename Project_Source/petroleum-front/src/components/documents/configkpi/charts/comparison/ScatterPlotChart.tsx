import React from 'react';
import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Title
);

interface ScatterDataPoint {
    x: number;
    y: number;
}

interface ScatterPlotChartProps {
    title: string;
    data: {
        datasets: {
            label: string;
            data: ScatterDataPoint[];
            backgroundColor: string;
            borderColor?: string;
            pointRadius?: number;
            pointHoverRadius?: number;
        }[];
    };
    height?: number;
    showLegend?: boolean;
    showLine?: boolean;
}

const ScatterPlotChart: React.FC<ScatterPlotChartProps> = ({
    title,
    data,
    height = 300,
    showLegend = true,
    showLine = false
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
                        return `${label}: (${x}, ${y})`;
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
                radius: 5,
                hitRadius: 10,
                hoverRadius: 7
            }
        }
    };

    // Add line if showLine is true
    const chartData = {
        ...data,
        datasets: data.datasets.map(dataset => ({
            ...dataset,
            showLine: showLine,
            borderWidth: showLine ? 2 : 0
        }))
    };

    return (
        <div style={{ height: `${height}px` }}>
            <Scatter data={chartData} options={options} />
        </div>
    );
};

export default ScatterPlotChart; 