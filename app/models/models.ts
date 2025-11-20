
enum UserRole {
  MANAGER,
  ADMIN,
  TEACHER,
}

export type Manager = {
  user_id: string
  tg_username: string | null
  first_name: string | null
  last_name: string | null
  user_role: UserRole
  sections_managed: any
}

export type Teacher = {
  user_id: string
  tg_username: string | null
  first_name: string | null
  last_name: string | null
  user_role: UserRole
  teacher_sections: any
}

export type Schedule = {

}

export type Course = {

}
