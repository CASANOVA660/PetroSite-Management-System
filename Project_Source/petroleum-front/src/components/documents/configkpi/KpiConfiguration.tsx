import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChartBarIcon,
    PlusIcon,
    TrashIcon,
    InformationCircleIcon,
    CalculatorIcon,
    ServerIcon,
    XMarkIcon,
    ArrowTrendingUpIcon,
    ChartPieIcon,
    ChartBarSquareIcon,
    ClockIcon,
    BellAlertIcon,
    DocumentChartBarIcon,
    PresentationChartLineIcon,
    PresentationChartBarIcon,
    ChatBubbleLeftIcon,
    ArrowPathIcon,
    CircleStackIcon,
    Squares2X2Icon
} from '@heroicons/react/24/outline';
import ChartSelector from './ChartSelector';
import { ChartData } from 'chart.js';

// Import all chart components
import {
    // Basic Charts
    LineChart,
    BarChart,
    PieChart,
    // Trend & Time-Series Charts
    TimelineChart,
    // Distribution Charts
    BoxPlotChart,
    HistogramChart,
    // Hierarchical Charts
    TreeMapChart,
    // Advanced Charts
    RadarChart,
    BubbleChart,
} from './charts';

interface BoxPlotData {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
}

interface TimelineData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        tension?: number;
    }[];
}

interface BoxPlotChartData {
    labels: string[];
    datasets: {
        label: string;
        data: BoxPlotData[];
        backgroundColor: string[];
    }[];
}

interface HistogramData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor?: string;
        borderWidth?: number;
    }[];
}

type LineChartData = {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        tension?: number;
    }[];
};

type BarChartData = {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string[];
        borderColor?: string[];
        borderWidth?: number;
    }[];
};

type PieChartData = {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string[];
        borderColor?: string[];
        borderWidth?: number;
    }[];
};

type PreviewData = {
    line: LineChartData;
    bar: BarChartData;
    pie: PieChartData;
    timeline: TimelineData;
    boxplot: BoxPlotChartData;
    histogram: HistogramData;
    treemap: {
        datasets: {
            label: string;
            tree: Array<{
                value: number;
                label: string;
                group?: string;
            }>;
        }[];
    };
    radar: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor: string;
            borderColor: string;
            pointBackgroundColor: string;
        }[];
    };
    bubble: {
        datasets: {
            label: string;
            data: Array<{ x: number; y: number; r: number }>;
            backgroundColor: string;
            borderColor?: string;
            borderWidth?: number;
        }[];
    };
    live: LineChartData;
};

type ChartDataType = {
    line: ChartData<'line', number[], string>;
    bar: ChartData<'bar', number[], string>;
    pie: ChartData<'pie', number[], string>;
    timeline: TimelineData;
    boxplot: BoxPlotChartData;
    histogram: HistogramData;
    treemap: {
        datasets: {
            label: string;
            tree: Array<{
                value: number;
                label: string;
                group?: string;
            }>;
        }[];
    };
    radar: ChartData<'radar', number[], string>;
    bubble: ChartData<'bubble', Array<{ x: number; y: number; r: number }>, string>;
    live: ChartData<'line', number[], string>;
};

type ChartType =
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

