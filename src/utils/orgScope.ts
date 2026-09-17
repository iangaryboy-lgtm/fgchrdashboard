import { CurrentUser } from '../context/AppContext';
import { OrgNode, PermissionMatrixItem, CandidateProfile, ProjectPlan, Employee } from '../types';

export interface OrgScopeResult {
  isFullAccess: boolean;
  accessibleUnits: string[];
  leaderUnits: string[];
  userDept: string;
  userSection: string;
  userEmpNo: string;
  userName: string;
  scopeDescription: string;
}

/**
 * Recursively collect all descendant node names and codes for a given node.
 */
function collectDescendantNames(node: OrgNode, acc: Set<string>) {
  if (node.name) acc.add(node.name);
  if (node.code) acc.add(node.code);
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      collectDescendantNames(child, acc);
    }
  }
}

/**
 * Find nodes where user is assigned or where user is designated as leader.
 */
function findUserAndLeaderNodes(
  node: OrgNode,
  userDept: string,
  userSection: string,
  userEmpNo: string,
  userName: string,
  assignedNodes: OrgNode[],
  leaderNodes: OrgNode[]
) {
  const nodeName = node.name || '';
  const nodeLeaderNo = node.leaderEmpNo || '';
  const nodeLeaderName = node.leaderName || '';

  // Check if user is leader of this node
  const isLeader =
    (userEmpNo && nodeLeaderNo && nodeLeaderNo.toLowerCase() === userEmpNo.toLowerCase()) ||
    (userName && nodeLeaderName && nodeLeaderName.toLowerCase() === userName.toLowerCase());

  if (isLeader) {
    leaderNodes.push(node);
  }

  // Check if this node matches user's department or section
  const isAssigned =
    (userDept && nodeName.includes(userDept)) ||
    (userSection && nodeName.includes(userSection)) ||
    (userDept && userDept.includes(nodeName) && nodeName.length >= 3);

  if (isAssigned) {
    assignedNodes.push(node);
  }

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      findUserAndLeaderNodes(
        child,
        userDept,
        userSection,
        userEmpNo,
        userName,
        assignedNodes,
        leaderNodes
      );
    }
  }
}

/**
 * Compute the data access scope for the current logged-in user.
 */
export function getOrgScope(
  currentUser: CurrentUser | null,
  orgTree: OrgNode,
  permissionMatrix: PermissionMatrixItem[]
): OrgScopeResult {
  // If not logged in
  if (!currentUser) {
    return {
      isFullAccess: true, // Default public demo view before auth
      accessibleUnits: [],
      leaderUnits: [],
      userDept: '',
      userSection: '',
      userEmpNo: '',
      userName: '',
      scopeDescription: '公開前台檢視',
    };
  }

  // 1. Google Admin accounts have full company-wide access
  if (currentUser.type === 'google_admin') {
    return {
      isFullAccess: true,
      accessibleUnits: [],
      leaderUnits: [],
      userDept: '總管理處',
      userSection: '',
      userEmpNo: '',
      userName: currentUser.googleEmail || 'Google Admin',
      scopeDescription: '全公司總權限 (Google 管理員)',
    };
  }

  const emp = currentUser.employee;
  const userEmpNo = emp?.empNo || currentUser.empNo || '';
  const userName = emp?.name || '';
  const userDept = emp?.department || '';
  const userSection = emp?.section || '';

  // 2. Check if user has backend management permission or HR department admin status
  const userPerm = permissionMatrix.find((p) => p.empNo === userEmpNo);
  const isHrDept = userDept === '人力資源室' || userDept.includes('人資');
  const hasBackendPermission = userPerm?.canAccessBackend === true;

  if (hasBackendPermission || isHrDept) {
    return {
      isFullAccess: true,
      accessibleUnits: [],
      leaderUnits: [],
      userDept,
      userSection,
      userEmpNo,
      userName,
      scopeDescription: '全公司後台總權限 (人資/管理授權)',
    };
  }

  // 3. Regular employee: restricted to self, assigned department, all subordinate units, and units led
  const assignedNodes: OrgNode[] = [];
  const leaderNodes: OrgNode[] = [];

  findUserAndLeaderNodes(
    orgTree,
    userDept,
    userSection,
    userEmpNo,
    userName,
    assignedNodes,
    leaderNodes
  );

  const unitSet = new Set<string>();

  // Add user's literal department & section
  if (userDept) unitSet.add(userDept);
  if (userSection) unitSet.add(userSection);

  // Collect all descendants of assigned department
  for (const node of assignedNodes) {
    collectDescendantNames(node, unitSet);
  }

  // Collect all descendants of units where user is a leader
  const leaderUnitNames: string[] = [];
  for (const node of leaderNodes) {
    leaderUnitNames.push(node.name);
    collectDescendantNames(node, unitSet);
  }

  const accessibleUnits = Array.from(unitSet);

  let scopeDescription = `所屬單位【${userDept || '個人'}】`;
  if (leaderUnitNames.length > 0) {
    scopeDescription += ` 及主管管轄單位【${leaderUnitNames.join('、')}】`;
  }
  scopeDescription += ' 與轄下所有案場';

  return {
    isFullAccess: false,
    accessibleUnits,
    leaderUnits: leaderUnitNames,
    userDept,
    userSection,
    userEmpNo,
    userName,
    scopeDescription,
  };
}

