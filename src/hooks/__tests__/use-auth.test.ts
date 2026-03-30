import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAuth } from "../use-auth";
import * as actions from "@/actions";
import * as anonWorkTracker from "@/lib/anon-work-tracker";
import * as getProjectsAction from "@/actions/get-projects";
import * as createProjectAction from "@/actions/create-project";

// Mock router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

describe("useAuth", () => {
  const mockSignIn = actions.signIn as any;
  const mockSignUp = actions.signUp as any;
  const mockGetAnonWorkData = anonWorkTracker.getAnonWorkData as any;
  const mockClearAnonWork = anonWorkTracker.clearAnonWork as any;
  const mockGetProjects = getProjectsAction.getProjects as any;
  const mockCreateProject = createProjectAction.createProject as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    test("returns initial values", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  describe("signIn", () => {
    test("successfully signs in and navigates with anonymous work", async () => {
      const mockAnonWork = {
        messages: [{ id: "1", role: "user", content: "Hello" }],
        fileSystemData: { "/test.js": { type: "file", content: "test" } },
      };
      const mockProject = { id: "anon-project-123" };

      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(mockAnonWork);
      mockCreateProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password123");
      });

      // Check loading state
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await signInPromise;
      });

      // Verify signIn was called
      expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");

      // Verify anonymous work was retrieved and cleared
      expect(mockGetAnonWorkData).toHaveBeenCalled();
      expect(mockClearAnonWork).toHaveBeenCalled();

      // Verify project was created with anonymous work
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: mockAnonWork.messages,
        data: mockAnonWork.fileSystemData,
      });

      // Verify navigation
      expect(mockPush).toHaveBeenCalledWith("/anon-project-123");

      // Verify loading state is reset
      expect(result.current.isLoading).toBe(false);
    });

    test("successfully signs in and navigates to most recent project", async () => {
      const mockProjects = [
        { id: "project-1", name: "Recent Project" },
        { id: "project-2", name: "Older Project" },
      ];

      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password123");
      });

      await act(async () => {
        await signInPromise;
      });

      // Verify no anonymous work was cleared
      expect(mockClearAnonWork).not.toHaveBeenCalled();

      // Verify projects were fetched
      expect(mockGetProjects).toHaveBeenCalled();

      // Verify navigation to first (most recent) project
      expect(mockPush).toHaveBeenCalledWith("/project-1");

      // Verify no new project was created
      expect(mockCreateProject).not.toHaveBeenCalled();
    });

    test("successfully signs in and creates new project when no projects exist", async () => {
      const mockNewProject = { id: "new-project-456" };

      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue(mockNewProject);

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password123");
      });

      await act(async () => {
        await signInPromise;
      });

      // Verify projects were fetched
      expect(mockGetProjects).toHaveBeenCalled();

      // Verify new project was created
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });

      // Verify navigation to new project
      expect(mockPush).toHaveBeenCalledWith("/new-project-456");
    });

    test("handles anonymous work with no messages", async () => {
      const mockAnonWork = {
        messages: [],
        fileSystemData: {},
      };
      const mockProjects = [{ id: "project-1", name: "Project" }];

      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(mockAnonWork);
      mockGetProjects.mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password123");
      });

      await act(async () => {
        await signInPromise;
      });

      // Should not create project from anonymous work with empty messages
      expect(mockClearAnonWork).not.toHaveBeenCalled();

      // Should fetch existing projects instead
      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/project-1");
    });

    test("returns error result on sign in failure", async () => {
      const errorResult = { success: false, error: "Invalid credentials" };
      mockSignIn.mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      let signInResult: any;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "wrong");
      });

      await act(async () => {
        signInResult = await signInPromise;
      });

      expect(signInResult).toEqual(errorResult);

      // Should not proceed with post-sign-in logic
      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockGetProjects).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();

      // Loading state should be reset
      expect(result.current.isLoading).toBe(false);
    });

    test("resets loading state even if post-sign-in throws error", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password123");
      });

      await act(async () => {
        try {
          await signInPromise;
        } catch (error) {
          // Expected to throw
        }
      });

      // Loading state should be reset even on error
      expect(result.current.isLoading).toBe(false);
    });

    test("resets loading state if signIn action throws", async () => {
      mockSignIn.mockRejectedValue(new Error("API Error"));

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password123");
      });

      await act(async () => {
        try {
          await signInPromise;
        } catch (error) {
          // Expected to throw
        }
      });

      // Loading state should be reset even on error
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    test("successfully signs up and navigates with anonymous work", async () => {
      const mockAnonWork = {
        messages: [{ id: "1", role: "user", content: "Test" }],
        fileSystemData: { "/App.jsx": { type: "file", content: "export default App" } },
      };
      const mockProject = { id: "signup-project-789" };

      mockSignUp.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(mockAnonWork);
      mockCreateProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("new@example.com", "newpass123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await signUpPromise;
      });

      expect(mockSignUp).toHaveBeenCalledWith("new@example.com", "newpass123");
      expect(mockGetAnonWorkData).toHaveBeenCalled();
      expect(mockClearAnonWork).toHaveBeenCalled();
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: mockAnonWork.messages,
        data: mockAnonWork.fileSystemData,
      });
      expect(mockPush).toHaveBeenCalledWith("/signup-project-789");
      expect(result.current.isLoading).toBe(false);
    });

    test("successfully signs up and creates new project for new user", async () => {
      const mockNewProject = { id: "first-project-101" };

      mockSignUp.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue(mockNewProject);

      const { result } = renderHook(() => useAuth());

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("new@example.com", "password123");
      });

      await act(async () => {
        await signUpPromise;
      });

      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/first-project-101");
    });

    test("returns error result on sign up failure", async () => {
      const errorResult = { success: false, error: "Email already exists" };
      mockSignUp.mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());

      let signUpPromise: Promise<any>;
      let signUpResult: any;
      act(() => {
        signUpPromise = result.current.signUp("existing@example.com", "password");
      });

      await act(async () => {
        signUpResult = await signUpPromise;
      });

      expect(signUpResult).toEqual(errorResult);
      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockGetProjects).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    test("resets loading state even if post-sign-up throws error", async () => {
      mockSignUp.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockRejectedValue(new Error("Database error"));

      const { result } = renderHook(() => useAuth());

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("test@example.com", "password123");
      });

      await act(async () => {
        try {
          await signUpPromise;
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("loading state", () => {
    test("isLoading is true during signIn and false after", async () => {
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 50))
      );
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.signIn("test@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    test("isLoading is true during signUp and false after", async () => {
      mockSignUp.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 50))
      );
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.signUp("test@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("edge cases", () => {
    test("handles createProject returning project with undefined id gracefully", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: undefined });

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password123");
      });

      await act(async () => {
        await signInPromise;
      });

      // Should still attempt navigation even with undefined id
      expect(mockPush).toHaveBeenCalledWith("/undefined");
    });

    test("handles getAnonWorkData returning undefined", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(undefined);
      mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password123");
      });

      await act(async () => {
        await signInPromise;
      });

      // Should skip anonymous work and fetch projects
      expect(mockClearAnonWork).not.toHaveBeenCalled();
      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/project-1");
    });

    test("concurrent signIn calls maintain separate loading states", async () => {
      mockSignIn.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      // Start two sign-in attempts
      let promise1: Promise<any>;
      let promise2: Promise<any>;

      act(() => {
        promise1 = result.current.signIn("test1@example.com", "pass1");
        promise2 = result.current.signIn("test2@example.com", "pass2");
      });

      await act(async () => {
        await Promise.all([promise1, promise2]);
      });

      // Both calls should have been made
      expect(mockSignIn).toHaveBeenCalledTimes(2);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
