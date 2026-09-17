import React, { useState, useMemo } from 'react';
import {
  Compass,
  GraduationCap,
  Award,
  Users,
  ShieldCheck,
  Plus,
  Lock,
  UserCheck,
  Presentation,
  Sparkles,
  FileCheck2,
  BarChart3,
} from 'lucide-react';
import { CourseCatalogView } from './training/CourseCatalogView';
import { MyLearningView } from './training/MyLearningView';
import { ManagerCoachingView } from './training/ManagerCoachingView';
import { LecturerPortalView } from './training/LecturerPortalView';
import { MyResumeLicensesView } from './resume/MyResumeLicensesView';
import { AddResumeLicenseModal } from './resume/AddResumeLicenseModal';
import { DepartmentCompletionDashboard } from './training/DepartmentCompletionDashboard';
import { useApp } from '../../context/AppContext';
import { isUserManager } from '../../utils/orgScope';

export const TrainingPortal: React.FC = () => {
  const { employees, currentUser, orgTree, permissionMatrix, instructors, courseEnrollments } = useApp();

  // Strict binding to logged-in account (with Google admin matching & employee fallback)
  const boundEmployee = useMemo(() => {
    if (currentUser?.employee) return currentUser.employee;
    if (currentUser?.empNo) {
      const match = employees.find((e) => (e.empNo || '').toUpperCase() === currentUser.empNo?.toUpperCase());
      if (match) return match;
    }
    if (currentUser?.type === 'google_admin' && currentUser?.googleEmail) {
      const matchByEmail = employees.find(
        (e) => (e.email || '').toLowerCase() === currentUser.googleEmail?.toLowerCase()
      );
      if (matchByEmail) return matchByEmail;
    }
    return employees.find((e) => e.status === '在職') || employees[0];
  }, [currentUser, employees]);

  const boundEmpNo = boundEmployee?.empNo || 'FG1001';

  // Determine if the bound user has a manager / supervisor role in the organization tree
  const isManagerRole = useMemo(() => {
    return isUserManager(currentUser, orgTree, permissionMatrix);
  }, [currentUser, orgTree, permissionMatrix]);

  // Determine if the user or employee is registered in the Instructor Database
  const isInstructorPersonnel = useMemo(() => {
    return (
      instructors.some(
        (i) =>
          i.empNo === boundEmpNo ||
          i.name === boundEmployee?.name ||
          i.empNo === currentUser?.empNo
      ) ||
      currentUser?.role === 'super_admin' ||
      currentUser?.role === 'hr_admin'
    );
  }, [instructors, boundEmpNo, boundEmployee, currentUser]);

  // Pending assignments count for instructor badge
  const pendingAssignmentsCount = useMemo(() => {
    return courseEnrollments.filter(
      (e) =>
        e.assignmentSubmission &&
        (e.assignmentSubmission.status === 'submitted' ||
          e.assignmentSubmission.gradeStatus === 'pending')
    ).length;
  }, [courseEnrollments]);

  const [activeTab, setActiveTab] = useState<
    'catalog' | 'my_learning' | 'my_resume' | 'department_dashboard' | 'manager' | 'lecturer'
  >('catalog');

  // Fallback if non-manager tries to view manager tab
  const currentTab = (!isManagerRole && activeTab === 'manager') ? 'catalog' : activeTab;

  const [isAddResumeOpen, setIsAddResumeOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Navigation Sub-bar & Bound User Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'catalog'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            選課中心 (課程總覽)
          </button>
          <button
            onClick={() => setActiveTab('my_learning')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'my_learning'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            我的學習專區 (報到 / 教室 / SMART / 證書)
          </button>
          <button
            onClick={() => setActiveTab('department_dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'department_dashboard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 bg-blue-50/60 hover:bg-blue-100/60 border border-blue-200/50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-600" />
            部門學習完成率統計
          </button>
          <button
            onClick={() => setActiveTab('my_resume')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'my_resume'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Award className="w-4 h-4" />
            個人資料專區
          </button>

          {/* Lecturer Portal Tab (Clean tab title without parentheses) */}
          <button
            onClick={() => setActiveTab('lecturer')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'lecturer'
                ? 'bg-gradient-to-r from-amber-600 to-indigo-600 text-white shadow-xs'
                : 'text-amber-900 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/60'
            }`}
          >
            <Presentation className="w-4 h-4 text-amber-500" />
            講師專區
            {pendingAssignmentsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-black rounded-full animate-pulse">
                {pendingAssignmentsCount} 待審
              </span>
            )}
          </button>

          {/* Only display Manager Coaching view if user holds a manager role in the org tree */}
          {isManagerRole && (
            <button
              onClick={() => setActiveTab('manager')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'manager'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/60'
              }`}
            >
              <UserCheck className="w-4 h-4 text-indigo-400" />
              主管培育專區 (簽核 / 評核)
            </button>
          )}
        </div>

        {/* Bound Logged-in Account Tag & Add License Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddResumeOpen(true)}
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            新增證照
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-semibold">登入帳號綁定：</span>
            <strong className="text-slate-900 font-black">
              {boundEmployee?.name || '同仁'} ({boundEmployee?.empNo})
            </strong>
            <span className="text-[11px] text-slate-500">
              · {boundEmployee?.department} {isManagerRole ? '(主管職)' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Render Active View with Bound Employee No */}
      {currentTab === 'catalog' && (
        <CourseCatalogView
          currentEmpNo={boundEmpNo}
          onNavigateToMyLearning={() => setActiveTab('my_learning')}
        />
      )}

      {currentTab === 'my_learning' && (
        <MyLearningView currentEmpNo={boundEmpNo} />
      )}

      {currentTab === 'department_dashboard' && (
        <DepartmentCompletionDashboard />
      )}

      {currentTab === 'my_resume' && (
        <MyResumeLicensesView empNo={boundEmpNo} />
      )}

      {currentTab === 'lecturer' && (
        <LecturerPortalView currentEmpNo={boundEmpNo} />
      )}

      {currentTab === 'manager' && isManagerRole && <ManagerCoachingView />}

      {/* Global Add Resume / License Modal */}
      <AddResumeLicenseModal
        isOpen={isAddResumeOpen}
        onClose={() => setIsAddResumeOpen(false)}
        empNo={boundEmpNo}
      />
    </div>
  );
};



