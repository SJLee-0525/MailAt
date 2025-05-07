export interface User {
  id: number;
  username: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export interface AccountsResponse {
  id: number;
  email: string;
  imapHost: string;
  smtpHost: string;
}
