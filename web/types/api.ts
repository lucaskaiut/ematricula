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

export type PersonProfile = 'student' | 'teacher';

export type PersonStatus = 'active' | 'inactive';

export type PersonSummary = {
  id: number;
  full_name: string;
  profile: PersonProfile;
};

export type PersonUserRef = {
  id: number;
  name: string;
  email: string;
};

export type ModalityUserRef = {
  id: number;
  name: string;
  email: string;
};

export type ModalityAttributes = {
  id: number;
  company_id: number;
  name: string;
  description: string | null;
  created_by: number | null;
  updated_by: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  creator?: ModalityUserRef | null;
  updater?: ModalityUserRef | null;
};

export type PersonModalityRef = {
  id: number;
  name: string;
};

export type PersonAttributes = {
  id: number;
  company_id: number;
  full_name: string;
  birth_date: string;
  cpf: string | null;
  phone: string;
  email: string;
  guardian_person_id: number | null;
  status: PersonStatus;
  notes: string | null;
  profile: PersonProfile;
  created_by: number | null;
  updated_by: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  guardian?: PersonSummary | null;
  creator?: PersonUserRef | null;
  updater?: PersonUserRef | null;
  modalities?: PersonModalityRef[];
};
