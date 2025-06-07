const mongoose = require('mongoose');
const Kpi = require('../../../modules/kpis/kpi.model');

// Mock the KPI model functions
jest.mock('../../../modules/kpis/kpi.model', () => ({
    create: jest.fn(),
    find: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    findByIdAndDelete: jest.fn(),
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn()
}));

// Import the controller after mocking its dependencies
const {
    createKpi,
    getAllKpis,
    getKpiById,
    updateKpi,
    deleteKpi
} = require('../../../modules/kpis/kpi.controller');

// Mock request and response
const mockRequest = (body = {}, params = {}, query = {}) => ({
    body,
    params,
    query
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// Mock models that the KPI controller depends on
jest.mock('../../../modules/gestion-rh/models/employee.model');
jest.mock('../../../modules/equipment/models/equipment.model');
jest.mock('../../../modules/projects/models/Project');
jest.mock('../../../modules/users/models/User');
jest.mock('../../../modules/actions/models/globalAction.model');
jest.mock('../../../modules/documents/models/document.model');

describe.skip('KPI Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createKpi', () => {
        it('should create a KPI with valid data', async () => {
            const kpiData = {
                name: 'Test KPI',
                formula: 'count(project)',
                modules: ['project'],
                chartType: 'bar',
                createdBy: 'user-123',
                config: { displayTitle: true }
            };

            const mockKpi = {
                _id: 'kpi-123',
                ...kpiData
            };

            // Mock the create method to return our mock KPI
            Kpi.create.mockResolvedValue(mockKpi);

            const req = mockRequest(kpiData);
            const res = mockResponse();

            await createKpi(req, res);

            expect(Kpi.create).toHaveBeenCalledWith(kpiData);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockKpi
            });
        });

        it('should handle errors when creating a KPI', async () => {
            const kpiData = {
                name: 'Invalid KPI',
                // Missing required fields
            };

            const error = new Error('Validation error');
            Kpi.create.mockRejectedValue(error);

            const req = mockRequest(kpiData);
            const res = mockResponse();

            await createKpi(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: error.message
            });
        });
    });

    describe('getAllKpis', () => {
        it('should return all KPIs', async () => {
            const mockKpis = [
                { _id: 'kpi-1', name: 'KPI 1', formula: 'count(project)' },
                { _id: 'kpi-2', name: 'KPI 2', formula: 'count(employee)' }
            ];

            Kpi.exec.mockResolvedValue(mockKpis);

            const req = mockRequest();
            const res = mockResponse();

            await getAllKpis(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: mockKpis.length,
                data: mockKpis
            });
        });

        it('should handle errors when fetching KPIs', async () => {
            const error = new Error('Database error');
            Kpi.exec.mockRejectedValue(error);

            const req = mockRequest();
            const res = mockResponse();

            await getAllKpis(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: error.message
            });
        });
    });

    describe('getKpiById', () => {
        it('should return a KPI by ID', async () => {
            const mockKpi = {
                _id: 'kpi-123',
                name: 'Test KPI',
                formula: 'count(project)'
            };

            Kpi.exec.mockResolvedValue(mockKpi);

            const req = mockRequest({}, { id: 'kpi-123' });
            const res = mockResponse();

            await getKpiById(req, res);

            expect(Kpi.findById).toHaveBeenCalledWith('kpi-123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockKpi
            });
        });

        it('should return 404 if KPI not found', async () => {
            Kpi.exec.mockResolvedValue(null);

            const req = mockRequest({}, { id: 'nonexistent-kpi' });
            const res = mockResponse();

            await getKpiById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'KPI not found'
            });
        });
    });

    describe('updateKpi', () => {
        it('should update a KPI with valid data', async () => {
            const kpiId = 'kpi-123';
            const updateData = {
                name: 'Updated KPI',
                chartType: 'line'
            };

            const updatedKpi = {
                _id: kpiId,
                name: 'Updated KPI',
                formula: 'count(project)',
                chartType: 'line'
            };

            Kpi.exec.mockResolvedValue(updatedKpi);

            const req = mockRequest(updateData, { id: kpiId });
            const res = mockResponse();

            await updateKpi(req, res);

            expect(Kpi.findByIdAndUpdate).toHaveBeenCalledWith(
                kpiId,
                updateData,
                { new: true, runValidators: true }
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: updatedKpi
            });
        });

        it('should return 404 if KPI to update not found', async () => {
            Kpi.exec.mockResolvedValue(null);

            const req = mockRequest({ name: 'Updated KPI' }, { id: 'nonexistent-kpi' });
            const res = mockResponse();

            await updateKpi(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'KPI not found'
            });
        });
    });

    describe('deleteKpi', () => {
        it('should delete a KPI', async () => {
            const kpiId = 'kpi-123';

            Kpi.findByIdAndDelete.mockResolvedValue({
                _id: kpiId,
                name: 'KPI to delete'
            });

            const req = mockRequest({}, { id: kpiId });
            const res = mockResponse();

            await deleteKpi(req, res);

            expect(Kpi.findByIdAndDelete).toHaveBeenCalledWith(kpiId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {}
            });
        });

        it('should return 404 if KPI to delete not found', async () => {
            Kpi.findByIdAndDelete.mockResolvedValue(null);

            const req = mockRequest({}, { id: 'nonexistent-kpi' });
            const res = mockResponse();

            await deleteKpi(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'KPI not found'
            });
        });
    });
}); 