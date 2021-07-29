type User = {
  permissions: string[]
  roles: string[]
}

type validateUserPermissionsProps = {
  user?: User;
  permissions?: string[]
  roles?: string[]
}

export function validateUserPermissions({ user, permissions = [], roles = [] }: validateUserPermissionsProps) {

  if (permissions?.length > 0) {
    const hasAllPermissions = permissions.every(permissions => {
      return user?.permissions.includes(permissions)
    });

    if (!hasAllPermissions) {
      return false
    }
  }

  if (roles?.length > 0) {
    const hasAllroles = roles.some(roles => {
      return user?.roles.includes(roles)
    });

    if (!hasAllroles) {
      return false
    }
  }

}