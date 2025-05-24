import React from 'react';

interface ChartPreviewProps {
    chartType: string;
    data: any;
    options?: any;
}

// Import chart components
import LineChart from './charts/basic/LineChart';
import BarChart from './charts/basic/BarChart';
import PieChart from './charts/basic/PieChart';
import TimelineChart from './charts/trend/TimelineChart';
import BoxPlotChart from './charts/distribution/BoxPlotChart';
import HistogramChart from './charts/distribution/HistogramChart';
import TreeMapChart from './charts/hierarchical/TreeMapChart';
import RadarChart from './charts/advanced/RadarChart';
import BubbleChart from './charts/advanced/BubbleChart';
import LiveChart from './charts/advanced/LiveChart';

const ChartPreview: React.FC<ChartPreviewProps> = ({ chartType, data, options }) => {
    // Ensure we have a title for all charts
    const chartProps = {
        title: 'Aperçu',
        data,
        ...options
    };

    switch (chartType) {
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
            return <LiveChart {...chartProps} />;
        default:
            return <div className="text-gray-500">Sélectionnez un type de graphique pour prévisualiser.</div>;
    }
};

export default ChartPreview; 