import React from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    Title
);

interface SunburstDataPoint {
    value: number;
    label: string;
    parent?: string;
    color?: string;
}

interface SunburstChartProps {
    title: string;
    data: SunburstDataPoint[];
    height?: number;
    showLegend?: boolean;
    colorScale?: string[];
}

const SunburstChart: React.FC<SunburstChartProps> = ({
    title,
    data,
    height = 300,
    showLegend = true,
    colorScale = ['#ffeda0', '#feb24c', '#f03b20', '#bd0026', '#800026']
}) => {
    // Process data to create hierarchical structure
    const processData = (items: SunburstDataPoint[]) => {
        const datasets = [];
        let currentLevel = 0;
        let currentItems = items.filter(item => !item.parent);

        while (currentItems.length > 0) {
            const dataset = {
                label: `Level ${currentLevel}`,
                data: currentItems.map(item => item.value),
                backgroundColor: currentItems.map((_, index) =>
                    colorScale[index % colorScale.length]
                ),
                borderWidth: 1,
                borderColor: '#fff',
                weight: 1 / (currentLevel + 1)
            };
            datasets.push(dataset);

            // Get next level items
            currentItems = items.filter(item =>
                currentItems.some(parent =>
                    item.parent === parent.label
                )
            );
            currentLevel++;
        }

        return {
            labels: items.map(item => item.label),
            datasets
        };
    };

    const chartData = processData(data);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: showLegend,
                position: 'right' as const,
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
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '0%',
        radius: '90%',
        animation: {
            animateScale: true,
            animateRotate: true
        }
    };

    return (
        <div style={{ height: `${height}px` }}>
            <Doughnut data={chartData} options={options} />
        </div>
    );
};

export default SunburstChart; 