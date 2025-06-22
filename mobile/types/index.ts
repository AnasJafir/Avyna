export type Recommendation = {
  diet: string;
  exercise: string;
  wellness: string;
};

export type HealthLogResponse = {
  log_id: number;
  message: string;
  recommendation: Recommendation;
};

export type HealthLog = {
  user_id: number;
  condition: string;
  symptoms: string;
  pain_level: number;
  mood: string;
  cycle_day: number;
  notes: string | undefined;
};

export enum EnumProfile {
  Profile,
  EditProfile,
}

export type User = {
  token: string;
  user: {
    age: number;
    created_at: string;
    email: string;
    full_name: string;
    has_endometriosis: boolean | null;
    has_pcos: boolean | null;
    id: number;
    subscription_plan: string | undefined;
  };
};

export type Profile = Pick<User, 'user'>;
export type EditProfile = Omit<Profile['user'], 'id' | 'created_at'>;
