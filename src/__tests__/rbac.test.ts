/**
 * Unit tests for RBAC helper functions in src/lib/auth.ts
 *
 * Covers:
 *  - isAdmin
 *  - isManagerOrAdmin
 *  - isHrOrAdmin
 *  - isPmAdmin
 *  - isPmAdminOrCoordinator
 *
 * These are pure functions (no DB, no Next.js modules) — safe to test in isolation.
 */

import {
  isAdmin,
  isManagerOrAdmin,
  isHrOrAdmin,
  isPmAdmin,
  isPmAdminOrCoordinator,
} from "@/lib/auth";
import type { UserRole, PMRole } from "@/types/database";

// ─── isAdmin ───────────────────────────────────────────────────────────────

describe("isAdmin", () => {
  test('returns true for "admin"', () => {
    expect(isAdmin("admin" as UserRole)).toBe(true);
  });

  test('returns false for "hr"', () => {
    expect(isAdmin("hr" as UserRole)).toBe(false);
  });

  test('returns false for "manager"', () => {
    expect(isAdmin("manager" as UserRole)).toBe(false);
  });

  test('returns false for "employee"', () => {
    expect(isAdmin("employee" as UserRole)).toBe(false);
  });
});

// ─── isManagerOrAdmin ──────────────────────────────────────────────────────

describe("isManagerOrAdmin", () => {
  test('returns true for "admin"', () => {
    expect(isManagerOrAdmin("admin" as UserRole)).toBe(true);
  });

  test('returns true for "manager"', () => {
    expect(isManagerOrAdmin("manager" as UserRole)).toBe(true);
  });

  test('returns false for "hr"', () => {
    expect(isManagerOrAdmin("hr" as UserRole)).toBe(false);
  });

  test('returns false for "employee"', () => {
    expect(isManagerOrAdmin("employee" as UserRole)).toBe(false);
  });
});

// ─── isHrOrAdmin ───────────────────────────────────────────────────────────

describe("isHrOrAdmin", () => {
  test('returns true for "admin"', () => {
    expect(isHrOrAdmin("admin" as UserRole)).toBe(true);
  });

  test('returns true for "hr"', () => {
    expect(isHrOrAdmin("hr" as UserRole)).toBe(true);
  });

  test('returns false for "manager"', () => {
    expect(isHrOrAdmin("manager" as UserRole)).toBe(false);
  });

  test('returns false for "employee"', () => {
    expect(isHrOrAdmin("employee" as UserRole)).toBe(false);
  });
});

// ─── isPmAdmin ─────────────────────────────────────────────────────────────

describe("isPmAdmin", () => {
  test('returns true for "admin"', () => {
    expect(isPmAdmin("admin" as PMRole)).toBe(true);
  });

  test('returns false for "coordinator"', () => {
    expect(isPmAdmin("coordinator" as PMRole)).toBe(false);
  });

  test('returns false for "bd"', () => {
    expect(isPmAdmin("bd" as PMRole)).toBe(false);
  });

  test('returns false for "developer"', () => {
    expect(isPmAdmin("developer" as PMRole)).toBe(false);
  });
});

// ─── isPmAdminOrCoordinator ────────────────────────────────────────────────

describe("isPmAdminOrCoordinator", () => {
  test('returns true for "admin"', () => {
    expect(isPmAdminOrCoordinator("admin" as PMRole)).toBe(true);
  });

  test('returns true for "coordinator"', () => {
    expect(isPmAdminOrCoordinator("coordinator" as PMRole)).toBe(true);
  });

  test('returns false for "bd"', () => {
    expect(isPmAdminOrCoordinator("bd" as PMRole)).toBe(false);
  });

  test('returns false for "developer"', () => {
    expect(isPmAdminOrCoordinator("developer" as PMRole)).toBe(false);
  });
});
