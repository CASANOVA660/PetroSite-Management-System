import React from 'react';
import { Pie } from 'react-chartjs-2';
import { getChartOptions, generatePercentageLabel } from '../chartTheme';
import '../ChartRegistry'; // Import the registry to ensure all components are registered

interface PieChartProps {
    title: string;
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor: string[];
            borderColor?: string[];
            borderWidth?: number;
        }[];
    };
    height?: number;
    showLegend?: boolean;
}

const PieChart: React.FC<PieChartProps> = ({
    title,
    data,
    height = 300,
    showLegend = true
}) => {
    // Use the theme helper to get consistent options
    const options = getChartOptions('pie', title, showLegend, 'right');

    // Add custom tooltip formatting for percentage display
    if (options.plugins && options.plugins.tooltip && options.plugins.tooltip.callbacks) {
        options.plugins.tooltip.callbacks.label = generatePercentageLabel;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6" style={{ height }}>
            <Pie options={options} data={data} />
        </div>
    );
};

export default PieChart; 