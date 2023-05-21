module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*"],
  coverageDirectory: "coverage",
  coverageProvider: "babel",
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
  preset: "ts-jest/presets/default-esm-legacy",
  resetMocks: true,
  testMatch: ["<rootDir>/__tests__/**/*.test.ts"],
};
