import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Title
);

interface HeatmapDataPoint {
    x: number;
    y: number;
    value: number;
}

interface HeatmapChartProps {
    title: string;
    data: {
        datasets: {
            label: string;
            data: HeatmapDataPoint[];
            backgroundColor: (context: any) => string;
            borderColor?: string;
            borderWidth?: number;
            pointRadius?: number;
        }[];
    };
    height?: number;
    showLegend?: boolean;
    colorScale?: string[];
    minValue?: number;
    maxValue?: number;
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({
    title,
    data,
    height = 300,
    showLegend = true,
    colorScale = ['#ffeda0', '#feb24c', '#f03b20'],
    minValue = 0,
    maxValue = 100
}) => {
    // Create color gradient function
    const getColor = (value: number) => {
        const normalizedValue = (value - minValue) / (maxValue - minValue);
        const colorIndex = Math.min(
            Math.floor(normalizedValue * (colorScale.length - 1)),
            colorScale.length - 2
        );
        const color1 = colorScale[colorIndex];
        const color2 = colorScale[colorIndex + 1];
        const factor = (normalizedValue * (colorScale.length - 1)) % 1;

        // Simple linear interpolation between colors
        return `rgba(${interpolateColor(color1, color2, factor)})`;
    };

    // Helper function to interpolate between two colors
    const interpolateColor = (color1: string, color2: string, factor: number) => {
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');

        const r1 = parseInt(hex1.substring(0, 2), 16);
        const g1 = parseInt(hex1.substring(2, 4), 16);
        const b1 = parseInt(hex1.substring(4, 6), 16);

        const r2 = parseInt(hex2.substring(0, 2), 16);
        const g2 = parseInt(hex2.substring(2, 4), 16);
        const b2 = parseInt(hex2.substring(4, 6), 16);

        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);

        return `${r}, ${g}, ${b}, 0.8`;
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
                    pointStyle: 'rect'
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
                        const value = context.raw.value;
                        return `${label}: (${x}, ${y}) = ${value}`;
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
                radius: 8,
                hitRadius: 10,
                hoverRadius: 10
            }
        }
    };

    // Transform data to use dynamic colors based on value
    const chartData = {
        ...data,
        datasets: data.datasets.map(dataset => ({
            ...dataset,
            backgroundColor: (context: any) => {
                const value = context.raw.value;
                return getColor(value);
            }
        }))
    };

    return (
        <div style={{ height: `${height}px` }}>
            <Scatter data={chartData} options={options} />
        </div>
    );
};

export default HeatmapChart; 