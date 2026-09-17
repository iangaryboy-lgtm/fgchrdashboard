import { M365AuthSession } from '../types';
import { safeStorage } from '../utils/safeStorage';
export type { M365AuthSession };

const localStorage = safeStorage;

const STORAGE_KEY = 'farglory_m365_auth_session';

export const DEFAULT_M365_SESSION: M365AuthSession = {
  networkEnvironment: 'corporate_domain',
  isDomainJoined: true,
  isM365Authenticated: true,
  authMethod: 'domain_sso',
  userAccount: 'ian.chen@farglorygroup.com.tw',
  userName: '陳鈺安 (工程師)',
  empNo: 'FG1001',
  department: '建築工程處 工務部',
  tenantDomain: 'farglorygroup.com.tw (遠雄集團 Azure AD / Entra ID 租戶)',
  folderSharePermission: 'can_edit',
  tokenExpiry: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
  lastVerifiedAt: new Date().toISOString(),
};

/**
 * Retrieves the current Microsoft 365 / Corporate Domain session
 */
export function getM365AuthSession(): M365AuthSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_M365_SESSION,
        ...parsed,
      };
    }
  } catch (err) {
    console.warn('[M365AuthService] Failed to read storage:', err);
  }
  return DEFAULT_M365_SESSION;
}

/**
 * Saves updated M365 session to storage and emits custom event
 */
export function saveM365AuthSession(session: M365AuthSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent('m365_auth_changed', { detail: session }));
  } catch (err) {
    console.warn('[M365AuthService] Failed to save session:', err);
  }
}

/**
 * Switches network environment between corporate intranet domain (automatic SSO)
 * and external network (requires M365 account sign-in)
 */
export function switchNetworkEnvironment(
  env: 'corporate_domain' | 'external_network',
  currentUser?: { name?: string; empNo?: string; department?: string; email?: string }
): M365AuthSession {
  const current = getM365AuthSession();
  const userName = currentUser?.name || current.userName || '陳工程師';
  const empNo = currentUser?.empNo || current.empNo || 'FG1001';
  const department = currentUser?.department || current.department || '建築工程處';

  let updated: M365AuthSession;

  if (env === 'corporate_domain') {
    updated = {
      ...current,
      networkEnvironment: 'corporate_domain',
      isDomainJoined: true,
      isM365Authenticated: true,
      authMethod: 'domain_sso',
      userAccount: currentUser?.email || `${empNo.toLowerCase()}@farglorygroup.com.tw`,
      userName,
      empNo,
      department,
      folderSharePermission: 'can_edit',
      lastVerifiedAt: new Date().toISOString(),
    };
  } else {
    // External network: Keep login state if already authenticated or prompt login
    updated = {
      ...current,
      networkEnvironment: 'external_network',
      isDomainJoined: false,
      isM365Authenticated: current.authMethod === 'm365_login' ? true : false,
      authMethod: current.authMethod === 'm365_login' ? 'm365_login' : 'unauthenticated',
      folderSharePermission: current.authMethod === 'm365_login' ? 'can_edit' : 'can_view',
      lastVerifiedAt: new Date().toISOString(),
    };
  }

  saveM365AuthSession(updated);
  return updated;
}

/**
 * Performs M365 SSO Login for non-corporate network devices
 */
export async function loginWithM365Account(
  account: string,
  userDisplayName?: string,
  empNo?: string,
  department?: string
): Promise<M365AuthSession> {
  const cleanAccount = account.trim().toLowerCase();
  const formattedAccount = cleanAccount.includes('@')
    ? cleanAccount
    : `${cleanAccount}@farglorygroup.com.tw`;

  const session: M365AuthSession = {
    networkEnvironment: 'external_network',
    isDomainJoined: false,
    isM365Authenticated: true,
    authMethod: 'm365_login',
    userAccount: formattedAccount,
    userName: userDisplayName || '遠雄同仁',
    empNo: empNo || 'FG' + Math.floor(1000 + Math.random() * 9000),
    department: department || '建築工程處',
    tenantDomain: 'farglorygroup.com.tw (Azure Entra ID 認證)',
    folderSharePermission: 'can_edit',
    tokenExpiry: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    lastVerifiedAt: new Date().toISOString(),
  };

  saveM365AuthSession(session);
  return session;
}

/**
 * Sign out of M365 on external network
 */
export function logoutM365Account(): M365AuthSession {
  const current = getM365AuthSession();
  const session: M365AuthSession = {
    ...current,
    networkEnvironment: 'external_network',
    isDomainJoined: false,
    isM365Authenticated: false,
    authMethod: 'unauthenticated',
    folderSharePermission: 'can_view',
    lastVerifiedAt: new Date().toISOString(),
  };

  saveM365AuthSession(session);
  return session;
}

/**
 * Returns shared folder permission and direct editable URLs
 */
export function getSharedFolderPermissions() {
  return {
    permissionLevel: 'can_edit' as const,
    permissionName: '具備完整編輯與上傳權限 (Can Edit)',
    shareScope: '遠雄集團組織內部擁有連結之成員 (People in Farglory Group with the link)',
    isPreConfiguredEditable: true,
    sharePointDefaultUrl: 'https://farglorygroup-my.sharepoint.com/personal/hr_train/Documents/2026/PMP/DAY_7/',
    notes: '本分享資料夾已由管理員預先設定為「可編輯」之內部共用連結，同仁無論在公司網域或外部登入 M365 後均可直接上傳作業與編輯檔案。',
  };
}
