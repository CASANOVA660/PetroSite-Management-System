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

interface HistogramChartProps {
    title: string;
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor: string;
            borderColor?: string;
            borderWidth?: number;
        }[];
    };
    height?: number;
    binCount?: number;
    showFrequency?: boolean;
}

const HistogramChart: React.FC<HistogramChartProps> = ({
    title,
    data,
    height = 300,
    binCount = 10,
    showFrequency = true
}) => {
    // Calculate histogram bins
    const calculateBins = (values: number[], binCount: number) => {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binSize = (max - min) / binCount;

        const bins = Array(binCount).fill(0);
        const binLabels = Array(binCount).fill('');

        values.forEach(value => {
            const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
            bins[binIndex]++;
        });

        // Generate bin labels
        for (let i = 0; i < binCount; i++) {
            const binStart = min + (i * binSize);
            const binEnd = min + ((i + 1) * binSize);
            binLabels[i] = `${binStart.toFixed(1)} - ${binEnd.toFixed(1)}`;
        }

        return { bins, binLabels };
    };

    // Process data for histogram
    const processedData = {
        labels: data.labels,
        datasets: data.datasets.map(dataset => {
            const { bins, binLabels } = calculateBins(dataset.data, binCount);
            const total = dataset.data.length;

            return {
                ...dataset,
                data: showFrequency
                    ? bins.map(bin => (bin / total) * 100) // Show as percentage
                    : bins, // Show as count
                label: showFrequency
                    ? `${dataset.label} (%)`
                    : `${dataset.label} (count)`,
            };
        }),
    };

    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
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
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return showFrequency
                            ? `${label}: ${value.toFixed(1)}%`
                            : `${label}: ${value}`;
                    }
                }
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        family: "'Inter', sans-serif",
                    },
                    maxRotation: 45,
                    minRotation: 45,
                },
            },
            y: {
                grid: {
                    color: '#E5E7EB',
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        family: "'Inter', sans-serif",
                    },
                    callback: function (value: any) {
                        return showFrequency
                            ? `${value}%`
                            : value;
                    }
                },
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6" style={{ height }}>
            <Bar options={options} data={processedData} />
        </div>
    );
};

export default HistogramChart; 