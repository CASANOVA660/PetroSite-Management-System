const mongoose = require('mongoose');
const Kpi = require('../../../modules/kpis/kpi.model');

describe('KPI Model', () => {
    let validKpiData;

    beforeEach(() => {
        validKpiData = {
            name: 'Project Completion Rate',
            formula: 'count(project.status==="Clôturé")/count(project)',
            modules: ['project'],
            chartType: 'pie',
            createdBy: 'user-123',
            config: {
                displayTitle: true,
                colors: ['#FF6384', '#36A2EB', '#FFCE56']
            },
            category: 'project'
        };
    });

    it('should create a KPI with valid data', async () => {
        const kpi = await Kpi.create(validKpiData);

        expect(kpi).toBeDefined();
        expect(kpi.name).toBe(validKpiData.name);
        expect(kpi.formula).toBe(validKpiData.formula);
        expect(kpi.modules).toEqual(validKpiData.modules);
        expect(kpi.chartType).toBe(validKpiData.chartType);
        expect(kpi.createdBy).toBe(validKpiData.createdBy);
        expect(kpi.config).toEqual(validKpiData.config);
        expect(kpi.category).toBe(validKpiData.category);
    });

    it('should require mandatory fields', async () => {
        const requiredFields = ['name', 'formula'];

        for (const field of requiredFields) {
            const invalidData = { ...validKpiData };
            delete invalidData[field];

            try {
                await Kpi.create(invalidData);
                fail(`Expected validation error for missing ${field}`);
            } catch (error) {
                expect(error).toBeDefined();
            }
        }
    });

    it('should have default category if not provided', async () => {
        const kpiWithoutCategory = { ...validKpiData };
        delete kpiWithoutCategory.category;

        const kpi = await Kpi.create(kpiWithoutCategory);

        expect(kpi.category).toBe('basic');
    });

    it('should store modules array correctly', async () => {
        // Test with multiple modules
        const multiModuleKpi = {
            ...validKpiData,
            modules: ['project', 'employee', 'equipment']
        };

        const kpi = await Kpi.create(multiModuleKpi);

        expect(kpi.modules.length).toBe(3);
        expect(kpi.modules).toContain('project');
        expect(kpi.modules).toContain('employee');
        expect(kpi.modules).toContain('equipment');
    });

    it('should store chart configuration as an object', async () => {
        const complexConfig = {
            ...validKpiData,
            config: {
                displayTitle: true,
                displayLegend: true,
                colors: ['#FF6384', '#36A2EB', '#FFCE56'],
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: false
                        }
                    }
                }
            }
        };

        const kpi = await Kpi.create(complexConfig);

        expect(kpi.config).toEqual(complexConfig.config);
        expect(kpi.config.colors.length).toBe(3);
        expect(kpi.config.animation.duration).toBe(1000);
        expect(kpi.config.scales.y.beginAtZero).toBe(true);
    });

    it('should store timestamps', async () => {
        const kpi = await Kpi.create(validKpiData);

        expect(kpi.createdAt).toBeDefined();
        expect(kpi.updatedAt).toBeDefined();
    });
}); 