import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
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

interface ColumnChartProps {
    title: string;
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor: string[];
            borderColor?: string[];
            borderWidth?: number;
            barPercentage?: number;
            categoryPercentage?: number;
        }[];
    };
    height?: number;
}

const ColumnChart: React.FC<ColumnChartProps> = ({
    title,
    data,
    height = 300
}) => {
    // Apply default bar and category percentages to all datasets
    const chartData = {
        ...data,
        datasets: data.datasets.map(dataset => ({
            ...dataset,
            barPercentage: dataset.barPercentage ?? 0.8,
            categoryPercentage: dataset.categoryPercentage ?? 0.9
        }))
    };

    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const, // This makes it a horizontal bar chart
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#6B7280',
                    font: {
                        family: "'Inter', sans-serif",
                    },
                },
            },
            title: {
                display: true,
                text: title,
                color: '#1F2937',
                font: {
                    family: "'Inter', sans-serif",
                    size: 16,
                    weight: 'bold' as const,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1F2937',
                bodyColor: '#4B5563',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                    label: function (context: any) {
                        return `${context.dataset.label}: ${context.parsed.x}`;
                    }
                }
            },
        },
        scales: {
            x: {
                grid: {
                    color: '#E5E7EB',
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        family: "'Inter', sans-serif",
                    },
                },
            },
            y: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        family: "'Inter', sans-serif",
                    },
                },
            },
        },
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6" style={{ height }}>
            <Bar options={options} data={chartData} />
        </div>
    );
};

export default ColumnChart; 