/**
 * Filter candidates based on org scope.
 */
export function filterCandidatesByScope(
  candidates: CandidateProfile[],
  scope: OrgScopeResult
): CandidateProfile[] {
  if (scope.isFullAccess) return candidates;

  return candidates.filter((c) => {
    // 1. Always allow viewing self
    if (c.empNo && scope.userEmpNo && c.empNo === scope.userEmpNo) {
      return true;
    }

    // 2. Check if candidate's department or section matches accessible units
    const candDept = c.department || '';
    const candSec = c.section || '';
    const candCurrentProject = c.currentProject || '';
    const candProjectCode = c.currentProjectCode || '';

    const isMatch = scope.accessibleUnits.some((unit) => {
      if (!unit) return false;
      return (
        candDept.includes(unit) ||
        unit.includes(candDept) ||
        candSec.includes(unit) ||
        unit.includes(candSec) ||
        candCurrentProject.includes(unit) ||
        candProjectCode.includes(unit)
      );
    });

    return isMatch;
  });
}

/**
 * Filter project plans based on org scope.
 */
export function filterProjectsByScope(
  projects: ProjectPlan[],
  scope: OrgScopeResult
): ProjectPlan[] {
  if (scope.isFullAccess) return projects;

  // Match project region, code, or matched leader against user's accessible scope
  return projects.filter((p) => {
    // 1. If project matches leader empNo
    if (p.matchedLeaderEmpNo && p.matchedLeaderEmpNo === scope.userEmpNo) {
      return true;
    }

    // 2. If project code or region matches accessible units
    const isCodeOrRegionMatch = scope.accessibleUnits.some((unit) => {
      if (!unit) return false;
      // e.g. "工程一部" covers North region projects, "工程二部" covers Central/South projects
      const isNorthDept = unit.includes('一部') || unit.includes('北部') || unit.includes('新竹') || unit.includes('桃苗');
      const isSouthDept = unit.includes('二部') || unit.includes('中南部') || unit.includes('台中') || unit.includes('台南') || unit.includes('高雄');

      if (isNorthDept && (p.region.includes('桃園') || p.region.includes('新北') || p.region.includes('台北') || p.region.includes('新竹'))) {
        return true;
      }
      if (isSouthDept && (p.region.includes('台南') || p.region.includes('高雄') || p.region.includes('台中') || p.region.includes('屏東'))) {
        return true;
      }
      return unit.includes(p.projectCode) || p.projectCode.includes(unit);
    });

    return isCodeOrRegionMatch;
  });
}

/**
 * Check if the user is designated as a manager (主管角色) in the organization tree or by role/rank.
 */
