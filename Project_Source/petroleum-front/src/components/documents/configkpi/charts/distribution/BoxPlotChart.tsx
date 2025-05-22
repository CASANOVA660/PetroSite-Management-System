import React, { useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartData,
    ChartOptions
} from 'chart.js';
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    BoxPlotController,
    BoxAndWiskers
);

type BoxPlotChartType = 'boxplot';

interface BoxPlotData {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    outliers?: number[];
}

interface BoxPlotChartProps {
    title: string;
    data: ChartData<'boxplot', BoxPlotData[], string>;
    height?: number;
    showOutliers?: boolean;
    showMean?: boolean;
}

const BoxPlotChart: React.FC<BoxPlotChartProps> = ({
    title,
    data,
    height = 300,
    showOutliers = true,
    showMean = true
}) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<ChartJS<'boxplot', BoxPlotData[], string> | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const options: ChartOptions<'boxplot'> = {
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
                            const dataset = context.dataset;
                            const value = dataset.data[context.dataIndex];
                            const lines = [
                                `Min: ${value.min.toFixed(2)}`,
                                `Q1: ${value.q1.toFixed(2)}`,
                                `Median: ${value.median.toFixed(2)}`,
                                `Q3: ${value.q3.toFixed(2)}`,
                                `Max: ${value.max.toFixed(2)}`,
                            ];
                            if (value.outliers && value.outliers.length > 0) {
                                lines.push(`Outliers: ${value.outliers.join(', ')}`);
                            }
                            return lines;
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
                    },
                },
            },
        };

        // Create new chart
        chartInstance.current = new ChartJS(ctx, {
            type: 'boxplot',
            data,
            options,
        });

        // Cleanup function
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data, title]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6" style={{ height }}>
            <canvas ref={chartRef} />
        </div>
    );
};

export default BoxPlotChart; 