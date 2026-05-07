
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
  photo_url: string | null
  user_role: UserRole
  phone_number: string | null
  sections: any
}

export type Teacher = {
  user_id: string
  tg_username: string | null
  first_name: string | null
  last_name: string | null
  photo_url: string | null
  user_role: UserRole
  phone_number: string | null
  sections: string | null
  section_ids: string[]
}

export type Schedule = {
  schedule_id: string;
  schedule_date: string | Date;
  course: {
    course_id: string;
    course_name?: string | null;
    verse?: string | null;
    course_description: string;
  },
  teacher: {
    user_id: string;
    first_name: string;
    last_name: string;
  },
  section?: {
    section_id: string;
    section_name: string;
  }
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
  photo_url: string | null;
}

export interface Course {
  course_id: string;
  course_name?: string | null;
  verse?: string | null;
  course_description: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  created_by: string; // user_id of creator
  objectives: Objective[];
  created_by_user: UserSummary | null;
}

export interface ScheduleWithRelations {
  schedule_id: string;
  schedule_date: string | Date;
  course: {
    course_id: string;
    course_description: string;
    objectives: Objective[];
  };
  teacher_sections: {
    section: {
      section_name: string;
    }
  }[];
}