export function isUserManager(
  currentUser: CurrentUser | null,
  orgTree: OrgNode,
  permissionMatrix?: PermissionMatrixItem[]
): boolean {
  if (!currentUser) return false;
  if (currentUser.type === 'google_admin') return true;

  const emp = currentUser.employee;
  const userEmpNo = emp?.empNo || currentUser.empNo || '';
  const userName = emp?.name || '';
  const userTitle = emp?.title || '';
  const userRank = emp?.rank || '';

  // 1. Check if user is a designated leader in any orgTree node
  const leaderNodes: OrgNode[] = [];
  const assignedNodes: OrgNode[] = [];
  findUserAndLeaderNodes(
    orgTree,
    emp?.department || '',
    emp?.section || '',
    userEmpNo,
    userName,
    assignedNodes,
    leaderNodes
  );
  if (leaderNodes.length > 0) return true;

  // 2. Check title / rank rules
  const managerTitles = [
    '經理',
    '副理',
    '處長',
    '總經理',
    '副總',
    '協理',
    '主任',
    '組長',
    '所長',
    '科長',
    '案主管',
    '部長',
    '負責人',
  ];
  if (managerTitles.some((t) => userTitle.includes(t))) return true;
  if (['07', '08', '09'].includes(userRank)) return true;

  // 3. Check permission matrix
  if (permissionMatrix && userEmpNo) {
    const userPerm = permissionMatrix.find((p) => p.empNo === userEmpNo);
    if (userPerm?.canAccessBackend) return true;
  }

  return false;
}

export interface OrgTreeSubordinatesScope {
  isManager: boolean;
  canSelectSubordinates: boolean;
  loggedInEmployee: Employee;
  subordinateEmployees: Employee[];
  scopeTitle: string;
  scopeDescription: string;
  accessibleUnits: string[];
  isFullCompany: boolean;
}

/**
 * Determine whether a user is designated as a manager in the organization tree (組織樹設定之主管),
 * and return their accessible subordinate personnel for course enrollment.
 * 
 * Rules:
 * 1. If Google Admin -> Full access, can select any employee.
 * 2. If designated as a leader (leaderEmpNo or leaderName) in any node of the org tree,
 *    or leading a division/department node -> isManager = true, subordinates = self + all employees in that node & its subtree.
 * 3. Otherwise (regular employee like 陳鈺安, 副管理師) -> isManager = false, canSelectSubordinates = false,
 *    subordinates = [self] (strictly locked to self).
 */
