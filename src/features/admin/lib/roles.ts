import type { AdminRole } from '@/types/api/auth'

/**
 * The account that runs the platform (Lumar): today's OWNER, and DEVELOPER, the
 * role that account is moving to. While the API is making that move the two mean
 * the same here, so the panel keeps working whichever one `/users/me` answers.
 */
export function isPlatformOperator(role: AdminRole | null | undefined): boolean {
  return role === 'OWNER' || role === 'DEVELOPER'
}
