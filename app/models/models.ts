
enum UserRole {
  MANAGER,
  ADMIN,
  TEACHER,
}

export type Manager = {
  user_id: string
  telegram_id: number | null
  tg_username: string | null
  first_name: string | null
  last_name: string | null
  user_role: UserRole
  phone_number: string | null
  sections: { section_id: string; section_name: string | null }[]
}

export type Teacher = {
  user_id: string
  tg_username: string | null
  first_name: string | null
  last_name: string | null
  user_role: UserRole
  sections: string | null
}

export type Schedule = {

}

export interface Objective {
  id: string;
  objective: string;
  course_id: string;
}

export interface UserSummary {
  first_name: string;
  last_name: string;
  tg_username: string;
}

export interface Course {
  course_id: string;
  course_description: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  created_by: string; // user_id of creator
  objectives: Objective[];
  created_by_user: UserSummary | null;
}
