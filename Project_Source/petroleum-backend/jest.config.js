module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    coverageReporters: ['text', 'lcov'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/',
        '/coverage/'
    ],
    setupFilesAfterEnv: [
        './tests/setup.js'
    ],
    maxWorkers: '50%',
    watchPathIgnorePatterns: [
        '/node_modules/',
        '/coverage/'
    ],
    testTimeout: 10000
}; 