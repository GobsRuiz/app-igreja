/**
 * Sistema de Permissões (RBAC)
 * Padrão da indústria: Permissões definidas no código
 * Segurança real: Firestore Rules validam na nuvem
 */

export type Role = 'user' | 'admin' | 'superadmin'

export type Permission =
  // Events
  | 'read:events'
  | 'write:events'
  | 'delete:events'
  // Categories
  | 'read:categories'
  | 'write:categories'
  | 'delete:categories'
  // Locations
  | 'read:locations'
  | 'write:locations'
  | 'delete:locations'
  // Users
  | 'read:users'
  | 'write:users'
  | 'delete:users'
  // All
  | '*'

/**
 * Permissões por role
 * Usado no cliente para UI/UX (mostrar/esconder botões)
 * Segurança REAL nas Firestore Rules
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // USER: Apenas visualiza
  user: ['read:events', 'read:categories', 'read:locations'],

  // ADMIN: CRUD eventos/categorias/locais, VER usuários
  admin: [
    'read:events',
    'write:events',
    'delete:events',
    'read:categories',
    'write:categories',
    'delete:categories',
    'read:locations',
    'write:locations',
    'delete:locations',
    'read:users', // Apenas visualizar, NÃO editar
  ],

  // SUPERADMIN: Tudo (inclusive editar usuários e roles)
  superadmin: ['*'],
}

/**
 * Verifica se role tem permissão
 * @param role Role do usuário
 * @param permission Permissão a verificar
 * @returns true se tem permissão
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role]

  // Superadmin tem tudo
  if (permissions.includes('*')) {
    return true
  }

  // Verifica permissão específica
  if (permissions.includes(permission)) {
    return true
  }

  // Verifica wildcard (ex: 'read:*' permite 'read:events')
  const [action, resource] = permission.split(':')
  const wildcardPermission = `${action}:*` as Permission
  if (permissions.includes(wildcardPermission)) {
    return true
  }

  return false
}

/**
 * Obtém todas as permissões de um role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role]
}

/**
 * Verifica se é admin (admin ou superadmin)
 */
export function isAdmin(role: Role): boolean {
  return role === 'admin' || role === 'superadmin'
}

/**
 * Verifica se é superadmin
 */
export function isSuperAdmin(role: Role): boolean {
  return role === 'superadmin'
}
