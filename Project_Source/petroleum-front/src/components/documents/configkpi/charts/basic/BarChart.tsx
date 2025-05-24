import React from 'react';
import { Bar } from 'react-chartjs-2';
import { getChartOptions, formatNumber } from '../chartTheme';
import '../ChartRegistry'; // Import the registry to ensure all components are registered

interface BarChartProps {
    title: string;
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor: string | string[];
            borderColor?: string | string[];
            borderWidth?: number;
            barPercentage?: number;
            categoryPercentage?: number;
        }[];
    };
    height?: number;
    showLegend?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
    title,
    data,
    height = 300,
    showLegend = true
}) => {
    // Use the theme helper to get consistent options
    const options = getChartOptions('bar', title, showLegend, 'top');

    // Add custom tooltip formatting
    if (options.plugins && options.plugins.tooltip && options.plugins.tooltip.callbacks) {
        options.plugins.tooltip.callbacks.label = function (context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${formatNumber(value)}`;
        };
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6" style={{ height }}>
            <Bar options={options} data={data} />
        </div>
    );
};

export default BarChart; 