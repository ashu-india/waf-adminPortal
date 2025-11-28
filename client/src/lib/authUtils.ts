export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function getUserRole(user: any): "admin" | "operator" | "viewer" {
  return user?.role || "viewer";
}

export function canManagePolicies(user: any): boolean {
  const role = getUserRole(user);
  return role === "admin";
}

export function canOperateActions(user: any): boolean {
  const role = getUserRole(user);
  return role === "admin" || role === "operator";
}

export function canViewData(user: any): boolean {
  return !!user;
}

export function getUserDisplayName(user: any): string {
  if (!user) return "Guest";
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) return user.firstName;
  if (user.email) return user.email.split("@")[0];
  return "User";
}

export function getUserInitials(user: any): string {
  if (!user) return "?";
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) return user.firstName[0].toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  return "U";
}
