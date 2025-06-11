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
