import { describe, it, expect } from "@jest/globals";

// ─── RBAC guard logic test ─────────────────────────────────────────────────
// We test the pure logic of role checking here (no Next.js runtime needed)

type AppRole = "admin" | "employee";

function isRoleAllowed(userRole: AppRole, allowedRoles: AppRole[]): boolean {
  return allowedRoles.includes(userRole);
}

function isAdmin(role: AppRole): boolean {
  return role === "admin";
}

function isManagerOrAdmin(role: AppRole): boolean {
  return role === "admin" || role === "manager";
}

describe("RBAC Guards", () => {
  describe("requireRole logic", () => {
    it("allows admin when admin is required", () => {
      expect(isRoleAllowed("admin", ["admin"])).toBe(true);
    });

    it("allows admin when admin or manager is required", () => {
      expect(isRoleAllowed("admin", ["admin", "manager"])).toBe(true);
    });

    it("denies employee when only admin is required", () => {
      expect(isRoleAllowed("employee", ["admin"])).toBe(false);
    });

    it("denies employee when admin or manager required", () => {
      expect(isRoleAllowed("employee", ["admin", "manager"])).toBe(false);
    });

    it("allows manager when manager is required", () => {
      expect(isRoleAllowed("manager", ["manager"])).toBe(true);
    });

    it("allows employee when employee is required", () => {
      expect(isRoleAllowed("employee", ["employee"])).toBe(true);
    });
  });

  describe("isAdmin", () => {
    it("returns true for admin", () => {
      expect(isAdmin("admin")).toBe(true);
    });

    it("returns false for manager", () => {
      expect(isAdmin("manager")).toBe(false);
    });

    it("returns false for employee", () => {
      expect(isAdmin("employee")).toBe(false);
    });
  });

  describe("isManagerOrAdmin", () => {
    it("returns true for admin", () => {
      expect(isManagerOrAdmin("admin")).toBe(true);
    });

    it("returns true for manager", () => {
      expect(isManagerOrAdmin("manager")).toBe(true);
    });

    it("returns false for employee", () => {
      expect(isManagerOrAdmin("employee")).toBe(false);
    });
  });
});

describe("JWT Claim Validation Logic", () => {
  function validateJwtClaims(claims: {
    exp?: number;
    iat?: number;
    app_metadata?: { app_role?: string; employee_id?: string };
  }): { valid: boolean; reason?: string } {
    const now = Math.floor(Date.now() / 1000);

    if (!claims.exp) return { valid: false, reason: "missing_exp" };
    if (claims.exp < now) return { valid: false, reason: "expired" };
    if (!claims.iat) return { valid: false, reason: "missing_iat" };
    if (claims.iat > now + 60) return { valid: false, reason: "future_iat" };

    return { valid: true };
  }

  it("rejects tokens with missing exp", () => {
    const result = validateJwtClaims({ iat: Math.floor(Date.now() / 1000) });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("missing_exp");
  });

  it("rejects expired tokens", () => {
    const result = validateJwtClaims({
      exp: Math.floor(Date.now() / 1000) - 3600,
      iat: Math.floor(Date.now() / 1000) - 7200,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("expired");
  });

  it("rejects tokens with missing iat", () => {
    const result = validateJwtClaims({
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("missing_iat");
  });

  it("accepts valid token claims", () => {
    const now = Math.floor(Date.now() / 1000);
    const result = validateJwtClaims({
      exp: now + 900, // 15 min
      iat: now,
      app_metadata: { app_role: "admin", employee_id: "abc-123" },
    });
    expect(result.valid).toBe(true);
  });
});
