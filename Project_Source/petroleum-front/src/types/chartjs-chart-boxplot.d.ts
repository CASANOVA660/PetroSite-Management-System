declare module '@sgratzl/chartjs-chart-boxplot' {
    import { ChartComponent, ChartTypeRegistry } from 'chart.js';

    export const BoxPlotController: ChartComponent;
    export const BoxAndWiskers: ChartComponent;

    declare module 'chart.js' {
        interface ChartTypeRegistry {
            boxplot: {
                chartOptions: {
                    elements: {
                        boxplot: {
                            outlierBackgroundColor?: string;
                            outlierBorderColor?: string;
                            outlierRadius?: number;
                            outlierBorderWidth?: number;
                            outlierPointStyle?: string;
                            outlierPointRadius?: number;
                            outlierPointBorderWidth?: number;
                            outlierPointBackgroundColor?: string;
                            outlierPointBorderColor?: string;
                            outlierPointHoverRadius?: number;
                            outlierPointHoverBackgroundColor?: string;
                            outlierPointHoverBorderColor?: string;
                            outlierPointHoverBorderWidth?: number;
                        };
                    };
                };
                datasetOptions: {
                    outlierBackgroundColor?: string;
                    outlierBorderColor?: string;
                    outlierRadius?: number;
                    outlierBorderWidth?: number;
                };
                defaultDataPoint: {
                    min: number;
                    q1: number;
                    median: number;
                    q3: number;
                    max: number;
                    outliers?: number[];
                };
            };
        }
    }
} 