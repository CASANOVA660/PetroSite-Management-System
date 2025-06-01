module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'modules/**/*.js',
        '!modules/**/index.js',
        '!**/node_modules/**'
    ],
    coverageReporters: ['text', 'lcov'],
    testTimeout: 10000,
    setupFilesAfterEnv: ['./tests/setup.js']
}; 