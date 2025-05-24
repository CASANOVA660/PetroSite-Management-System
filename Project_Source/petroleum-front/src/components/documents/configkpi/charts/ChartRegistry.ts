/**
 * Chart Registry
 * This file centralizes all Chart.js component registrations
 */

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Filler,
    Tooltip,
    Legend,
    Title,
    SubTitle,
    TimeScale,
    ChartOptions
} from 'chart.js';

// Register all components needed for our charts
ChartJS.register(
    // Scales
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    TimeScale,

    // Elements
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,

    // Plugins
    Tooltip,
    Legend,
    Title,
    SubTitle
);

// Set global default options
ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.color = '#6B7280';
ChartJS.defaults.borderColor = 'rgba(0, 0, 0, 0.1)';
ChartJS.defaults.elements.point.radius = 3;
ChartJS.defaults.elements.line.tension = 0.4;

// Export the registered Chart instance
export default ChartJS; 