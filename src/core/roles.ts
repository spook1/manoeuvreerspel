export type AppRole = string | null | undefined;

export function normalizeRole(role: AppRole): string {
    const raw = (role ?? '')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');

    if (!raw) return 'speler';
    if (raw === 'admin' || raw === 'superadmin' || raw === 'super_admin') return 'super_admin';
    if (raw === 'user' || raw === 'student' || raw === 'player') return 'speler';
    if (raw === 'game_master' || raw === 'gm') return 'gamemaster';
    return raw;
}

export function hasUserManagementAccess(role: AppRole): boolean {
    const normalized = normalizeRole(role);
    return normalized === 'super_admin';
}

export function hasOfficialCurationAccess(role: AppRole): boolean {
    const normalized = normalizeRole(role);
    return normalized === 'super_admin' || normalized === 'gamemaster';
}

export function hasCreatorAccess(role: AppRole): boolean {
    const normalized = normalizeRole(role);
    return normalized === 'super_admin'
        || normalized === 'gamemaster'
        || normalized === 'pro';
}
