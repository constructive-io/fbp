/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/?(*.)+(test|spec).ts'],
  testPathIgnorePatterns: ['/dist/', '\\.d\\.ts$'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  rootDir: '.',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
};
