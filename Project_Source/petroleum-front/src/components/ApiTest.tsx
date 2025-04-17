import React, { useState } from 'react';
import axios from '../utils/axios';
import { API_URL } from '../config';

const ApiTest: React.FC = () => {
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const testApi = async (endpoint: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(endpoint);
            setResult(response.data);
            console.log('API test successful:', response);
        } catch (err: any) {
            console.error('API test error:', err);
            setError(err.message || 'Unknown error');
            setResult(err.response?.data || null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed top-0 right-0 m-4 p-4 bg-white border border-gray-300 rounded shadow-lg z-[100000] w-96 overflow-auto max-h-[80vh]">
            <h2 className="text-lg font-bold mb-4">API Test Tools</h2>
            <div className="mb-4">
                <p className="text-sm text-gray-600">API URL: {API_URL}</p>
            </div>
            <div className="space-y-2 mb-4">
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded w-full"
                    onClick={() => testApi('/tasks/user')}
                    disabled={loading}
                >
                    Test GET /tasks/user
                </button>
                <button
                    className="bg-green-500 text-white px-4 py-2 rounded w-full"
                    onClick={() => testApi('/auth/me')}
                    disabled={loading}
                >
                    Test GET /auth/me
                </button>
            </div>
            {loading && (
                <div className="text-center my-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                </div>
            )}
            {error && (
                <div className="bg-red-100 p-3 rounded border border-red-300 mb-4">
                    <p className="text-red-700 text-sm font-bold">Error:</p>
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}
            {result && (
                <div className="bg-gray-100 p-3 rounded overflow-auto max-h-80">
                    <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default ApiTest; 