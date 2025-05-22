import React from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    Title
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    Title
);

interface RadarChartProps {
    title: string;
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor?: string;
            borderColor?: string;
            borderWidth?: number;
            fill?: boolean;
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
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: showLegend,
                position: 'top' as const,
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
                        const label = context.dataset.label || '';
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
        },
        elements: {
            line: {
                borderWidth: 2
            },
            point: {
                radius: 3,
                hitRadius: 10,
                hoverRadius: 5
            }
        }
    };

    return (
        <div style={{ height: `${height}px` }}>
            <Radar data={data} options={options} />
        </div>
    );
};

export default RadarChart; 