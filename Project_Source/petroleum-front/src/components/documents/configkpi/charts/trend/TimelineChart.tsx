import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
    Filler,
    TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chartjs-adapter-date-fns';
import { AnnotationOptions } from 'chartjs-plugin-annotation';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    TimeScale,
    annotationPlugin
);

interface TimelineEvent {
    date: string;
    label: string;
    description?: string;
    color?: string;
}

interface TimelineChartProps {
    title: string;
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            borderColor: string;
            backgroundColor: string;
            tension?: number;
        }[];
    };
    events?: TimelineEvent[];
    height?: number;
    showEvents?: boolean;
}

const TimelineChart: React.FC<TimelineChartProps> = ({
    title,
    data,
    events = [],
    height = 300,
    showEvents = true
}) => {
    const options: ChartOptions<'line'> = {
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
                        return `${label}: ${value}`;
                    }
                }
            },
            annotation: showEvents ? {
                annotations: events.reduce((acc: Record<string, AnnotationOptions>, event, index) => {
                    acc[`event-${index}`] = {
                        type: 'line',
                        xMin: event.date,
                        xMax: event.date,
                        borderColor: event.color || '#F28C38',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        label: {
                            display: true,
                            content: event.label,
                            position: 'start',
                            backgroundColor: event.color || '#F28C38',
                            color: '#fff',
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12,
                            },
                            padding: {
                                top: 4,
                                bottom: 4,
                                left: 8,
                                right: 8,
                            },
                        },
                    };
                    return acc;
                }, {})
            } : undefined,
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    displayFormats: {
                        day: 'MMM d',
                    },
                },
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
        interaction: {
            intersect: false,
            mode: 'index',
        },
        elements: {
            line: {
                tension: 0.4,
            },
            point: {
                radius: 3,
                hoverRadius: 5,
            },
        },
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6" style={{ height }}>
            <Line options={options} data={data} />
            {showEvents && events.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Événements</h4>
                    <div className="space-y-1">
                        {events.map((event, index) => (
                            <div
                                key={index}
                                className="flex items-start space-x-2 text-sm"
                            >
                                <div
                                    className="w-2 h-2 rounded-full mt-1.5"
                                    style={{ backgroundColor: event.color || '#F28C38' }}
                                />
                                <div>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {event.label}
                                    </span>
                                    {event.description && (
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {event.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimelineChart; 