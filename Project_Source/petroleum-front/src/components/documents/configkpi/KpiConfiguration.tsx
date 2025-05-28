import React, { useEffect, useState } from 'react';
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
import DataSourcePicker from './DataSourcePicker';
import FormulaBuilder from './FormulaBuilder';
import AggregationSelector from './AggregationSelector';
import ChartCustomizer from './ChartCustomizer';
import ChartPreview from './ChartPreview';
import { useSelector, useDispatch } from 'react-redux';
import { fetchKpis, fetchKpiFields, createKpi, updateKpi, deleteKpi } from '../../../store/slices/kpisSlice';
import { useAppDispatch } from '../../../store';
import { getPreviewData } from './getPreviewData';
import { ChartType, PreviewData } from './types';

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

const KPI_STEPS = [
    'chartType',
    'dataSource',
    'formula',
    'aggregation',
    'customize',
];

interface KpiConfigurationProps {
    projectId: string;
}

const KpiConfiguration: React.FC<KpiConfigurationProps> = ({ projectId }) => {
    const dispatch = useAppDispatch();
    const { kpis, fields, loading, error } = useSelector((state: any) => state.kpis);

    const [showAddModal, setShowAddModal] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);
    const [selectedChart, setSelectedChart] = useState('line');
    const [dataSources, setDataSources] = useState<string[]>([]);
    const [formula, setFormula] = useState('');
    const [aggregation, setAggregation] = useState('sum');
    const [groupBy, setGroupBy] = useState('');
    const [xAxis, setXAxis] = useState('');
    const [yAxis, setYAxis] = useState('');
    const [legend, setLegend] = useState<string[]>(['Série 1']);
    const [colorMap, setColorMap] = useState<Record<string, string>>({ 'Série 1': '#F28C38' });

    useEffect(() => {
        dispatch(fetchKpiFields());
        dispatch(fetchKpis());
    }, [dispatch]);

    useEffect(() => {
        if (!showAddModal) {
            dispatch(fetchKpis());
        }
    }, [showAddModal, dispatch]);

    // Sample data for preview (should be replaced with real data logic)
    const sampleData = fields.reduce((acc: any, field: any) => {
        acc[field.id] = field.sampleValue || 1;
        return acc;
    }, {});

    // Build chart data for preview (simplified, should be dynamic)
    const previewChartData = {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
        datasets: [
            {
                label: legend[0],
                data: [65, 78, 90, 85, 95, 100],
                backgroundColor: colorMap[legend[0]] || '#F28C38',
                borderColor: colorMap[legend[0]] || '#F28C38',
            },
        ],
    };

    // Handle KPI creation
    const handleSaveKpi = async () => {
        // Reset modal state first for better responsiveness
        setShowAddModal(false);
        setWizardStep(0);
        setDataSources([]);
        setFormula('');
        setAggregation('sum');
        setGroupBy('');
        setSelectedChart('line');
        setXAxis('');
        setYAxis('');
        setLegend(['Série 1']);
        setColorMap({ 'Série 1': '#F28C38' });

        // Dispatch create KPI and await completion
        const resultAction = await dispatch(createKpi({
            name: 'KPI personnalisé', // Consider adding a name input in the wizard
            formula,
            modules: dataSources,
            chartType: selectedChart,
            config: {
                aggregation,
                groupBy,
                xAxis,
                yAxis,
                legend,
                colorMap,
                sumField: xAxis // Use xAxis as the sumField for aggregation
            },
            // Ensure category is included
            category: selectedChart === 'line' || selectedChart === 'bar' || selectedChart === 'pie' ? 'basic' :
                selectedChart === 'timeline' ? 'trend' :
                    selectedChart === 'boxplot' || selectedChart === 'histogram' ? 'distribution' :
                        selectedChart === 'treemap' ? 'hierarchical' :
                            selectedChart === 'radar' || selectedChart === 'bubble' ? 'advanced' :
                                selectedChart === 'live' ? 'realtime' :
                                    'basic', // Fallback to basic if category is not explicitly determined
        }) as any);

        // Explicitly fetch KPIs after creation
        dispatch(fetchKpis());
    };

    const renderPreviewChart = () => {
        if (!selectedChart) return null;
        const previewData = getPreviewData(selectedChart as ChartType);
        if (!previewData) return null;

        const chartProps = {
            title: "Aperçu",
            data: previewData
        };

        switch (selectedChart) {
            case 'line':
                return <LineChart {...chartProps} />;
            case 'bar':
                return <BarChart {...chartProps} />;
            case 'pie':
                return <PieChart {...chartProps} />;
            case 'timeline':
                return <TimelineChart {...chartProps} />;
            case 'boxplot':
                return <BoxPlotChart {...chartProps} />;
            case 'histogram':
                return <HistogramChart {...chartProps} />;
            case 'treemap':
                return <TreeMapChart {...chartProps} />;
            case 'radar':
                return <RadarChart {...chartProps} />;
            case 'bubble':
                return <BubbleChart {...chartProps} />;
            case 'live':
                return <LineChart {...chartProps} />;
            default:
                return null;
        }
    };

    const renderChart = (kpi: any) => {
        // Add check for valid data before rendering the chart
        if (!kpi || !kpi.data || typeof kpi.data !== 'object' || !Array.isArray(kpi.data.datasets) || (kpi.chartType !== 'treemap' && kpi.chartType !== 'bubble' && !Array.isArray(kpi.data.labels))) {
            // Render a fallback if data is missing or invalid
            return (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    Données du graphique non disponibles ou invalides pour ce KPI.
                </div>
            );
        }

        const chartProps = {
            title: kpi.title || kpi.name || 'KPI Data',
            data: kpi.data,
            height: 300
        };

        switch (kpi.chartType) {
            case 'line':
                return <LineChart {...chartProps} />;
            case 'bar':
                return <BarChart {...chartProps} />;
            case 'pie':
                return <PieChart {...chartProps} />;
            case 'timeline':
                return <TimelineChart {...chartProps} />;
            case 'boxplot':
                return <BoxPlotChart {...chartProps} />;
            case 'histogram':
                return <HistogramChart {...chartProps} />;
            case 'treemap':
                return <TreeMapChart {...chartProps} />;
            case 'radar':
                return <RadarChart {...chartProps} />;
            case 'bubble':
                return <BubbleChart {...chartProps} />;
            case 'live':
                return <LineChart {...chartProps} />;
            default:
                return null;
        }
    };

    const getCategoryIcon = (category: any) => {
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

    const getCategoryTitle = (category: any) => {
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

    const categories: any[] = ['basic', 'trend', 'distribution', 'comparison', 'hierarchical', 'advanced', 'realtime'];

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
            {Array.isArray(kpis) && categories.map((category) => {
                const categoryKpis = (kpis as any[]).filter((kpi: any) => (kpi.category || 'basic') === category);
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
                                {categoryKpis.map((kpi: any) => (
                                    <motion.div
                                        key={kpi._id}
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
                                                        onClick={() => { /* TODO: Add Edit Logic */ }}
                                                        className="p-2 text-gray-500 hover:text-[#F28C38] transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <CalculatorIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => dispatch(deleteKpi(kpi._id) as any)}
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
                                                {(kpi.dataSources || []).map((source: string, index: number) => (
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
                                            // State reset is now in handleSaveKpi and modal close handler
                                        }}
                                        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    {wizardStep === 0 && (
                                        <ChartSelector onSelect={(type: string) => setSelectedChart(type as ChartType)} selectedChart={selectedChart as ChartType} />
                                    )}
                                    {wizardStep === 1 && (
                                        <DataSourcePicker options={fields as any[]} selected={dataSources} onChange={setDataSources} />
                                    )}
                                    {wizardStep === 2 && (
                                        <FormulaBuilder
                                            fields={fields as any[]}
                                            formula={formula}
                                            onChange={setFormula}
                                            sampleData={sampleData}
                                        />
                                    )}
                                    {wizardStep === 3 && (
                                        <AggregationSelector aggregation={aggregation} onChange={setAggregation} groupBy={groupBy} onGroupByChange={setGroupBy} groupByOptions={(fields as any[]).map((f: any, _i: number) => ({ id: f.id, label: f.label }))} />
                                    )}
                                    {wizardStep === 4 && (
                                        <ChartCustomizer chartType={selectedChart as ChartType} onChartTypeChange={(type: string) => setSelectedChart(type as ChartType)} chartTypeOptions={[]} xAxis={xAxis} yAxis={yAxis} onXAxisChange={setXAxis} onYAxisChange={setYAxis} axisOptions={(fields as any[]).map((f: any, _i: number) => ({ id: f.id, label: f.label }))} legend={legend} onLegendChange={setLegend} colorMap={colorMap} onColorChange={(key: string, color: string) => setColorMap({ ...colorMap, [key]: color })}>
                                            <ChartPreview chartType={selectedChart as ChartType} data={previewChartData} />
                                        </ChartCustomizer>
                                    )}
                                    <div className="flex justify-between mt-8">
                                        <button
                                            className="px-4 py-2 rounded border"
                                            onClick={() => setWizardStep(Math.max(0, wizardStep - 1))}
                                            disabled={wizardStep === 0}
                                        >
                                            Précédent
                                        </button>
                                        {wizardStep < 4 ? (
                                            <button
                                                className="px-4 py-2 rounded bg-[#F28C38] text-white"
                                                onClick={() => setWizardStep(wizardStep + 1)}
                                            >
                                                Suivant
                                            </button>
                                        ) : (
                                            <button
                                                className="px-4 py-2 rounded bg-[#F28C38] text-white"
                                                onClick={handleSaveKpi}
                                            >
                                                Enregistrer le KPI
                                            </button>
                                        )}
                                    </div>
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