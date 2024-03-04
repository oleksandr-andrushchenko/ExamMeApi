/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  restoreMocks: true,
  clearMocks: true,
  coverageProvider: 'v8',
  moduleFileExtensions: [ 'js', 'jsx', 'ts', 'tsx', 'json', 'node' ],
  testMatch: [
    '**/__tests__/**/*.ts',
    '!**/__tests__/**/index.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  setupFiles: [
    'dotenv/config',
  ],
};

export default config;