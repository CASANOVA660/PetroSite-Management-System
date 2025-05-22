import React from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    ArcElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js';
import { PolarArea } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    ArcElement,
    Tooltip,
    Legend,
    Title
);

interface PolarAreaChartProps {
    title: string;
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor?: string[];
            borderColor?: string[];
            borderWidth?: number;
        }[];
    };
    height?: number;
    showLegend?: boolean;
    startAngle?: number;
}

const PolarAreaChart: React.FC<PolarAreaChartProps> = ({
    title,
    data,
    height = 300,
    showLegend = true,
    startAngle = 0
}) => {
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
                        return `${label}: ${value}`;
                    }
                }
            }
        },
        scales: {
            r: {
                angleLines: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                suggestedMin: 0,
                ticks: {
                    backdropColor: 'transparent'
                },
                pointLabels: {
                    display: false
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                startAngle: startAngle
            }
        },
        elements: {
            arc: {
                borderWidth: 2
            }
        }
    };

    return (
        <div style={{ height: `${height}px` }}>
            <PolarArea data={data} options={options} />
        </div>
    );
};

export default PolarAreaChart; 