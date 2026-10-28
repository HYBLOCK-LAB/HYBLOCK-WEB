import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testMatch: 'attendance-admin.spec.ts',
  use: { ...base.use, baseURL: 'http://127.0.0.1:5185' },
  webServer: [
    { command: 'node tests/fixtures/attendance-member-server.cjs', url: 'http://127.0.0.1:5184/health', reuseExistingServer: false },
    {
      command: 'npm run start -- -H 127.0.0.1 -p 5185', url: 'http://127.0.0.1:5185/login', reuseExistingServer: false,
      env: { NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:5184', SUPABASE_SERVICE_ROLE_KEY: 'attendance-browser-test-key', WALLET_SESSION_SECRET: 'attendance-browser-test-secret' },
    },
  ],
});