export function getOrgTreeSubordinatesScope(
  currentUser: CurrentUser | null,
  employees: Employee[],
  orgTree: OrgNode,
  currentEmpNoOverride?: string
): OrgTreeSubordinatesScope {
  // Resolve current logged in employee
  let loggedInEmp: Employee | undefined;
  if (currentEmpNoOverride) {
    const q = currentEmpNoOverride.trim().toUpperCase();
    loggedInEmp = employees.find(
      (e) => (e.empNo || '').toUpperCase() === q || e.name === currentEmpNoOverride
    );
  }
  if (!loggedInEmp && currentUser?.employee) {
    loggedInEmp = currentUser.employee;
  }
  if (!loggedInEmp && currentUser?.empNo) {
    loggedInEmp = employees.find((e) => (e.empNo || '').toUpperCase() === currentUser.empNo?.toUpperCase());
  }
  if (!loggedInEmp && currentUser?.type === 'google_admin' && currentUser?.googleEmail) {
    loggedInEmp = employees.find(
      (e) => (e.email || '').toLowerCase() === currentUser.googleEmail?.toLowerCase()
    );
  }
  if (!loggedInEmp) {
    loggedInEmp = employees.find((e) => e.status === '在職') || employees[0];
  }

  const fallbackEmp: Employee = loggedInEmp || employees[0] || ({
    id: 'emp-fallback',
    empNo: 'FG1001',
    name: '同仁',
    department: '總管理處',
    section: '企劃組',
    title: '工程師',
    rank: '06',
    attribute: '內業',
    birthday: '1990-01-01',
    seniorityStartDate: '2020-01-01',
    pin: '1001',
    email: 'user@farglory.com.tw',
    status: '在職',
  } as Employee);

  const userEmpNo = (fallbackEmp.empNo || '').trim();
  const userName = (fallbackEmp.name || '').trim();
  const userDept = (fallbackEmp.department || '').trim();

  // 1. Google Admin has company-wide permission
  if (currentUser?.type === 'google_admin') {
    return {
      isManager: true,
      canSelectSubordinates: true,
      loggedInEmployee: fallbackEmp,
      subordinateEmployees: employees,
      scopeTitle: '全公司組織權限 (系統總管理員)',
      scopeDescription: '具備全公司各處所同仁選課報名指派權限',
      accessibleUnits: ['全公司'],
      isFullCompany: true,
    };
  }

  // 2. Search orgTree for nodes where user is designated as the leader
  const leaderNodes: OrgNode[] = [];
  function searchLeaderNodes(node: OrgNode) {
    const leaderNo = (node.leaderEmpNo || '').trim().toLowerCase();
    const leaderNm = (node.leaderName || '').trim().toLowerCase();
    const targetNo = userEmpNo.toLowerCase();
    const targetNm = userName.toLowerCase();

    const isMatch =
      (targetNo && leaderNo && leaderNo === targetNo) ||
      (targetNm && leaderNm && (leaderNm.includes(targetNm) || targetNm.includes(leaderNm)));

    if (isMatch) {
      leaderNodes.push(node);
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        searchLeaderNodes(child);
      }
    }
  }

  if (userEmpNo || userName) {
    searchLeaderNodes(orgTree);
  }

  // Check if executive title and leading department
  if (leaderNodes.length === 0 && fallbackEmp.title) {
    const title = fallbackEmp.title;
    const isExecutive = ['處長', '總經理', '副總', '協理', '主任', '所長', '科長', '組長', '案主管', '經理'].some((t) =>
      title.includes(t)
    );
    if (isExecutive && userDept) {
      function searchDeptNodes(node: OrgNode) {
        if (
          (node.name.includes(userDept) || userDept.includes(node.name)) &&
          node.name.length >= 3
        ) {
          leaderNodes.push(node);
        }
        if (node.children) {
          for (const child of node.children) {
            searchDeptNodes(child);
          }
        }
      }
      searchDeptNodes(orgTree);
    }
  }

  // 3. If NOT a leader in any node of the org tree:
  // Strictly locked to self
  if (leaderNodes.length === 0) {
    return {
      isManager: false,
      canSelectSubordinates: false,
      loggedInEmployee: fallbackEmp,
      subordinateEmployees: [fallbackEmp],
      scopeTitle: '一般同仁 (已鎖定本人)',
      scopeDescription: '依公司組織授權規範，已鎖定為目前登入同仁本人報名',
      accessibleUnits: [userDept || '個人'],
      isFullCompany: false,
    };
  }

  // 4. Collect all descendant units of the led nodes
  const unitSet = new Set<string>();
  const leaderUnitNames = leaderNodes.map((n) => n.name);
  for (const node of leaderNodes) {
    collectDescendantNames(node, unitSet);
  }
  const accessibleUnits = Array.from(unitSet);

  // Check if root or president
  const isTopExecutive = leaderNodes.some(
    (n) => n.level === 'board' || n.level === 'president' || n.code === 'BOD' || n.code === 'PRE'
  );

  let subList: Employee[] = [];
  if (isTopExecutive) {
    subList = [...employees];
  } else {
    subList = employees.filter((emp) => {
      if (emp.empNo === userEmpNo) return true;

      const eDept = emp.department || '';
      const eSec = emp.section || '';
      const eProj = emp.currentProject || '';
      const eCode = emp.currentProjectCode || '';

      return accessibleUnits.some((unit) => {
        if (!unit) return false;
        return (
          eDept.includes(unit) ||
          unit.includes(eDept) ||
          eSec.includes(unit) ||
          unit.includes(eSec) ||
          eProj.includes(unit) ||
          unit.includes(eProj) ||
          (eCode && unit.includes(eCode))
        );
      });
    });
  }

  // Ensure self is at the front
  if (!subList.some((e) => e.empNo === userEmpNo)) {
    subList.unshift(fallbackEmp);
  } else {
    subList = [
      fallbackEmp,
      ...subList.filter((e) => e.empNo !== userEmpNo),
    ];
  }

  return {
    isManager: true,
    canSelectSubordinates: true,
    loggedInEmployee: fallbackEmp,
    subordinateEmployees: subList,
    scopeTitle: `${leaderUnitNames.join('、')} 主管權限`,
    scopeDescription: `管轄單位：${leaderUnitNames.join('、')} 暨轄下同仁 (共 ${subList.length} 位)`,
    accessibleUnits,
    isFullCompany: isTopExecutive,
  };
}


