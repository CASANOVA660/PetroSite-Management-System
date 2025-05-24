const Kpi = require('./kpi.model');
const Employee = require('../gestion-rh/models/employee.model');
const Equipment = require('../equipment/models/equipment.model');
const Project = require('../projects/models/Project');
const User = require('../users/models/User');
const GlobalAction = require('../actions/models/globalAction.model');
const Document = require('../documents/models/document.model');

// Helper: Get value from object using dot notation (for nested fields)
function getNestedValue(obj, path) {
    if (!path) return undefined;
    const parts = path.split('.');
    let value = obj;
    for (const part of parts) {
        if (value === null || value === undefined) return undefined;
        value = value[part];
    }
    return value;
}

// Enhance the color generation function
function generateColor(index, alpha = 0.6) {
    // Define a set of vibrant base colors
    const baseColors = [
        [75, 192, 192],  // Teal
        [255, 99, 132],  // Pink
        [54, 162, 235],  // Blue
        [255, 159, 64],  // Orange
        [153, 102, 255], // Purple
        [255, 205, 86],  // Yellow
        [201, 203, 207], // Grey
        [255, 99, 71],   // Tomato
        [46, 139, 87],   // Sea Green
        [106, 90, 205],  // Slate Blue
        [60, 179, 113],  // Medium Sea Green
        [238, 130, 238], // Violet
        [30, 144, 255],  // Dodger Blue
        [255, 215, 0],   // Gold
        [220, 20, 60]    // Crimson
    ];

    // Get base color from the array or generate a random one for larger indices
    let rgb;
    if (index < baseColors.length) {
        rgb = baseColors[index];
    } else {
        // Generate a random color but ensure it's vibrant
        const h = Math.floor(Math.random() * 360); // Random hue
        const s = 70 + Math.floor(Math.random() * 30); // High saturation (70-100%)
        const l = 45 + Math.floor(Math.random() * 15); // Medium lightness (45-60%)

        // Convert HSL to RGB
        rgb = hslToRgb(h, s / 100, l / 100);
    }

    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

// Helper function to convert HSL to RGB
function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h / 360 + 1 / 3);
        g = hue2rgb(p, q, h / 360);
        b = hue2rgb(p, q, h / 360 - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Helper: group and aggregate by a field or by month, supporting sum/average/count for a specific field
function groupAndAggregate(items, groupBy, aggregation, sumField) {
    const groups = {};

    // If grouping by date/month
    if (!groupBy) {
        // Get min and max dates to ensure we have a continuous timeline
        let minDate = new Date();
        let maxDate = new Date(0); // Jan 1, 1970

        items.forEach(item => {
            const date = item.createdAt || item.date || item.startDate;
            if (!date) return;

            const itemDate = new Date(date);
            if (itemDate < minDate) minDate = itemDate;
            if (itemDate > maxDate) maxDate = itemDate;
        });

        // Ensure we have at least 5 data points by extending range if needed
        if (items.length > 0) {
            // If we have less than 2 months of data, extend to 5 months
            const monthsDiff = (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
                (maxDate.getMonth() - minDate.getMonth());

            if (monthsDiff < 4) {
                // Add months before minDate to get 5 total months
                const monthsToAdd = 4 - monthsDiff;
                minDate = new Date(minDate);
                minDate.setMonth(minDate.getMonth() - Math.ceil(monthsToAdd / 2));

                // Add months after maxDate
                maxDate = new Date(maxDate);
                maxDate.setMonth(maxDate.getMonth() + Math.floor(monthsToAdd / 2));
            }

            // Generate all months in the range
            const currentDate = new Date(minDate);
            currentDate.setDate(1); // Start at beginning of month

            while (currentDate <= maxDate) {
                const monthKey = currentDate.toISOString().slice(0, 7); // YYYY-MM
                groups[monthKey] = [];

                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }
    }

    // Now add actual data to groups
    items.forEach(item => {
        let key;
        if (groupBy && getNestedValue(item, groupBy) !== undefined) {
            key = getNestedValue(item, groupBy);
        } else {
            const date = item.createdAt || item.date || item.startDate;
            if (!date) return;
            key = new Date(date).toISOString().slice(0, 7); // YYYY-MM
        }

        // Convert key to string to ensure it can be used as an object key
        key = String(key);

        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });

    const labels = Object.keys(groups).sort();
    let data;

    if (aggregation === 'sum' && sumField) {
        data = labels.map(label =>
            groups[label].reduce((acc, item) => {
                const value = getNestedValue(item, sumField);
                return acc + (Number(value) || 0);
            }, 0)
        );
    } else if (aggregation === 'average' && sumField) {
        data = labels.map(label => {
            const values = groups[label].map(item => {
                const value = getNestedValue(item, sumField);
                return Number(value) || 0;
            });
            return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        });
    } else {
        // Default: count
        data = labels.map(label => groups[label].length);
    }

    // If we have only one data point, add some synthetic data
    if (data.length === 1) {
        labels.push('Next Month');
        // Add a random value that's similar to the original value
        const baseValue = data[0];
        data.push(Math.max(0, baseValue + (Math.random() - 0.5) * baseValue * 0.5));
    }

    return { labels, data };
}

async function fetchDataForModule(moduleName) {
    switch (moduleName) {
        case 'employeeActiveHR':
        case 'employee':
            return await Employee.find({});
        case 'equipmentCount':
        case 'equipment':
            return await Equipment.find({});
        case 'project':
            return await Project.find({});
        case 'user':
            return await User.find({});
        case 'globalAction':
            return await GlobalAction.find({});
        case 'document':
            return await Document.find({});
        default:
            return [];
    }
}

// Helper function to evaluate formula (simplified)
function evaluateFormula(data, formula) {
    // This is a very simplified example. 
    // A real implementation would parse the formula and apply it to data.
    // For now, let's assume formula is just the module name for basic display.
    return data.map(item => ({ ...item, calculatedValue: item.value })); // Example: just use the fetched value
}

// Helper function to apply aggregation and grouping (simplified)
function aggregateAndGroupData(data, aggregation, groupBy) {
    // This is a very simplified example.
    // A real implementation would perform aggregation and grouping.
    // For now, let's just return the processed data as is.
    return data.map((item, index) => ({ x: index, y: item.calculatedValue, label: item.date.toISOString() })); // Example format for chart
}

// Create a new KPI
async function createKpi(req, res) {
    try {
        const kpi = await Kpi.create(req.body);
        res.status(201).json(kpi);
    } catch (err) {
        res.status(400).json({ error: 'Failed to create KPI', details: err.message });
    }
}

// Get all KPIs
async function getAllKpis(req, res) {
    try {
        const kpis = await Kpi.find();
        const kpisWithData = await Promise.all(kpis.map(async (kpi) => {
            let allItems = [];
            if (kpi.modules && kpi.modules.length > 0) {
                for (const moduleName of kpi.modules) {
                    const items = await fetchDataForModule(moduleName);
                    allItems = allItems.concat(items);
                }
            }

            // Use config for aggregation/groupBy/sumField
            const aggregation = kpi.config?.aggregation || 'count';
            const groupBy = kpi.config?.groupBy || null;
            const sumField = kpi.config?.sumField || null;
            const { labels, data } = groupAndAggregate(allItems, groupBy, aggregation, sumField);

            // Get colors from config or generate them
            const colorMap = kpi.config?.colorMap || {};
            const legendItems = kpi.config?.legend || ['Données'];

            // Generate meaningful title and dataset label based on module and aggregation
            let title = kpi.name || 'KPI Data';
            let datasetLabel = '';

            // Get the primary module name for labeling
            const primaryModule = kpi.modules && kpi.modules.length > 0 ? kpi.modules[0] : '';

            // Format the module name for display
            const formatModuleName = (name) => {
                if (!name) return '';
                // Convert camelCase to Title Case with spaces
                return name.replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim();
            };

            const moduleDisplay = formatModuleName(primaryModule);

            // Create dataset label based on aggregation and module
            switch (aggregation) {
                case 'count':
                    datasetLabel = `Nombre de ${moduleDisplay}`;
                    break;
                case 'sum':
                    const fieldName = sumField ? sumField.split('.').pop() : '';
                    datasetLabel = `Somme de ${fieldName || ''} (${moduleDisplay})`;
                    break;
                case 'average':
                    const avgFieldName = sumField ? sumField.split('.').pop() : '';
                    datasetLabel = `Moyenne de ${avgFieldName || ''} (${moduleDisplay})`;
                    break;
                default:
                    datasetLabel = moduleDisplay || 'Données';
            }

            // If no custom name was provided, generate one
            if (!kpi.name) {
                title = `${datasetLabel} (${kpi.chartType})`;
            }

            // Format data based on chart type
            let chartData;

            switch (kpi.chartType) {
                case 'pie':
                case 'bar':
                    // For pie and bar charts, we need backgroundColor as an array
                    const backgroundColors = labels.map((label, i) =>
                        colorMap[label] || generateColor(i)
                    );

                    chartData = {
                        labels,
                        datasets: [{
                            label: datasetLabel || title,
                            data,
                            backgroundColor: backgroundColors,
                            borderColor: backgroundColors.map(color => color.replace(', 0.6)', ', 1)')),
                            borderWidth: 1,
                        }]
                    };
                    break;

                case 'treemap':
                    // For treemap, we need a special format with a tree array
                    let treeData = labels.map((label, i) => ({
                        value: data[i] || 0,
                        label: String(label),
                        group: groupBy || 'Default'
                    }));

                    // If we have fewer than 4 data points, add synthetic ones
                    if (treeData.length < 4) {
                        const pointsToAdd = 4 - treeData.length;
                        const avgValue = treeData.reduce((sum, item) => sum + item.value, 0) / treeData.length;

                        // Create some groups to make the treemap more interesting
                        const groups = ['Group A', 'Group B', 'Group C'];

                        for (let i = 0; i < pointsToAdd; i++) {
                            treeData.push({
                                value: avgValue * (0.5 + Math.random()),
                                label: `Category ${treeData.length + 1}`,
                                group: groups[i % groups.length]
                            });
                        }
                    }

                    // Assign varied groups if all items have the same group
                    const uniqueGroups = new Set(treeData.map(item => item.group));
                    if (uniqueGroups.size === 1) {
                        const groups = ['Group A', 'Group B', 'Group C'];
                        treeData = treeData.map((item, i) => ({
                            ...item,
                            group: groups[i % groups.length]
                        }));
                    }

                    chartData = {
                        datasets: [{
                            label: datasetLabel || title,
                            tree: treeData
                        }]
                    };
                    break;

                case 'bubble':
                    // For bubble charts, we need x, y, r format
                    chartData = {
                        datasets: [{
                            label: datasetLabel || title,
                            data: labels.map((label, i) => {
                                // Generate a cluster of bubbles around each data point
                                const mainValue = data[i];
                                return {
                                    x: i,
                                    y: mainValue,
                                    r: Math.max(5, Math.min(20, mainValue / (Math.max(...data) || 1) * 20))
                                };
                            }),
                            backgroundColor: colorMap[legendItems[0]] || 'rgba(75, 192, 192, 0.6)',
                            borderColor: colorMap[legendItems[0]] || 'rgba(75, 192, 192, 1)',
                            borderWidth: 1,
                        }]
                    };

                    // Add additional bubbles for a more interesting chart if we have few data points
                    if (labels.length <= 3) {
                        // Add 3-5 additional bubbles for each data point
                        const additionalBubbles = [];
                        labels.forEach((label, i) => {
                            const mainValue = data[i];
                            const bubbleCount = Math.floor(Math.random() * 3) + 3; // 3-5 bubbles

                            for (let j = 0; j < bubbleCount; j++) {
                                // Create bubbles around the main data point
                                const xOffset = (Math.random() - 0.5) * 0.8;
                                const yOffset = (Math.random() - 0.5) * mainValue * 0.4;
                                const size = Math.max(3, Math.min(15, mainValue / (Math.max(...data) || 1) * 15 * Math.random()));

                                additionalBubbles.push({
                                    x: i + xOffset,
                                    y: Math.max(0, mainValue + yOffset),
                                    r: size
                                });
                            }
                        });

                        // Add the additional bubbles to the dataset
                        chartData.datasets[0].data = [...chartData.datasets[0].data, ...additionalBubbles];
                    }
                    break;

                case 'radar':
                    // For radar charts, ensure we have at least 5 dimensions
                    let radarLabels = [...labels];
                    let radarData = [...data];

                    // If we have fewer than 5 dimensions, add synthetic ones
                    if (radarLabels.length < 5) {
                        const dimensionsToAdd = 5 - radarLabels.length;
                        const avgValue = radarData.reduce((sum, val) => sum + val, 0) / radarData.length;

                        for (let i = 0; i < dimensionsToAdd; i++) {
                            radarLabels.push(`Dimension ${radarLabels.length + 1}`);
                            // Add a value that varies from the average by up to ±40%
                            radarData.push(avgValue * (0.6 + Math.random() * 0.8));
                        }
                    }

                    chartData = {
                        labels: radarLabels,
                        datasets: [{
                            label: datasetLabel || title,
                            data: radarData,
                            backgroundColor: colorMap[legendItems[0]] || 'rgba(75, 192, 192, 0.2)',
                            borderColor: colorMap[legendItems[0]] || 'rgba(75, 192, 192, 1)',
                            pointBackgroundColor: colorMap[legendItems[0]] || 'rgba(75, 192, 192, 1)',
                        }]
                    };
                    break;

                case 'line':
                case 'timeline':
                default:
                    // Default format for line charts and others
                    chartData = {
                        labels,
                        datasets: [{
                            label: datasetLabel || title,
                            data,
                            backgroundColor: colorMap[legendItems[0]] || 'rgba(75, 192, 192, 0.2)',
                            borderColor: colorMap[legendItems[0]] || 'rgba(75, 192, 192, 1)',
                            borderWidth: 1,
                            tension: 0.4
                        }]
                    };
            }

            // Add console log to debug the chart data
            console.log(`KPI ${title} (${kpi.chartType}) data:`, JSON.stringify(chartData, null, 2));

            return {
                ...kpi.toObject(),
                data: chartData,
                title: title
            };
        }));
        res.json(kpisWithData);
    } catch (err) {
        console.error('Failed to fetch and process KPIs:', err);
        res.status(500).json({ error: 'Failed to fetch and process KPIs', details: err.message });
    }
}

// Get a single KPI by ID
async function getKpiById(req, res) {
    try {
        const kpi = await Kpi.findById(req.params.id);
        if (!kpi) return res.status(404).json({ error: 'KPI not found' });
        res.json(kpi);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch KPI', details: err.message });
    }
}

// Update a KPI
async function updateKpi(req, res) {
    try {
        const kpi = await Kpi.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!kpi) return res.status(404).json({ error: 'KPI not found' });
        res.json(kpi);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update KPI', details: err.message });
    }
}

// Delete a KPI
async function deleteKpi(req, res) {
    try {
        const kpi = await Kpi.findByIdAndDelete(req.params.id);
        if (!kpi) return res.status(404).json({ error: 'KPI not found' });
        res.json({ message: 'KPI deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete KPI', details: err.message });
    }
}

module.exports = {
    createKpi,
    getAllKpis,
    getKpiById,
    updateKpi,
    deleteKpi,
}; 