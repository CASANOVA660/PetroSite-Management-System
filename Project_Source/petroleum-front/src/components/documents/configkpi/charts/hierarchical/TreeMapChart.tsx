import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface TreeMapDataPoint {
    value: number;
    label: string;
    group?: string;
    backgroundColor?: string;
}

interface TreeMapChartProps {
    title: string;
    data: {
        datasets: {
            label: string;
            tree: TreeMapDataPoint[];
            backgroundColor?: string[];
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
    colorScale = ['#ffeda0', '#feb24c', '#f03b20']
}) => {
    // Sort data by value for better visualization
    const sortedData = data.datasets[0].tree.sort((a, b) => b.value - a.value);

    const chartData = {
        labels: sortedData.map(item => item.label),
        datasets: [{
            label: data.datasets[0].label,
            data: sortedData.map(item => item.value),
            backgroundColor: sortedData.map((_, index) => {
                const normalizedValue = index / sortedData.length;
                const colorIndex = Math.min(
                    Math.floor(normalizedValue * (colorScale.length - 1)),
                    colorScale.length - 1
                );
                return colorScale[colorIndex];
            }),
            borderColor: data.datasets[0].borderColor || 'white',
            borderWidth: data.datasets[0].borderWidth || 1
        }]
    };

    const options = {
        indexAxis: 'y' as const,
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
                        const value = context.raw;
                        const label = context.label;
                        const group = sortedData[context.dataIndex].group;
                        const labels = [`Value: ${value}`];
                        if (group) {
                            labels.push(`Group: ${group}`);
                        }
                        return labels;
                    }
                }
            }
        },
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

    return (
        <div style={{ height: `${height}px` }}>
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default TreeMapChart; 