import React from 'react';

interface ChartTypeOption {
    id: string;
    name: string;
    icon?: React.ReactNode;
}

interface AxisOption {
    id: string;
    label: string;
}

interface ChartCustomizerProps {
    chartType: string;
    onChartTypeChange: (type: string) => void;
    chartTypeOptions: ChartTypeOption[];
    xAxis: string;
    yAxis: string;
    onXAxisChange: (id: string) => void;
    onYAxisChange: (id: string) => void;
    axisOptions: AxisOption[];
    legend: string[];
    onLegendChange: (legend: string[]) => void;
    colorMap: Record<string, string>;
    onColorChange: (key: string, color: string) => void;
    children?: React.ReactNode; // For live preview
}

const ChartCustomizer: React.FC<ChartCustomizerProps> = ({
    chartType,
    onChartTypeChange,
    chartTypeOptions,
    xAxis,
    yAxis,
    onXAxisChange,
    onYAxisChange,
    axisOptions,
    legend,
    onLegendChange,
    colorMap,
    onColorChange,
    children
}) => {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold mb-2">Type de graphique</h2>
                <div className="flex flex-wrap gap-2 mb-2">
                    {chartTypeOptions.map(opt => (
                        <button
                            key={opt.id}
                            className={`px-3 py-1 rounded border ${chartType === opt.id ? 'border-[#F28C38] bg-[#F28C38]/10' : 'border-gray-200 dark:border-gray-700 hover:border-[#F28C38]/50'}`}
                            onClick={() => onChartTypeChange(opt.id)}
                            type="button"
                        >
                            {opt.icon && <span className="mr-2">{opt.icon}</span>}
                            {opt.name}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Axe X</label>
                    <select
                        className="w-full p-2 border rounded"
                        value={xAxis}
                        onChange={e => onXAxisChange(e.target.value)}
                    >
                        <option value="">Aucun</option>
                        {axisOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Axe Y</label>
                    <select
                        className="w-full p-2 border rounded"
                        value={yAxis}
                        onChange={e => onYAxisChange(e.target.value)}
                    >
                        <option value="">Aucun</option>
                        {axisOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Légende</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {legend.map((item, idx) => (
                        <div key={item} className="flex items-center gap-2">
                            <input
                                className="border rounded px-2 py-1"
                                value={item}
                                onChange={e => {
                                    const newLegend = [...legend];
                                    newLegend[idx] = e.target.value;
                                    onLegendChange(newLegend);
                                }}
                            />
                            <input
                                type="color"
                                value={colorMap[item] || '#F28C38'}
                                onChange={e => onColorChange(item, e.target.value)}
                                className="w-6 h-6 border-0"
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-md font-semibold mb-2">Aperçu du graphique</h3>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ChartCustomizer; 