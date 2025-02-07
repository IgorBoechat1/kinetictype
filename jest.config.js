module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '^three/examples/jsm/loaders/FontLoader$': '<rootDir>/node_modules/three/examples/jsm/loaders/FontLoader.js',
    '^three/examples/jsm/geometries/TextGeometry$': '<rootDir>/node_modules/three/examples/jsm/geometries/TextGeometry.js'
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover']
};