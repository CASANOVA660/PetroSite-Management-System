import React from 'react';
import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Title
);

interface SankeyNode {
    id: string;
    label: string;
    value: number;
    color?: string;
}

interface SankeyLink {
    source: string;
    target: string;
    value: number;
    color?: string;
}

interface SankeyDataPoint {
    x: number;
    y: number;
    value: number;
    label?: string;
    source?: string;
    target?: string;
    color?: string;
}

interface SankeyChartProps {
    title: string;
    nodes: SankeyNode[];
    links: SankeyLink[];
    height?: number;
    showLegend?: boolean;
    colorScale?: string[];
}

const SankeyChart: React.FC<SankeyChartProps> = ({
    title,
    nodes,
    links,
    height = 300,
    showLegend = true,
    colorScale = ['#ffeda0', '#feb24c', '#f03b20', '#bd0026', '#800026']
}) => {
    // Process data to create visualization
    const processData = () => {
        // Create node positions
        const nodePositions = new Map<string, { x: number; y: number }>();
        const nodeValues = new Map<string, number>();

        // Calculate node values and positions
        nodes.forEach((node, index) => {
            const incomingLinks = links.filter(link => link.target === node.id);
            const outgoingLinks = links.filter(link => link.source === node.id);
            const totalValue = Math.max(
                node.value,
                incomingLinks.reduce((sum, link) => sum + link.value, 0),
                outgoingLinks.reduce((sum, link) => sum + link.value, 0)
            );
            nodeValues.set(node.id, totalValue);

            // Position nodes in layers
            const layer = index % 3; // 3 layers for simplicity
            const layerPosition = Math.floor(index / 3);
            const totalInLayer = Math.ceil(nodes.length / 3);

            nodePositions.set(node.id, {
                x: layer * 0.5, // 0, 0.5, or 1
                y: (layerPosition + 0.5) / totalInLayer // Normalized position in layer
            });
        });

        // Create datasets for nodes and links
        const nodeDataset = {
            type: 'scatter' as const,
            label: 'Nodes',
            data: nodes.map(node => {
                const pos = nodePositions.get(node.id)!;
                return {
                    x: pos.x,
                    y: pos.y,
                    value: nodeValues.get(node.id),
                    label: node.label,
                    color: node.color || colorScale[nodes.indexOf(node) % colorScale.length]
                } as SankeyDataPoint;
            }),
            backgroundColor: nodes.map((_, index) =>
                colorScale[index % colorScale.length]
            ),
            pointRadius: 8,
            pointHoverRadius: 10
        };

        const linkDataset = {
            type: 'scatter' as const,
            label: 'Links',
            data: links.map(link => {
                const sourcePos = nodePositions.get(link.source)!;
                const targetPos = nodePositions.get(link.target)!;
                return {
                    x: (sourcePos.x + targetPos.x) / 2,
                    y: (sourcePos.y + targetPos.y) / 2,
                    value: link.value,
                    source: link.source,
                    target: link.target,
                    label: `${link.source} → ${link.target}`,
                    color: link.color || colorScale[links.indexOf(link) % colorScale.length]
                } as SankeyDataPoint;
            }),
            backgroundColor: links.map((_, index) =>
                colorScale[index % colorScale.length]
            ),
            pointRadius: 4,
            pointHoverRadius: 6
        };

        return {
            datasets: [nodeDataset, linkDataset]
        };
    };

    const chartData = processData();

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
                        const data = context.raw;
                        if (data.label) {
                            // Node tooltip
                            return `${data.label}: ${data.value}`;
                        } else {
                            // Link tooltip
                            const sourceNode = nodes.find(n => n.id === data.source);
                            const targetNode = nodes.find(n => n.id === data.target);
                            return `${sourceNode?.label} → ${targetNode?.label}: ${data.value}`;
                        }
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'linear' as const,
                min: -0.1,
                max: 1.1,
                display: false
            },
            y: {
                type: 'linear' as const,
                min: -0.1,
                max: 1.1,
                display: false
            }
        }
    };

    return (
        <div style={{ height: `${height}px` }}>
            <Scatter data={chartData} options={options} />
        </div>
    );
};

export default SankeyChart; 