
enum UserRole {
  MANAGER,
  ADMIN,
  TEACHER,
}

export type Manager = {
  user_id: string
  telegram_id: string | null
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
    age_group?: string | null;
    duration_minutes?: number | null;
    lesson_plan?: LessonPlan | null;
    objectives?: { id: string; objective: string }[];
    unit?: { unit_id: string; title: string } | null;
    resources?: ResourceSummary[];
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

export interface LessonPlan {
  opening?: string;
  teaching?: string;
  application?: string;
  activity?: string;
  memory_verse?: string;
  closing?: string;
}

export interface ResourceSummary {
  resource_id: string;
  title: string;
  type: string;
  url: string;
  mime_type?: string | null;
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
  section_id?: string | null;
  unit_id?: string | null;
  age_group?: string | null;
  duration_minutes?: number | null;
  order?: number | null;
  lesson_plan?: LessonPlan | null;
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
