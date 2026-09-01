export type AccessType = "private" | "public";

export interface LoginResult {
  status: number;
  success?: boolean;
  accessType?: AccessType;
  message?: string;
}

export interface RegisterResult {
  status: number;
  success: boolean;
  message: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  groups: string[];
}

export interface LegacyUserInfo {
  id: number | string;
  email: string;
  nom: string;
  prenom: string;
}
