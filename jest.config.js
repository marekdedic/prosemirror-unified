/** @type {import('jest').Config} */
export default {
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*", "!src/index.ts"],
  coverageDirectory: "coverage",
  coverageProvider: "babel",
  resetMocks: true,
  projects: [
    {
      displayName: "Unit tests",
      testMatch: ["<rootDir>/__tests__/unit/**/*.test.ts"],
      transform: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- The key is a glob
        "^.+\\.(j|t)s$": [
          "ts-jest",
          {
            tsconfig: "test.tsconfig.json",
          },
        ],
      },
      transformIgnorePatterns: ["node_modules/(?!unified)/"],
    },
    {
      displayName: "Integration tests",
      testMatch: ["<rootDir>/__tests__/integration/**/*.test.ts"],
      transform: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- The key is a glob
        "^.+\\.(j|t)s$": [
          "ts-jest",
          {
            tsconfig: "test.tsconfig.json",
          },
        ],
      },
      transformIgnorePatterns: ["node_modules/(?!unified)/"],
      setupFilesAfterEnv: [
        "jest-prosemirror/environment",
        "<rootDir>/__tests__/setupAfterEnv.ts",
      ],
      testEnvironment: "jsdom",
    },
  ],
};
