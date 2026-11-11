import crypto from "crypto";

export interface AuthUser {
  email: string;
  name: string;
  role: string;
  designation?: string;
  union?: string;
}

// Single authenticated user credentials specified by the user
export const VALID_USER = {
  email: "taiburunion@gmail.com",
  password: "TaiUnion@99",
  name: "তৈবুর রহমান",
  role: "admin",
  designation: "ইউপি সচিব / প্রশাসক",
  union: "বাসুদেবপুর ইউনিয়ন পরিষদ",
};

export const AUTH_COOKIE_NAME = "union_auth_session";

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "union-parishad-master-secret-key-2026-taiburunion-secure-salt-99";

interface TokenPayload extends AuthUser {
  iat: number;
  exp: number;
}

/**
 * Creates an HMAC-SHA256 signed session token
 */
export function createSessionToken(user: AuthUser, expiresInDays: number = 7): string {
  const iat = Date.now();
  const exp = iat + expiresInDays * 24 * 60 * 60 * 1000;

  const payload: TokenPayload = {
    ...user,
    iat,
    exp,
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payloadStr)
    .digest("base64url");

  return `${payloadStr}.${signature}`;
}

/**
 * Verifies an HMAC-SHA256 signed session token
 */
export function verifySessionToken(token?: string | null): AuthUser | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadStr, signature] = parts;
  if (!payloadStr || !signature) return null;

  try {
    const expectedSig = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(payloadStr)
      .digest("base64url");

    // Timing-safe comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expectedBuf.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payloadJson = Buffer.from(payloadStr, "base64url").toString("utf8");
    const payload: TokenPayload = JSON.parse(payloadJson);

    // Check expiration
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) {
      return null;
    }

    return {
      email: payload.email,
      name: payload.name,
      role: payload.role,
      designation: payload.designation,
      union: payload.union,
    };
  } catch {
    return null;
  }
}

/**
 * Validates login credentials
 */
export function validateCredentials(email?: string, password?: string): AuthUser | null {
  if (!email || !password) return null;

  const cleanEmail = email.trim().toLowerCase();
  const expectedEmail = VALID_USER.email.trim().toLowerCase();

  if (cleanEmail === expectedEmail && password === VALID_USER.password) {
    return {
      email: VALID_USER.email,
      name: VALID_USER.name,
      role: VALID_USER.role,
      designation: VALID_USER.designation,
      union: VALID_USER.union,
    };
  }

  return null;
}