interface KpiData {
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

const KpiConfiguration: React.FC = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedChart, setSelectedChart] = useState<ChartType | null>(null);
    const [kpiForm, setKpiForm] = useState({
        title: '',
        description: '',
        dataSources: [] as string[],
        formula: ''
    });
    const [kpis, setKpis] = useState<KpiData[]>([
        {
            id: '1',
            title: 'Efficacité des Documents',
            description: 'Suivi de la complétion des documents',
            chartType: 'line',
            category: 'basic',
            data: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
                datasets: [{
                    label: 'Documents Complétés',
                    data: [65, 78, 90, 85, 95, 100],
                    borderColor: '#F28C38',
                    backgroundColor: 'rgba(242, 140, 56, 0.1)',
                    tension: 0.4
                }]
            },
            calculationMethod: 'percentage',
            dataSources: ['Documents'],
            formula: '(Documents complétés / Total documents) * 100'
        },
        {
            id: '2',
            title: 'Répartition des Actions',
            description: 'Distribution des actions par catégorie',
            chartType: 'pie',
            category: 'basic',
            data: {
                labels: ['En cours', 'Terminées', 'En attente'],
                datasets: [{
                    label: 'Actions',
                    data: [30, 50, 20],
                    backgroundColor: ['#F28C38', '#10B981', '#6B7280'],
                }]
            },
            calculationMethod: 'ratio',
            dataSources: ['Actions'],
            formula: 'Actions par catégorie / Total actions'
        },
        {
            id: '3',
            title: 'Timeline des Événements',
            description: 'Suivi des événements clés du projet',
            chartType: 'timeline',
            category: 'trend',
            data: {
                labels: ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'],
                datasets: [{
                    label: 'Progression',
                    data: [20, 45, 60, 75, 85, 95],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            calculationMethod: 'percentage',
            dataSources: ['Planning'],
            formula: 'Progression / Objectif total * 100'
        },
        {
            id: '4',
            title: 'Distribution des Performances',
            description: 'Analyse de la distribution des performances',
            chartType: 'boxplot',
            category: 'distribution',
            data: {
                labels: ['Équipe A', 'Équipe B', 'Équipe C'],
                datasets: [{
                    label: 'Performance',
                    data: [
                        { min: 65, q1: 75, median: 85, q3: 95, max: 100 },
                        { min: 70, q1: 80, median: 90, q3: 95, max: 98 },
                        { min: 60, q1: 70, median: 85, q3: 90, max: 95 }
                    ],
                    backgroundColor: ['#F28C38', '#10B981', '#3B82F6'],
                }]
            },
            calculationMethod: 'average',
            dataSources: ['Actions', 'Documents'],
            formula: 'Moyenne des performances par équipe'
        }
    ]);

    const getPreviewData = (chartType: ChartType): PreviewData[keyof PreviewData] | null => {
        switch (chartType) {
            case 'line':
                return {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
                    datasets: [{
                        label: 'Données Exemple',
                        data: [30, 45, 60, 75, 85, 95],
                        borderColor: '#F28C38',
                        backgroundColor: 'rgba(242, 140, 56, 0.1)',
                        tension: 0.4
                    }]
                } as LineChartData;
            case 'bar':
                return {
                    labels: ['Catégorie A', 'Catégorie B', 'Catégorie C', 'Catégorie D'],
                    datasets: [{
                        label: 'Données Exemple',
                        data: [65, 45, 80, 55],
                        backgroundColor: ['#F28C38', '#10B981', '#3B82F6', '#6B7280'],
                    }]
                } as BarChartData;
            case 'pie':
                return {
                    labels: ['Partie 1', 'Partie 2', 'Partie 3', 'Partie 4'],
                    datasets: [{
                        label: 'Données Exemple',
                        data: [30, 25, 20, 25],
                        backgroundColor: ['#F28C38', '#10B981', '#3B82F6', '#6B7280'],
                    }]
                } as PieChartData;
            case 'timeline':
                return {
                    labels: ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'],
                    datasets: [{
                        label: 'Progression',
                        data: [20, 45, 60, 75, 85, 95],
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    }]
                } as TimelineData;
            case 'boxplot':
                return {
                    labels: ['Groupe A', 'Groupe B', 'Groupe C'],
                    datasets: [{
                        label: 'Distribution',
                        data: [
                            { min: 65, q1: 75, median: 85, q3: 95, max: 100 },
                            { min: 70, q1: 80, median: 90, q3: 95, max: 98 },
                            { min: 60, q1: 70, median: 85, q3: 90, max: 95 }
                        ],
                        backgroundColor: ['#F28C38', '#10B981', '#3B82F6'],
                    }]
                } as BoxPlotChartData;
            case 'histogram':
                return {
                    labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
                    datasets: [{
                        label: 'Distribution',
                        data: [10, 25, 45, 30, 15],
                        backgroundColor: '#F28C38',
                    }]
                } as HistogramData;
            case 'treemap':
                return {
                    datasets: [{
                        label: 'Données Exemple',
                        tree: [
                            { value: 100, label: 'Catégorie A', group: 'Groupe 1' },
                            { value: 80, label: 'Catégorie B', group: 'Groupe 1' },
                            { value: 60, label: 'Catégorie C', group: 'Groupe 2' },
                            { value: 40, label: 'Catégorie D', group: 'Groupe 2' }
                        ]
                    }]
                } as any;
            case 'radar':
                return {
                    labels: ['Métrique 1', 'Métrique 2', 'Métrique 3', 'Métrique 4', 'Métrique 5'],
                    datasets: [{
                        label: 'Données Exemple',
                        data: [65, 75, 90, 81, 56],
                        backgroundColor: 'rgba(242, 140, 56, 0.2)',
                        borderColor: '#F28C38',
                        pointBackgroundColor: '#F28C38'
                    }]
                };
            case 'bubble':
                return {
                    datasets: [{
                        label: 'Données Exemple',
                        data: [
                            { x: 20, y: 30, r: 15 },
                            { x: 40, y: 10, r: 10 },
                            { x: 15, y: 50, r: 20 },
                            { x: 60, y: 40, r: 25 }
                        ],
                        backgroundColor: 'rgba(242, 140, 56, 0.6)',
                        borderColor: '#F28C38',
                        borderWidth: 1
                    }]
                };
            case 'live':
                return {
                    labels: ['T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'T'],
                    datasets: [{
                        label: 'Données en Temps Réel',
                        data: [65, 59, 80, 81, 56, 55],
                        borderColor: '#F28C38',
                        backgroundColor: 'rgba(242, 140, 56, 0.1)',
                        tension: 0.4
                    }]
                };
            default:
                return null;
        }
    };

    const renderPreviewChart = () => {
        if (!selectedChart) return null;
        const previewData = getPreviewData(selectedChart);
        if (!previewData) return null;

        const chartProps = {
            title: "Aperçu",
            data: previewData
        };

        switch (selectedChart) {
            case 'line':
                return <LineChart {...chartProps} data={previewData as PreviewData['line']} />;
            case 'bar':
                return <BarChart {...chartProps} data={previewData as PreviewData['bar']} />;
            case 'pie':
                return <PieChart {...chartProps} data={previewData as PreviewData['pie']} />;
            case 'timeline':
                return <TimelineChart {...chartProps} data={previewData as PreviewData['timeline']} />;
            case 'boxplot':
                return <BoxPlotChart {...chartProps} data={previewData as PreviewData['boxplot']} />;
            case 'histogram':
                return <HistogramChart {...chartProps} data={previewData as PreviewData['histogram']} />;
            case 'treemap':
                return <TreeMapChart {...chartProps} data={previewData as PreviewData['treemap']} />;
            case 'radar':
                return <RadarChart {...chartProps} data={previewData as PreviewData['radar']} />;
            case 'bubble':
                return <BubbleChart {...chartProps} data={previewData as PreviewData['bubble']} />;
            case 'live':
                return <LineChart {...chartProps} data={previewData as PreviewData['live']} />;
            default:
                return null;
        }
    };

    const renderChart = (kpi: KpiData) => {
        const chartProps = {
            title: kpi.title,
            data: kpi.data
        };

        switch (kpi.chartType) {
            case 'line':
                return <LineChart {...chartProps} data={kpi.data as PreviewData['line']} />;
            case 'bar':
                return <BarChart {...chartProps} data={kpi.data as PreviewData['bar']} />;
            case 'pie':
                return <PieChart {...chartProps} data={kpi.data as PreviewData['pie']} />;
            case 'timeline':
                return <TimelineChart {...chartProps} data={kpi.data as PreviewData['timeline']} />;
            case 'boxplot':
                return <BoxPlotChart {...chartProps} data={kpi.data as PreviewData['boxplot']} />;
            case 'histogram':
                return <HistogramChart {...chartProps} data={kpi.data as PreviewData['histogram']} />;
            case 'treemap':
                return <TreeMapChart {...chartProps} data={kpi.data as PreviewData['treemap']} />;
            case 'radar':
                return <RadarChart {...chartProps} data={kpi.data as PreviewData['radar']} />;
            case 'bubble':
                return <BubbleChart {...chartProps} data={kpi.data as PreviewData['bubble']} />;
            case 'live':
                return <LineChart {...chartProps} data={kpi.data as PreviewData['live']} />;
            default:
                return null;
        }
    };

    const getCategoryIcon = (category: KpiData['category']) => {
        switch (category) {
            case 'basic':
                return <ChartBarIcon className="h-5 w-5" />;
            case 'trend':
                return <ArrowTrendingUpIcon className="h-5 w-5" />;
            case 'distribution':
                return <ChartBarSquareIcon className="h-5 w-5" />;
            case 'comparison':
                return <ChatBubbleLeftIcon className="h-5 w-5" />;
            case 'hierarchical':
                return <Squares2X2Icon className="h-5 w-5" />;
            case 'advanced':
                return <CircleStackIcon className="h-5 w-5" />;
            case 'realtime':
                return <ArrowPathIcon className="h-5 w-5" />;
            default:
                return <ChartBarIcon className="h-5 w-5" />;
        }
    };

    const getCategoryTitle = (category: KpiData['category']) => {
        switch (category) {
            case 'basic':
                return 'Graphiques de Base';
            case 'trend':
                return 'Tendances & Séries Temporelles';
            case 'distribution':
                return 'Distribution & Statistiques';
            case 'comparison':
                return 'Comparaisons & Relations';
            case 'hierarchical':
                return 'Hiérarchies & Structures';
            case 'advanced':
                return 'Graphiques Avancés';
            case 'realtime':
                return 'Données en Temps Réel';
            default:
                return 'Autres Graphiques';
        }
    };

    const categories: KpiData['category'][] = ['basic', 'trend', 'distribution', 'comparison', 'hierarchical', 'advanced', 'realtime'];

    const handleAddKpi = () => {
        if (selectedChart && kpiForm.title && kpiForm.description) {
            const previewData = getPreviewData(selectedChart);
            if (!previewData) return;

            const newKpi: KpiData = {
                id: Date.now().toString(),
                title: kpiForm.title,
                description: kpiForm.description,
                chartType: selectedChart,
                data: previewData,
                calculationMethod: 'percentage',
                dataSources: kpiForm.dataSources,
                formula: kpiForm.formula,
                category: 'basic'
            };
            setKpis(prev => [...prev, newKpi]);
            setShowAddModal(false);
            setSelectedChart(null);
            setKpiForm({
                title: '',
                description: '',
                dataSources: [],
                formula: ''
            });
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuration des KPIs</h2>
                        <p className="text-gray-600 dark:text-gray-400">Configurez et personnalisez vos indicateurs de performance</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors flex items-center space-x-2"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>Ajouter un KPI</span>
                </button>
            </div>

            {/* KPI Categories */}
            {categories.map((category) => {
                const categoryKpis = kpis.filter(kpi => kpi.category === category);
                if (categoryKpis.length === 0) return null;

                return (
                    <div key={category} className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                {getCategoryIcon(category)}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {getCategoryTitle(category)}
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {categoryKpis.map((kpi) => (
                                    <motion.div
                                        key={kpi.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{kpi.title}</h3>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{kpi.description}</p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => { }}
                                                        className="p-2 text-gray-500 hover:text-[#F28C38] transition-colors"
                                                        title="Modifier la formule"
                                                    >
                                                        <CalculatorIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setKpis(kpis.filter(k => k.id !== kpi.id))}
                                                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                                        title="Supprimer le KPI"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="h-[300px]">
                                                {renderChart(kpi)}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {kpi.dataSources.map((source, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                                    >
                                                        <ServerIcon className="h-3 w-3 mr-1" />
                                                        {source}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                );
            })}

            {/* Add KPI Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Ajouter un Nouveau KPI
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowAddModal(false);
                                            setSelectedChart(null);
                                            setKpiForm({
                                                title: '',
                                                description: '',
                                                dataSources: [],
                                                formula: ''
                                            });
                                        }}
                                        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <ChartSelector
                                        onSelect={(type) => setSelectedChart(type as ChartType)}
                                        selectedChart={selectedChart}
                                    />

                                    {selectedChart && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Titre du KPI
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={kpiForm.title}
                                                        onChange={(e) => setKpiForm(prev => ({ ...prev, title: e.target.value }))}
                                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-[#F28C38] focus:border-[#F28C38]"
                                                        placeholder="Ex: Efficacité des Documents"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Description
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={kpiForm.description}
                                                        onChange={(e) => setKpiForm(prev => ({ ...prev, description: e.target.value }))}
                                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-[#F28C38] focus:border-[#F28C38]"
                                                        placeholder="Ex: Suivi de la complétion des documents"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Sources de Données
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['Documents', 'Actions', 'Planning'].map((source) => (
                                                        <label
                                                            key={source}
                                                            className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={kpiForm.dataSources.includes(source)}
                                                                onChange={(e) => {
                                                                    setKpiForm(prev => ({
                                                                        ...prev,
                                                                        dataSources: e.target.checked
                                                                            ? [...prev.dataSources, source]
                                                                            : prev.dataSources.filter(s => s !== source)
                                                                    }));
                                                                }}
                                                                className="form-checkbox h-4 w-4 text-[#F28C38] rounded border-gray-300 focus:ring-[#F28C38]"
                                                            />
                                                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                                {source}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Formule de Calcul
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={kpiForm.formula}
                                                        onChange={(e) => setKpiForm(prev => ({ ...prev, formula: e.target.value }))}
                                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-[#F28C38] focus:border-[#F28C38]"
                                                        placeholder="Entrez votre formule (ex: (A + B) / C * 100)"
                                                    />
                                                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-[#F28C38]">
                                                        <InformationCircleIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                                    Aperçu
                                                </h4>
                                                <div className="h-[300px]">
                                                    {renderPreviewChart()}
                                                </div>
                                            </div>

                                            <div className="flex justify-end space-x-4">
                                                <button
                                                    onClick={() => {
                                                        setShowAddModal(false);
                                                        setSelectedChart(null);
                                                        setKpiForm({
                                                            title: '',
                                                            description: '',
                                                            dataSources: [],
                                                            formula: ''
                                                        });
                                                    }}
                                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    onClick={handleAddKpi}
                                                    disabled={!selectedChart || !kpiForm.title || !kpiForm.description}
                                                    className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Ajouter le KPI
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default KpiConfiguration; 