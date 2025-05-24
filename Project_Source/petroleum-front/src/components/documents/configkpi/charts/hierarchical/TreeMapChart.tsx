import React from 'react';
import { Bar } from 'react-chartjs-2';
import { getChartOptions, chartColors } from '../chartTheme';

interface TreeItem {
    label: string;
    value: number;
    group?: string;
}

interface TreeMapChartProps {
    title: string;
    data: {
        datasets: {
            label: string;
            tree?: TreeItem[];
            borderColor?: string;
            borderWidth?: number;
        }[];
    };
    height?: number;
    showLegend?: boolean;
    colorScale?: string[];
}

const TreeMapChart: React.FC<TreeMapChartProps> = ({
    title,
    data,
    height = 300,
    showLegend = true,
    colorScale
}) => {
    // Check if data and tree array exist
    if (!data || !data.datasets || !data.datasets[0] || !data.datasets[0].tree) {
        return (
            <div style={{ height: `${height}px` }} className="flex items-center justify-center text-gray-500">
                No treemap data available
            </div>
        );
    }

    // Use default color scale if not provided
    const colors = colorScale || [
        chartColors.primaryBg,
        chartColors.secondaryBg,
        chartColors.warningBg,
        chartColors.dangerBg,
        chartColors.infoBg
    ];

    // Sort data by value for better visualization
    const sortedData = [...data.datasets[0].tree].sort((a, b) => b.value - a.value);

    const chartData = {
        labels: sortedData.map(item => item.label),
        datasets: [{
            label: data.datasets[0].label || 'Data',
            data: sortedData.map(item => item.value),
            backgroundColor: sortedData.map((item, index) => {
                // Group-based coloring if groups exist
                if (item.group) {
                    // Get unique groups and assign colors
                    const groups = [...new Set(sortedData.map(d => d.group))];
                    const groupIndex = groups.indexOf(item.group);
                    return colors[groupIndex % colors.length];
                }

                // Otherwise use index-based coloring
                const normalizedValue = index / sortedData.length;
                const colorIndex = Math.min(
                    Math.floor(normalizedValue * (colors.length - 1)),
                    colors.length - 1
                );
                return colors[colorIndex];
            }),
            borderColor: data.datasets[0].borderColor || 'white',
            borderWidth: data.datasets[0].borderWidth || 1
        }]
    };

    // Use the theme helper to get consistent options
    const baseOptions = getChartOptions('bar', title, showLegend, 'top');

    // Add TreeMap specific options
    const options = {
        ...baseOptions,
        indexAxis: 'y' as const,
        scales: {
            x: {
                beginAtZero: true,
                grid: {
                    display: false
                }
            },
            y: {
                grid: {
                    display: false
                }
            }
        }
    };

    // Add custom tooltip formatting
    if (options.plugins && options.plugins.tooltip && options.plugins.tooltip.callbacks) {
        options.plugins.tooltip.callbacks.label = (context: any) => {
            const value = context.raw;
            const label = context.label;
            const group = sortedData[context.dataIndex]?.group;
            const labels = [`Value: ${value}`];
            if (group) {
                labels.push(`Group: ${group}`);
            }
            return labels;
        };
    }

    return (
        <div style={{ height: `${height}px` }}>
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default TreeMapChart; 