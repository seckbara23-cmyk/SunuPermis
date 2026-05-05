export const ROLES = {
  SUPER_ADMIN:  'super_admin',
  SCHOOL_ADMIN: 'school_admin',
  STUDENT:      'student',
  INSTRUCTOR:   'instructor',
} as const

export type AppRole = (typeof ROLES)[keyof typeof ROLES]

export function isAdminRole(role: string | null | undefined): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.SCHOOL_ADMIN
}

export function canManageStudents(role: string | null | undefined): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.SCHOOL_ADMIN
}
