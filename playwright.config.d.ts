// Type definitions for Playwright config
declare module 'playwright.config' {
  export const getLightpandaWsUrl: () => Promise<string>;
  export const LIGHTPANDA_PORT: number;
  export const getLightpandaPort: () => Promise<number>;
  export const lightpandaServer: any; // Adjust the type as needed
}
