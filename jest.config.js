module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*"],
  coverageDirectory: "coverage",
  coverageProvider: "babel",
  preset: "ts-jest/presets/default-esm",
  resetMocks: true,
  testMatch: ["<rootDir>/__tests__/**/*.test.ts"],
};
