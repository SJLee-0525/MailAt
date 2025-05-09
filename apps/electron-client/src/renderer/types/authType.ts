export interface User {
  id: number;
  username: string;
}

// export interface AuthUser {
//   id: number;
//   email: string;
//   name: string;
// }

export interface AccountsResponse {
  id: number;
  email: string;
  name: string;
  imapHost: string;
  smtpHost: string;
}

export interface CreateAccountRequest {
  email: string;
  password: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
}

export interface CreateAccountResponse {
  id: number;
  email: string;
}
