export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  name: string;
  roles: string[];
}

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  roles: string[];
}
