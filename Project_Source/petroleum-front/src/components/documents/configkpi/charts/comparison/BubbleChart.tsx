import React from 'react';
import { Bubble } from 'react-chartjs-2';
import { getChartOptions, chartColors, formatNumber } from '../chartTheme';
import '../ChartRegistry'; // Import the registry to ensure all components are registered

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
    // Use the theme helper to get consistent options
    const baseOptions = getChartOptions('bubble', title, showLegend, 'top');

    // Add bubble-specific options
    const options = {
        ...baseOptions,
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

    // Add custom tooltip formatting
    if (options.plugins && options.plugins.tooltip && options.plugins.tooltip.callbacks) {
        options.plugins.tooltip.callbacks.label = (context: any) => {
            const label = context.dataset.label || '';
            const x = formatNumber(context.raw.x);
            const y = formatNumber(context.raw.y);
            const r = context.raw.r;
            return `${label}: (${x}, ${y}, Size: ${r})`;
        };
    }

    // Enhance data with consistent styling if needed
    const enhancedData = {
        ...data,
        datasets: data.datasets.map((dataset, index) => ({
            ...dataset,
            backgroundColor: dataset.backgroundColor || chartColors.primary.replace('1)', '0.6)'),
            borderColor: dataset.borderColor || chartColors.primary,
            borderWidth: dataset.borderWidth || 1,
            hoverBackgroundColor: chartColors.primary.replace('1)', '0.8)'),
            hoverBorderColor: chartColors.primary,
            hoverBorderWidth: 2
        }))
    };

    return (
        <div style={{ height: `${height}px` }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <Bubble data={enhancedData} options={options} />
        </div>
    );
};

export default BubbleChart; 