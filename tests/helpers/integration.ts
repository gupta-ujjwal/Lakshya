import { test as base, Page } from "@playwright/test";

export interface ApiTestFixtures {
  apiClient: any;
  baseUrl: string;
}

export interface BrowserTestFixtures {
  page: Page;
  viewport: { width: number; height: number };
  isMobile: boolean;
}

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const API_BASE = process.env.TEST_API_BASE || "http://localhost:3000/api";

export const test = base.extend<ApiTestFixtures>({
  apiClient: async ({ request }, use) => {
    await use(request);
  },
  baseUrl: BASE_URL,
});

export const apiRequest = async (
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
  headers: Record<string, string> = {}
) => {
  const url = `${API_BASE}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = response.headers.get("content-type")?.includes("application/json")
    ? await response.json()
    : null;

  return {
    status: response.status,
    data,
    headers: response.headers,
  };
};

export const MOBILE_VIEWPORT = { width: 375, height: 812 };
export const TABLET_VIEWPORT = { width: 768, height: 1024 };
export const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const retryUntil = async (
  fn: () => Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
) => {
  const { timeout = 5000, interval = 100 } = options;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    if (await fn()) return true;
    await waitFor(interval);
  }
  return false;
};

export const createTestSchedule = async (api: any, overrides: Record<string, unknown> = {}) => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const response = await api.post("/api/schedules", {
    data: {
      userId: "test-user-id",
      title: "Test Schedule",
      targetDate: futureDate.toISOString(),
      data: { notes: "Test schedule created by QA tests" },
      ...overrides,
    },
  });

  return response;
};

export const createTestTask = async (api: any, scheduleId: string, overrides: Record<string, unknown> = {}) => {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const response = await api.post("/api/tasks", {
    data: {
      scheduleId,
      title: "Test Task",
      subject: "Test Subject",
      targetDate: futureDate.toISOString(),
      priority: 5,
      ...overrides,
    },
  });

  return response;
};

export const createTestUser = async (api: any, overrides: Record<string, unknown> = {}) => {
  const response = await api.post("/api/users", {
    data: {
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      ...overrides,
    },
  });

  return response;
};