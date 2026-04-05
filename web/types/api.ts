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

export type ClassGroupModalityRef = {
  id: number;
  name: string;
};

export type BillingCycle = 'month' | 'year';

export type PlanUserRef = {
  id: number;
  name: string;
  email: string;
};

export type PlanAttributes = {
  id: number;
  company_id: number;
  name: string;
  price: string | null;
  billing_cycle: BillingCycle;
  billing_interval: number;
  created_by: number | null;
  updated_by: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  creator?: PlanUserRef | null;
  updater?: PlanUserRef | null;
};

export type ClassGroupPlanRef = {
  id: number;
  name: string;
  price: string | null;
  billing_cycle: BillingCycle;
  billing_interval: number;
};

export type EnrollmentActiveSubscriptionRef = {
  id: number;
  plan_id: number;
  price: string | null;
  billing_cycle: string;
  billing_interval: number;
  started_at: string | null;
  next_billing_at: string | null;
  status: 'active' | 'canceled';
  plan?: PlanAttributes | null;
};

export type EnrollmentStatus = 'active' | 'locked' | 'cancelled';

export type EnrollmentClassGroupRef = {
  id: number;
  name: string;
  max_capacity: number | null;
  modality?: ClassGroupModalityRef | null;
};

export type EnrollmentAttributes = {
  id: number;
  company_id: number;
  student_person_id: number;
  class_group_id: number;
  starts_on: string;
  ends_on: string | null;
  status: EnrollmentStatus;
  created_by: number | null;
  updated_by: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  student?: PersonSummary | null;
  class_group?: EnrollmentClassGroupRef | null;
  creator?: PersonUserRef | null;
  updater?: PersonUserRef | null;
  active_subscription?: EnrollmentActiveSubscriptionRef | null;
};

export type ClassGroupAttributes = {
  id: number;
  company_id: number;
  name: string;
  modality_id: number;
  teacher_person_id: number;
  max_capacity: number | null;
  weekdays: string;
  starts_at: string;
  ends_at: string;
  created_by: number | null;
  updated_by: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  modality?: ClassGroupModalityRef | null;
  teacher?: PersonSummary | null;
  creator?: PersonUserRef | null;
  updater?: PersonUserRef | null;
  plans?: ClassGroupPlanRef[];
};

export type SubscriptionStatus = 'active' | 'canceled';

export type SubscriptionAttributes = {
  id: number;
  company_id: number;
  enrollment_id: number;
  plan_id: number;
  price: string | null;
  billing_cycle: string;
  billing_interval: number;
  started_at: string | null;
  next_billing_at: string | null;
  status: SubscriptionStatus;
  created_at?: string | null;
  updated_at?: string | null;
};

export type InvoiceStatus = 'pending' | 'paid';

export type InvoiceAttributes = {
  id: number;
  company_id: number;
  subscription_id: number;
  amount: string | null;
  due_date: string | null;
  status: InvoiceStatus;
  paid_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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
