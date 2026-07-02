export type AppRole = "admin" | "manager" | "employee";

export interface JwtClaims {
  sub: string; // user_id
  email?: string;
  exp: number;
  iat: number;
  iss?: string;
  aud?: string;
  nbf?: number;
  app_metadata?: {
    app_role?: AppRole;
    employee_id?: string;
    [key: string]: any;
  };
  user_metadata?: {
    full_name?: string;
    [key: string]: any;
  };
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
