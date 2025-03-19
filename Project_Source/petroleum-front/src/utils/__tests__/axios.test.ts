import axios from '../axios';
import { AxiosError, AxiosResponse } from 'axios';

interface ErrorResponse {
    message: string;
}

describe('axios', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    it('should have base URL configured', () => {
        expect(axios.defaults.baseURL).toBe('http://localhost:5000/api');
    });

    it('should add auth token to requests when available', () => {
        const token = 'mock-token';
        localStorage.setItem('token', token);

        // Recreate axios instance to pick up the token
        const axiosInstance = require('../axios').default;

        expect(axiosInstance.defaults.headers.common['Authorization']).toBe(`Bearer ${token}`);
    });

    it('should handle requests without auth token', () => {
        const axiosInstance = require('../axios').default;
        expect(axiosInstance.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('should handle response data', async () => {
        const mockData = { message: 'Success' };
        const mockResponse = { data: mockData };

        // Mock axios request
        jest.spyOn(axios, 'get').mockResolvedValueOnce(mockResponse);

        const response = await axios.get('/test');
        expect(response.data).toEqual(mockData);
    });

    it('should handle request errors', async () => {
        const errorMessage = 'Network Error';
        const mockError = new Error(errorMessage);

        // Mock axios request to fail
        jest.spyOn(axios, 'get').mockRejectedValueOnce(mockError);

        try {
            await axios.get('/test');
            fail('Should have thrown an error');
        } catch (error) {
            expect(error).toBe(mockError);
        }
    });

    it('should handle 401 unauthorized responses', async () => {
        const mockResponse: AxiosResponse<ErrorResponse> = {
            data: { message: 'Unauthorized' },
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            config: {} as any
        };

        const mockError: AxiosError<ErrorResponse> = {
            response: mockResponse,
            isAxiosError: true,
            toJSON: () => ({}),
            name: 'AxiosError',
            message: 'Unauthorized',
            config: {} as any
        };

        // Mock axios request to return 401
        jest.spyOn(axios, 'get').mockRejectedValueOnce(mockError);

        try {
            await axios.get('/test');
            fail('Should have thrown an error');
        } catch (error) {
            const axiosError = error as AxiosError<ErrorResponse>;
            expect(axiosError.response?.status).toBe(401);
            expect(axiosError.response?.data.message).toBe('Unauthorized');
        }
    });

    it('should handle 404 not found responses', async () => {
        const mockResponse: AxiosResponse<ErrorResponse> = {
            data: { message: 'Not Found' },
            status: 404,
            statusText: 'Not Found',
            headers: {},
            config: {} as any
        };

        const mockError: AxiosError<ErrorResponse> = {
            response: mockResponse,
            isAxiosError: true,
            toJSON: () => ({}),
            name: 'AxiosError',
            message: 'Not Found',
            config: {} as any
        };

        // Mock axios request to return 404
        jest.spyOn(axios, 'get').mockRejectedValueOnce(mockError);

        try {
            await axios.get('/test');
            fail('Should have thrown an error');
        } catch (error) {
            const axiosError = error as AxiosError<ErrorResponse>;
            expect(axiosError.response?.status).toBe(404);
            expect(axiosError.response?.data.message).toBe('Not Found');
        }
    });

    it('should handle 500 server error responses', async () => {
        const mockResponse: AxiosResponse<ErrorResponse> = {
            data: { message: 'Internal Server Error' },
            status: 500,
            statusText: 'Internal Server Error',
            headers: {},
            config: {} as any
        };

        const mockError: AxiosError<ErrorResponse> = {
            response: mockResponse,
            isAxiosError: true,
            toJSON: () => ({}),
            name: 'AxiosError',
            message: 'Internal Server Error',
            config: {} as any
        };

        // Mock axios request to return 500
        jest.spyOn(axios, 'get').mockRejectedValueOnce(mockError);

        try {
            await axios.get('/test');
            fail('Should have thrown an error');
        } catch (error) {
            const axiosError = error as AxiosError<ErrorResponse>;
            expect(axiosError.response?.status).toBe(500);
            expect(axiosError.response?.data.message).toBe('Internal Server Error');
        }
    });

    it('should handle network errors', async () => {
        const mockError: AxiosError = {
            message: 'Network Error',
            isAxiosError: true,
            toJSON: () => ({}),
            name: 'AxiosError',
            config: {} as any
        };

        // Mock axios request to fail with network error
        jest.spyOn(axios, 'get').mockRejectedValueOnce(mockError);

        try {
            await axios.get('/test');
            fail('Should have thrown an error');
        } catch (error) {
            const axiosError = error as AxiosError;
            expect(axiosError.message).toBe('Network Error');
            expect(axiosError.isAxiosError).toBe(true);
        }
    });
}); 