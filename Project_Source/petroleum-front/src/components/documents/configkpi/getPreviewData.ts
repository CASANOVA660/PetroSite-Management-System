import { ChartType, PreviewData } from './types';

/**
 * Generates preview data for different chart types
 * @param chartType The type of chart to generate data for
 * @returns Properly formatted data for the specified chart type
 */
export function getPreviewData(chartType: ChartType): any {
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
            };
        case 'bar':
            return {
                labels: ['Catégorie A', 'Catégorie B', 'Catégorie C', 'Catégorie D'],
                datasets: [{
                    label: 'Données Exemple',
                    data: [65, 45, 80, 55],
                    backgroundColor: ['#F28C38', '#10B981', '#3B82F6', '#6B7280'],
                }]
            };
        case 'pie':
            return {
                labels: ['Partie 1', 'Partie 2', 'Partie 3', 'Partie 4'],
                datasets: [{
                    label: 'Données Exemple',
                    data: [30, 25, 20, 25],
                    backgroundColor: ['#F28C38', '#10B981', '#3B82F6', '#6B7280'],
                }]
            };
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
            };
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
            };
        case 'histogram':
            return {
                labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
                datasets: [{
                    label: 'Distribution',
                    data: [10, 25, 45, 30, 15],
                    backgroundColor: '#F28C38',
                }]
            };
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
            };
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
            return {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
                datasets: [{
                    label: 'Données par défaut',
                    data: [30, 45, 60, 75, 85, 95],
                    borderColor: '#F28C38',
                    backgroundColor: 'rgba(242, 140, 56, 0.1)',
                }]
            };
    }
}

export default getPreviewData; 