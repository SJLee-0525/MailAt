export interface User {
  userId: number;
  username: string;
}

// export interface AuthUser {
//   id: number;
//   email: string;
//   name: string;
// }

// export interface AccountsResponse {
//   id: number;
//   email: string;
//   name: string;
//   imapHost: string;
//   smtpHost: string;
// }

export interface CreateAccountRequest {
  email: string;
  password: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  authMethod?: string;
}

export interface CreateAccountResponse {
  accountId: number;
  email: string;
  imapHost: string;
  smtpHost: string;
  username: string;
}
