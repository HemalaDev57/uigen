import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only to allow importing in tests
vi.mock("server-only", () => ({}));

// Mock jose
vi.mock("jose", () => {
  class MockSignJWT {
    constructor(public payload: any) {}

    setProtectedHeader(header: any) {
      return this;
    }

    setExpirationTime(time: string) {
      return this;
    }

    setIssuedAt() {
      return this;
    }

    async sign(secret: any) {
      return "mock-jwt-token";
    }
  }

  return {
    SignJWT: MockSignJWT,
    jwtVerify: vi.fn(),
  };
});

// Mock next/headers
const mockCookieStore = {
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

// Import after mocks are set up
const { createSession } = await import("../auth");

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Don't restore mocks as it will break subsequent tests
  });

  test("creates session with valid userId and email", async () => {
    const userId = "user-123";
    const email = "test@example.com";

    await createSession(userId, email);

    // Verify cookie was set
    expect(mockCookieStore.set).toHaveBeenCalled();
  });

  test("generates and stores JWT token", async () => {
    const userId = "user-456";
    const email = "admin@example.com";

    await createSession(userId, email);

    // Verify JWT token was stored in cookie
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      "mock-jwt-token",
      expect.any(Object)
    );
  });

  test("sets httpOnly flag to prevent XSS", async () => {
    const userId = "user-202";
    const email = "secure@example.com";

    await createSession(userId, email);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      "mock-jwt-token",
      expect.objectContaining({
        httpOnly: true,
      })
    );
  });

  test("sets secure flag based on NODE_ENV", async () => {
    const userId = "user-303";
    const email = "env@example.com";
    const originalNodeEnv = process.env.NODE_ENV;

    // Test development mode
    process.env.NODE_ENV = "development";
    await createSession(userId, email);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      "mock-jwt-token",
      expect.objectContaining({
        secure: false,
      })
    );

    vi.clearAllMocks();

    // Test production mode
    process.env.NODE_ENV = "production";
    await createSession(userId, email);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      "mock-jwt-token",
      expect.objectContaining({
        secure: true,
      })
    );

    // Restore
    process.env.NODE_ENV = originalNodeEnv;
  });

  test("sets sameSite to lax for CSRF protection", async () => {
    const userId = "user-404";
    const email = "csrf@example.com";

    await createSession(userId, email);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      "mock-jwt-token",
      expect.objectContaining({
        sameSite: "lax",
      })
    );
  });

  test("sets cookie path to root", async () => {
    const userId = "user-505";
    const email = "path@example.com";

    await createSession(userId, email);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      "mock-jwt-token",
      expect.objectContaining({
        path: "/",
      })
    );
  });

  test("sets cookie expiration to 7 days from now", async () => {
    const userId = "user-606";
    const email = "expire@example.com";
    const before = Date.now();

    await createSession(userId, email);

    const after = Date.now();
    const setCall = mockCookieStore.set.mock.calls[0];
    const expiresAt = setCall[2].expires;

    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const expiresTime = expiresAt.getTime();

    expect(expiresTime).toBeGreaterThanOrEqual(before + sevenDays);
    expect(expiresTime).toBeLessThanOrEqual(after + sevenDays + 1000);
  });

  test("handles special characters in email", async () => {
    const userId = "user-808";
    const email = "test+special@example.com";

    await createSession(userId, email);

    expect(mockCookieStore.set).toHaveBeenCalled();
  });

  test("handles long userId strings", async () => {
    const userId = "user-very-long-id-with-many-characters-1234567890";
    const email = "long@example.com";

    await createSession(userId, email);

    expect(mockCookieStore.set).toHaveBeenCalled();
  });

  test("stores token with correct cookie name", async () => {
    const userId = "user-1111";
    const email = "cookie@example.com";

    await createSession(userId, email);

    const setCall = mockCookieStore.set.mock.calls[0];
    expect(setCall[0]).toBe("auth-token");
  });

  test("uses generated JWT token as cookie value", async () => {
    const userId = "user-1212";
    const email = "value@example.com";

    await createSession(userId, email);

    const setCall = mockCookieStore.set.mock.calls[0];
    expect(setCall[1]).toBe("mock-jwt-token");
  });

  test("calls cookies() to get cookie store", async () => {
    const { cookies } = await import("next/headers");
    const userId = "user-1313";
    const email = "store@example.com";

    await createSession(userId, email);

    expect(cookies).toHaveBeenCalled();
  });

  test("sets all cookie options together", async () => {
    const userId = "user-1414";
    const email = "all@example.com";
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    await createSession(userId, email);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      "mock-jwt-token",
      {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        expires: expect.any(Date),
        path: "/",
      }
    );

    process.env.NODE_ENV = originalNodeEnv;
  });
});
