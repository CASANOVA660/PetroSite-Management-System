import React from 'react';
import { motion } from 'framer-motion';
import {
    ChartBarIcon,
    ChartPieIcon,
    ArrowTrendingUpIcon,
    ChartBarSquareIcon,
    ClockIcon,
    DocumentChartBarIcon,
    PresentationChartLineIcon,
    PresentationChartBarIcon,
    ChatBubbleLeftIcon,
    ArrowPathIcon,
    CircleStackIcon,
    Squares2X2Icon,
    ChartBarIcon as BarIcon,
    ChartPieIcon as PieIcon,
    ArrowTrendingUpIcon as LineIcon,
    ClockIcon as TimelineIcon,
    DocumentChartBarIcon as BoxPlotIcon,
    PresentationChartBarIcon as HistogramIcon,
    ChartBarIcon as TreeMapIcon,
    ChartPieIcon as RadarIcon,
    ChartBarIcon as BubbleIcon,
    ArrowPathIcon as LiveIcon
} from '@heroicons/react/24/outline';

interface ChartType {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    category: 'basic' | 'trend' | 'distribution' | 'hierarchical' | 'advanced' | 'realtime';
    suitableFor: string[];
}

interface ChartSelectorProps {
    onSelect: (type: string) => void;
    selectedChart: string | null;
}

const chartTypes: ChartType[] = [
    // Basic Charts
    {
        id: 'line',
        name: 'Graphique en Ligne',
        description: 'Visualisation de tendances et de séries temporelles',
        icon: LineIcon,
        category: 'basic',
        suitableFor: ['Tendances', 'Séries temporelles', 'Comparaisons']
    },
    {
        id: 'bar',
        name: 'Graphique en Barres',
        description: 'Comparaison de valeurs entre différentes catégories',
        icon: BarIcon,
        category: 'basic',
        suitableFor: ['Comparaisons', 'Catégories', 'Rang']
    },
    {
        id: 'pie',
        name: 'Graphique en Secteurs',
        description: 'Répartition des proportions d\'un tout',
        icon: PieIcon,
        category: 'basic',
        suitableFor: ['Proportions', 'Pourcentages', 'Distribution']
    },
    // Trend & Time-Series Charts
    {
        id: 'timeline',
        name: 'Timeline',
        description: 'Visualisation d\'événements et de progression dans le temps',
        icon: TimelineIcon,
        category: 'trend',
        suitableFor: ['Événements', 'Progression', 'Chronologie']
    },
    // Distribution Charts
    {
        id: 'boxplot',
        name: 'Boîte à Moustaches',
        description: 'Analyse de la distribution statistique des données',
        icon: BoxPlotIcon,
        category: 'distribution',
        suitableFor: ['Distribution', 'Outliers', 'Statistiques']
    },
    {
        id: 'histogram',
        name: 'Histogramme',
        description: 'Distribution de fréquence des données',
        icon: HistogramIcon,
        category: 'distribution',
        suitableFor: ['Distribution', 'Fréquence', 'Analyse']
    },
    // Hierarchical Charts
    {
        id: 'treemap',
        name: 'Treemap',
        description: 'Visualisation hiérarchique des données',
        icon: TreeMapIcon,
        category: 'hierarchical',
        suitableFor: ['Hiérarchie', 'Proportions', 'Catégories']
    },
    // Advanced Charts
    {
        id: 'radar',
        name: 'Radar',
        description: 'Visualisation multi-dimensionnelle des données',
        icon: RadarIcon,
        category: 'advanced',
        suitableFor: ['Multi-dimensions', 'Comparaisons', 'Métriques']
    },
    {
        id: 'bubble',
        name: 'Bulles',
        description: 'Visualisation de données à trois dimensions',
        icon: BubbleIcon,
        category: 'advanced',
        suitableFor: ['Corrélations', 'Relations', 'Dimensions']
    },
    // Real-time Charts
    {
        id: 'live',
        name: 'Temps Réel',
        description: 'Visualisation de données en temps réel',
        icon: LiveIcon,
        category: 'realtime',
        suitableFor: ['Monitoring', 'Temps réel', 'Métriques']
    }
];

const ChartSelector: React.FC<ChartSelectorProps> = ({ onSelect, selectedChart }) => {
    const categories = ['basic', 'trend', 'distribution', 'hierarchical', 'advanced', 'realtime'] as const;

    const getCategoryTitle = (category: typeof categories[number]) => {
        switch (category) {
            case 'basic': return 'Graphiques de Base';
            case 'trend': return 'Tendances & Séries Temporelles';
            case 'distribution': return 'Distribution & Statistiques';
            case 'hierarchical': return 'Hiérarchies & Structures';
            case 'advanced': return 'Graphiques Avancés';
            case 'realtime': return 'Données en Temps Réel';
            default: return 'Autres Graphiques';
        }
    };

    return (
        <div className="space-y-6">
            {categories.map((category) => {
                const categoryCharts = chartTypes.filter(chart => chart.category === category);
                if (categoryCharts.length === 0) return null;

                return (
                    <div key={category} className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {getCategoryTitle(category)}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryCharts.map((chart) => (
                                <motion.button
                                    key={chart.id}
                                    onClick={() => onSelect(chart.id)}
                                    className={`p-4 rounded-lg border-2 transition-all ${selectedChart === chart.id
                                            ? 'border-[#F28C38] bg-[#F28C38]/5'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-[#F28C38]/50'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className={`p-2 rounded-lg ${selectedChart === chart.id
                                                ? 'bg-[#F28C38] text-white'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            }`}>
                                            <chart.icon className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                {chart.name}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {chart.description}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {chart.suitableFor.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ChartSelector; 