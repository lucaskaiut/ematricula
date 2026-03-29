export type UserAttributes = {
  id: number;
  name: string;
  email: string;
  token?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type UserWrapped = {
  data: UserAttributes;
};

export type LaravelValidationError = {
  message?: string;
  errors?: Record<string, string[]>;
};

export type LoginRequestBody = {
  email: string;
  password: string;
};

export type RegisterRequestBody = {
  company: {
    name: string;
    email: string;
    phone: string;
  };
  user: {
    name: string;
    email: string;
    password: string;
  };
};

export type PublicUser = {
  id: number;
  name: string;
  email: string;
};
