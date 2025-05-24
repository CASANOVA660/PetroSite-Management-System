/**
 * Chart Theme Helper
 * Provides consistent styling options for all chart components
 */

import { ChartOptions } from 'chart.js';
import { ChartTypeRegistry } from 'chart.js';

// Color palette for charts
export const chartColors = {
    primary: 'rgba(75, 192, 192, 1)',
    secondary: 'rgba(54, 162, 235, 1)',
    success: 'rgba(75, 192, 75, 1)',
    danger: 'rgba(255, 99, 132, 1)',
    warning: 'rgba(255, 159, 64, 1)',
    info: 'rgba(153, 102, 255, 1)',
    light: 'rgba(201, 203, 207, 1)',
    dark: 'rgba(45, 55, 72, 1)',

    // Background versions with opacity
    primaryBg: 'rgba(75, 192, 192, 0.2)',
    secondaryBg: 'rgba(54, 162, 235, 0.2)',
    successBg: 'rgba(75, 192, 75, 0.2)',
    dangerBg: 'rgba(255, 99, 132, 0.2)',
    warningBg: 'rgba(255, 159, 64, 0.2)',
    infoBg: 'rgba(153, 102, 255, 0.2)',
    lightBg: 'rgba(201, 203, 207, 0.2)',
    darkBg: 'rgba(45, 55, 72, 0.2)',
};

// Font settings
export const fonts = {
    base: "'Inter', sans-serif",
    sizes: {
        small: 12,
        normal: 14,
        large: 16,
        xlarge: 18
    }
};

// Default tooltip style
export const tooltipStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    titleColor: '#1F2937',
    bodyColor: '#4B5563',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    padding: 12,
    boxPadding: 6,
    usePointStyle: true,
    cornerRadius: 6,
    titleFont: {
        family: fonts.base,
        weight: 'bold' as const,
    },
    bodyFont: {
        family: fonts.base,
    },
    caretSize: 6,
};

// Generate chart options with consistent styling
export function getChartOptions<T extends keyof ChartTypeRegistry>(
    type: T,
    title: string,
    showLegend: boolean = true,
    legendPosition: 'top' | 'right' | 'bottom' | 'left' = 'top'
): any {
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: showLegend,
                position: legendPosition,
                labels: {
                    color: '#6B7280',
                    font: {
                        family: fonts.base,
                        size: fonts.sizes.normal,
                    },
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: 10,
                },
            },
            title: {
                display: !!title,
                text: title,
                color: '#1F2937',
                font: {
                    family: fonts.base,
                    size: fonts.sizes.large,
                    weight: 'bold' as const,
                },
                padding: {
                    top: 10,
                    bottom: 20,
                },
            },
            tooltip: tooltipStyle,
        },
    };

    // Add type-specific options
    if (type === 'line' || type === 'bar') {
        return {
            ...baseOptions,
            scales: {
                x: {
                    grid: {
                        display: type === 'line' ? true : false,
                        color: 'rgba(0, 0, 0, 0.05)',
                    },
                    ticks: {
                        color: '#6B7280',
                        font: {
                            family: fonts.base,
                        },
                    },
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                    },
                    ticks: {
                        color: '#6B7280',
                        font: {
                            family: fonts.base,
                        },
                    },
                },
            },
            interaction: {
                intersect: false,
                mode: 'index' as const,
            },
        };
    }

    return baseOptions;
}

// Helper to generate gradient backgrounds for charts
export function createGradientBackground(ctx: CanvasRenderingContext2D, height: number, color: string) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    const rgbaColor = color.replace('rgb', 'rgba').replace(')', ', 0.2)');
    gradient.addColorStop(0, rgbaColor);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    return gradient;
}

// Format large numbers for better readability in tooltips and axes
export function formatNumber(value: number): string {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
}

// Generate a percentage label for pie/doughnut charts
export function generatePercentageLabel(context: any): string {
    const label = context.label || '';
    const value = context.parsed || 0;
    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
    const percentage = Math.round((value / total) * 100);
    return `${label}: ${value} (${percentage}%)`;
} 