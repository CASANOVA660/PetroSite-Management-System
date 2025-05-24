import { ChartData } from 'chart.js';

export interface BoxPlotData {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
}

export interface TimelineData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        tension?: number;
    }[];
}

export interface BoxPlotChartData {
    labels: string[];
    datasets: {
        label: string;
        data: BoxPlotData[];
        backgroundColor: string[];
    }[];
}

export interface HistogramData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor?: string;
        borderWidth?: number;
    }[];
}

export type LineChartData = {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        tension?: number;
    }[];
};

export type BarChartData = {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string[] | string;
        borderColor?: string[] | string;
        borderWidth?: number;
    }[];
};

export type PieChartData = {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string[] | string;
        borderColor?: string[] | string;
        borderWidth?: number;
    }[];
};

export type TreeMapData = {
    datasets: {
        label: string;
        tree: Array<{
            value: number;
            label: string;
            group?: string;
        }>;
    }[];
};

export type RadarChartData = {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        pointBackgroundColor: string;
    }[];
};

export type BubbleChartData = {
    datasets: {
        label: string;
        data: Array<{ x: number; y: number; r: number }>;
        backgroundColor: string;
        borderColor?: string;
        borderWidth?: number;
    }[];
};

export type PreviewData = {
    line: LineChartData;
    bar: BarChartData;
    pie: PieChartData;
    timeline: TimelineData;
    boxplot: BoxPlotChartData;
    histogram: HistogramData;
    treemap: TreeMapData;
    radar: RadarChartData;
    bubble: BubbleChartData;
    live: LineChartData;
};

export type ChartDataType = {
    line: ChartData<'line', number[], string>;
    bar: ChartData<'bar', number[], string>;
    pie: ChartData<'pie', number[], string>;
    timeline: TimelineData;
    boxplot: BoxPlotChartData;
    histogram: HistogramData;
    treemap: TreeMapData;
    radar: ChartData<'radar', number[], string>;
    bubble: ChartData<'bubble', Array<{ x: number; y: number; r: number }>, string>;
    live: ChartData<'line', number[], string>;
};

export type ChartType =
    | 'line'
    | 'bar'
    | 'pie'
    | 'timeline'
    | 'boxplot'
    | 'histogram'
    | 'treemap'
    | 'radar'
    | 'bubble'
    | 'live';

export interface KpiData {
    id: string;
    title: string;
    description: string;
    chartType: ChartType;
    data: ChartDataType[ChartType];
    calculationMethod: 'percentage' | 'ratio' | 'sum' | 'average';
    dataSources: string[];
    formula: string;
    category: 'basic' | 'trend' | 'distribution' | 'comparison' | 'hierarchical' | 'advanced' | 'realtime';
} 