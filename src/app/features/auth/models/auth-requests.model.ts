import { User } from '../../../core/models/user.model';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  bio?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
