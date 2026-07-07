export type AppRole = "admin" | "hr" | "manager" | "employee" | "developer";

export interface JwtClaims {
  sub: string; // user_id
  email?: string;
  exp: number;
  iat: number;
  iss?: string;
  aud?: string | string[];
  nbf?: number;
  app_metadata?: {
    app_role?: AppRole;
    employee_id?: string;
    provider?: string;
    providers?: string[];
  };
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    email?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
  };
  role?: string;        // Supabase sets this to "authenticated"
  aal?: string;         // Authentication Assurance Level
  session_id?: string;
  is_anonymous?: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export interface AuthResult<T> {
  data?: T;
  error?: AuthError;
}
