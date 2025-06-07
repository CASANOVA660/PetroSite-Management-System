const axios = require('axios');
require('dotenv').config();

async function testOllamaAPI() {
    try {
        const apiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
        console.log(`Testing connection to: ${apiUrl}/api/generate`);

        const response = await axios.post(`${apiUrl}/api/generate`, {
            model: 'tinyllama',
            prompt: 'Hello, how are you?',
            stream: false
        });

        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testOllamaAPI();