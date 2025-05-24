import React from 'react';
import { Radar } from 'react-chartjs-2';
import { getChartOptions, chartColors, formatNumber } from '../chartTheme';
import '../ChartRegistry'; // Import the registry to ensure all components are registered

interface RadarChartProps {
    title: string;
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor: string;
            borderColor: string;
            pointBackgroundColor?: string;
            pointBorderColor?: string;
            pointHoverBackgroundColor?: string;
            pointHoverBorderColor?: string;
        }[];
    };
    height?: number;
    showLegend?: boolean;
    maxValue?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({
    title,
    data,
    height = 300,
    showLegend = true,
    maxValue = 100
}) => {
    // Use the theme helper to get consistent options
    const baseOptions = getChartOptions('radar', title, showLegend, 'top');

    // Add radar-specific options
    const options = {
        ...baseOptions,
        scales: {
            r: {
                angleLines: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                suggestedMin: 0,
                suggestedMax: maxValue,
                ticks: {
                    stepSize: maxValue / 5,
                    backdropColor: 'transparent'
                },
                pointLabels: {
                    font: {
                        size: 12
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            }
        }
    };

    // Add custom tooltip formatting
    if (options.plugins && options.plugins.tooltip && options.plugins.tooltip.callbacks) {
        options.plugins.tooltip.callbacks.label = (context: any) => {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${formatNumber(value)}`;
        };
    }

    // Enhance data with consistent styling if needed
    const enhancedData = {
        ...data,
        datasets: data.datasets.map((dataset, index) => ({
            ...dataset,
            backgroundColor: dataset.backgroundColor || chartColors.primaryBg,
            borderColor: dataset.borderColor || chartColors.primary,
            pointBackgroundColor: dataset.pointBackgroundColor || chartColors.primary,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5
        }))
    };

    return (
        <div style={{ height: `${height}px` }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <Radar data={enhancedData} options={options} />
        </div>
    );
};

export default RadarChart; 