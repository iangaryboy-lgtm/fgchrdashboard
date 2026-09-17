import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Users,
  MapPin,
  Video,
  FileText,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  UserCheck,
  UserX,
  QrCode,
  Archive,
  Award,
  Sparkles,
  ExternalLink,
  HelpCircle,
  Sliders,
  BarChart3,
} from 'lucide-react';
import { InternalCourse, CourseBatch, CourseEnrollment } from '../../../types';
import { formatTargetAudience } from '../../../utils/trainingUtils';
import { CourseEditModal } from './CourseEditModal';
import { BatchClassroomSettingsModal } from './BatchClassroomSettingsModal';
import { BatchStudentProgressTrackerModal } from './BatchStudentProgressTrackerModal';

export const InternalCoursesTab: React.FC = () => {
  const {
    internalCourses,
    addInternalCourse,
    updateInternalCourse,
    deleteInternalCourse,
    addCourseBatch,
    updateCourseBatch,
    deleteCourseBatch,
    archiveCourseBatch,
    trainingCategories,
    instructors,
    trainingMaterials,
    surveyForms,
    courseEnrollments,
    approveEnrollment,
    checkInEnrollment,
    cancelEnrollment,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState<'all' | 'physical' | 'online' | 'blended'>('all');

  // Expanded course IDs for accordion view
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({
    'crs-001': true,
    'crs-002': true,
  });

  // Active modal state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<InternalCourse | null>(null);

  // Batch modal state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchTargetCourseId, setBatchTargetCourseId] = useState<string | null>(null);
  const [editingBatch, setEditingBatch] = useState<CourseBatch | null>(null);

  // Roster Management Modal
  const [rosterBatch, setRosterBatch] = useState<{ course: InternalCourse; batch: CourseBatch } | null>(null);

  // Student Progress & Reminders Tracker Modal
  const [progressTrackerBatch, setProgressTrackerBatch] = useState<{ course: InternalCourse; batch: CourseBatch } | null>(null);

  // Classroom Settings Modal Target
  const [classroomSettingsTarget, setClassroomSettingsTarget] = useState<{ course: InternalCourse; batch: CourseBatch } | null>(null);

  // Batch Form States
  const [batchCode, setBatchCode] = useState('');
  const [batchName, setBatchName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [location, setLocation] = useState('遠雄金融中心 28F 訓練教室');
  const [onlineMeetingUrl, setOnlineMeetingUrl] = useState('');
  const [primaryInstructorId, setPrimaryInstructorId] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(30);
  const [allowWaitlist, setAllowWaitlist] = useState(true);
  const [maxWaitlist, setMaxWaitlist] = useState(10);
  const [regStartDate, setRegStartDate] = useState('');
  const [regEndDate, setRegEndDate] = useState('');

  const toggleExpand = (courseId: string) => {
    setExpandedCourses((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  const openAddCourseModal = () => {
    setEditingCourse(null);
    setIsCourseModalOpen(true);
  };

  const openEditCourseModal = (course: InternalCourse) => {
    setEditingCourse(course);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourseData = (courseData: Partial<InternalCourse>) => {
    if (editingCourse) {
      updateInternalCourse(editingCourse.id, courseData);
    } else {
      addInternalCourse({
        ...(courseData as any),
        status: 'published',
        batches: [],
      });
    }
    setIsCourseModalOpen(false);
  };

  // Open batch modal
  const openAddBatchModal = (courseId: string) => {
    const course = internalCourses.find((c) => c.id === courseId);
    setBatchTargetCourseId(courseId);
    setEditingBatch(null);
    setBatchCode(`B-${new Date().getFullYear()}-${String((course?.batches?.length || 0) + 1).padStart(2, '0')}`);
    setBatchName(`第 0${(course?.batches?.length || 0) + 1} 梯次`);
    setStartDate(new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10));
    setStartTime('09:00');
    setEndTime('17:00');
    setLocation(course?.deliveryType === 'online' ? 'Google Meet 視訊連線' : '遠雄總部 28F 智慧訓練中心');
    setOnlineMeetingUrl(course?.deliveryType === 'online' ? 'https://meet.google.com/fg-train' : '');
    setPrimaryInstructorId(instructors[0]?.id || '');
    setMaxParticipants(30);
    setAllowWaitlist(true);
    setMaxWaitlist(10);
    setRegStartDate(new Date().toISOString().slice(0, 10));
    setRegEndDate(new Date(Date.now() + 86400000 * 6).toISOString().slice(0, 10));
    setIsBatchModalOpen(true);
  };

  const openEditBatchModal = (courseId: string, batch: CourseBatch) => {
    setBatchTargetCourseId(courseId);
    setEditingBatch(batch);
    setBatchCode(batch.batchCode);
    setBatchName(batch.batchName);
    setStartDate(batch.startDate);
    setEndDate(batch.endDate);
    setStartTime(batch.startTime);
    setEndTime(batch.endTime);
    setLocation(batch.location || '');
    setOnlineMeetingUrl(batch.onlineMeetingUrl || '');
    setPrimaryInstructorId(batch.primaryInstructorId);
    setMaxParticipants(batch.maxParticipants);
    setAllowWaitlist(batch.allowWaitlist);
    setMaxWaitlist(batch.maxWaitlist);
    setRegStartDate(batch.registrationStartDate);
    setRegEndDate(batch.registrationEndDate);
    setIsBatchModalOpen(true);
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchTargetCourseId || !batchName.trim()) return;

    const inst = instructors.find((i) => i.id === primaryInstructorId);

    if (editingBatch) {
      updateCourseBatch(batchTargetCourseId, editingBatch.id, {
        batchCode,
        batchName,
        startDate,
        endDate,
        startTime,
        endTime,
        location,
        onlineMeetingUrl,
        primaryInstructorId,
        primaryInstructorName: inst?.name || '內部講師',
        maxParticipants: Number(maxParticipants),
        allowWaitlist,
        maxWaitlist: Number(maxWaitlist),
        registrationStartDate: regStartDate,
        registrationEndDate: regEndDate,
      });
    } else {
      addCourseBatch(batchTargetCourseId, {
        batchCode,
        batchName,
        startDate,
        endDate,
        startTime,
        endTime,
        location,
        onlineMeetingUrl,
        primaryInstructorId,
        primaryInstructorName: inst?.name || '內部講師',
        maxParticipants: Number(maxParticipants),
        allowWaitlist,
        maxWaitlist: Number(maxWaitlist),
        registrationStartDate: regStartDate,
        registrationEndDate: regEndDate,
        status: 'open',
      });
    }
    setIsBatchModalOpen(false);
  };

  const filteredCourses = internalCourses.filter((course) => {
    if (selectedCategory !== 'all' && course.categoryId !== selectedCategory) return false;
    if (selectedDelivery !== 'all' && course.deliveryType !== selectedDelivery) return false;
    if (
      searchTerm &&
      !course.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !course.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 font-semibold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">內部訓練課程管理</h3>
            <p className="text-xs text-slate-500">
              設定單堂/混成式課程、梯次開課排程、簽核審查與學員正取候補名單自動遞補
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openAddCourseModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            建立內部課程
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="搜尋課程名稱或代碼..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">訓練類別：</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">全部類別</option>
            {trainingCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">授課形式：</span>
          <select
            value={selectedDelivery}
            onChange={(e) => setSelectedDelivery(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">全部形式</option>
            <option value="physical">實體課程</option>
            <option value="online">線上課程</option>
            <option value="blended">混成式套裝</option>
          </select>
        </div>
      </div>

      {/* Courses Accordion / List */}
      <div className="space-y-4">
        {filteredCourses.map((course) => {
          const isExpanded = !!expandedCourses[course.id];
          const batches = course.batches || [];

          return (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all"
            >
              {/* Course Header Banner */}
              <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/40">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100/70 text-blue-700 border border-blue-200 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-800 text-white rounded-md text-[10px] font-bold">
                        {course.courseCode}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{course.title}</h4>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold">
                        {course.categoryName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          course.deliveryType === 'physical'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : course.deliveryType === 'online'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {course.deliveryType === 'physical'
                          ? '實體課程'
                          : course.deliveryType === 'online'
                          ? '線上課程'
                          : '混成式套裝'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>

                    {/* Meta info tags */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        時數：<strong className="text-slate-800">{course.hours} 小時</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        學分：<strong className="text-slate-800">{course.credits} 點</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        對象：{formatTargetAudience(course.targetAudience)}
                      </span>
                      {course.approvalRequired && (
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-[10px] font-semibold">
                          需主管審核 (
                          {course.approvalLevel === 'direct_manager'
                            ? '直屬主管'
                            : course.approvalLevel === 'dept_manager'
                            ? '部室主管'
                            : '總經理'}
                          )
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => openAddBatchModal(course.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    新增梯次
                  </button>
                  <button
                    onClick={() => openEditCourseModal(course)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="編輯課程設定"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`確定要刪除「${course.title}」課程及其所有梯次嗎？`)) {
                        deleteInternalCourse(course.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="刪除課程"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleExpand(course.id)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 text-xs font-medium"
                  >
                    <span>{batches.length} 個梯次</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Batches Table & Sub-management (when expanded) */}
              {isExpanded && (
                <div className="p-4 bg-white">
                  {batches.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      尚未建立任何開課梯次，請點擊上方「新增梯次」以排定開課日期與名額。
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <th className="py-2.5 px-3">梯次名稱 / 代碼</th>
                            <th className="py-2.5 px-3">開課日期與時間</th>
                            <th className="py-2.5 px-3">上課地點 / 連線</th>
                            <th className="py-2.5 px-3">授課講師</th>
                            <th className="py-2.5 px-3 text-center">正取人數 / 上限</th>
                            <th className="py-2.5 px-3 text-center">候補人數</th>
                            <th className="py-2.5 px-3 text-center">報名狀態</th>
                            <th className="py-2.5 px-3 text-right">操作管理</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {batches.map((batch) => {
                            const enrolledRegular = courseEnrollments.filter(
                              (e) => e.batchId === batch.id && e.listType === 'regular' && e.status !== 'cancelled'
                            ).length;
                            const enrolledWaitlist = courseEnrollments.filter(
                              (e) => e.batchId === batch.id && e.listType === 'waitlist' && e.status !== 'cancelled'
                            ).length;
                            const checkedInCount = courseEnrollments.filter(
                              (e) => e.batchId === batch.id && e.attendanceStatus === 'checked_in'
                            ).length;

                            return (
                              <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-slate-900">{batch.batchName}</div>
                                  <div className="text-[10px] text-slate-400">{batch.batchCode}</div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-slate-700 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    {batch.startDate} {batch.startDate !== batch.endDate && `~ ${batch.endDate}`}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {batch.startTime} - {batch.endTime}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-1 text-slate-700">
                                    {course.deliveryType === 'online' ? (
                                      <Video className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <MapPin className="w-3 h-3 text-amber-500" />
                                    )}
                                    <span className="line-clamp-1">{batch.location || '線上研習'}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-800">
                                  {batch.primaryInstructorName}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`inline-block font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                      enrolledRegular >= batch.maxParticipants
                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}
                                  >
                                    {enrolledRegular} / {batch.maxParticipants} 人
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center text-slate-600">
                                  {batch.allowWaitlist ? (
                                    <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] border border-amber-200">
                                      {enrolledWaitlist} / {batch.maxWaitlist} 人
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">不開放</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {batch.isArchived ? (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-medium">
                                      已歸檔結算
                                    </span>
                                  ) : batch.status === 'completed' ? (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                                      已結訓
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold">
                                      開放報名中
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setRosterBatch({ course, batch })}
                                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
                                      title="管理學員名單與簽到點名"
                                    >
                                      <Users className="w-3 h-3" />
                                      學員名冊 ({enrolledRegular + enrolledWaitlist})
                                    </button>
                                    <button
                                      onClick={() => setProgressTrackerBatch({ course, batch })}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
                                      title="檢視所有學員各階段研習狀況、詳細填答紀錄、催填提醒與匯出總表"
                                    >
                                      <BarChart3 className="w-3 h-3" />
                                      進度追蹤與催填
                                    </button>
                                    <button
                                      onClick={() => setClassroomSettingsTarget({ course, batch })}
                                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
                                      title="設定本梯次課前問卷Forms、教材講義、防掛機影音、隨堂測驗與SMART行動計畫"
                                    >
                                      <Sliders className="w-3 h-3" />
                                      教室設定
                                    </button>
                                    <button
                                      onClick={() => openEditBatchModal(course.id, batch)}
                                      className="p-1 text-slate-500 hover:text-blue-600 rounded-md hover:bg-blue-50"
                                      title="編輯梯次"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => archiveCourseBatch(course.id, batch.id)}
                                      className="p-1 text-slate-500 hover:text-amber-600 rounded-md hover:bg-amber-50"
                                      title="梯次歸檔"
                                    >
                                      <Archive className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`確定要刪除「${batch.batchName}」梯次嗎？`)) {
                                          deleteCourseBatch(course.id, batch.id);
                                        }
                                      }}
                                      className="p-1 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-50"
                                      title="刪除梯次"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">查無符合條件的課程</p>
          <p className="text-xs text-slate-400 mt-1">請調整篩選條件或點擊上方「建立內部課程」按鈕</p>
        </div>
      )}

      {/* Course Create/Edit Modal */}
      {isCourseModalOpen && (
        <CourseEditModal
          course={editingCourse}
          categories={trainingCategories}
          instructors={instructors}
          materials={trainingMaterials}
          onSave={handleSaveCourseData}
          onClose={() => setIsCourseModalOpen(false)}
        />
      )}

      {/* Batch Create/Edit Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                {editingBatch ? '編輯開課梯次' : '新增開課梯次排程'}
              </h3>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    梯次代碼 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    梯次名稱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="例: 2026年 第一梯次 (台北班)"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">開課起始日期</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">結訓日期</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">每日上課時間</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <span>~</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    指定主講講師 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={primaryInstructorId}
                    onChange={(e) => setPrimaryInstructorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    {instructors.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.organization} · {inst.title})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  上課地點 / Google Meet 視訊連線
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="例: 遠雄金融中心 28F 訓練教室 A 或 https://meet.google.com/..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">正取席位上限</label>
                  <input
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                    min="1"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">開放候補排隊</label>
                  <select
                    value={allowWaitlist ? 'yes' : 'no'}
                    onChange={(e) => setAllowWaitlist(e.target.value === 'yes')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="yes">開放候補</option>
                    <option value="no">不開放</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">候補名額上限</label>
                  <input
                    type="number"
                    value={maxWaitlist}
                    onChange={(e) => setMaxWaitlist(Number(e.target.value))}
                    min="0"
                    disabled={!allowWaitlist}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-800 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">報名開始日期</label>
                  <input
                    type="date"
                    value={regStartDate}
                    onChange={(e) => setRegStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">報名截止日期</label>
                  <input
                    type="date"
                    value={regEndDate}
                    onChange={(e) => setRegEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  {editingBatch ? '儲存梯次' : '建立梯次'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster & Attendance Check-in Modal */}
      {rosterBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  {rosterBatch.course.title} · {rosterBatch.batch.batchName} 學員名冊與點名
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  開課日期：{rosterBatch.batch.startDate} · 講師：{rosterBatch.batch.primaryInstructorName} · 地點：{rosterBatch.batch.location}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const current = rosterBatch;
                    setRosterBatch(null);
                    setProgressTrackerBatch(current);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  各階段執行狀況與催填總表
                </button>
                <button
                  onClick={() => setRosterBatch(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* List */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* Regular list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    正取學員名單 (
                    {
                      courseEnrollments.filter(
                        (e) => e.batchId === rosterBatch.batch.id && e.listType === 'regular' && e.status !== 'cancelled'
                      ).length
                    }{' '}
                    / {rosterBatch.batch.maxParticipants} 人)
                  </h4>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3">同仁姓名 / 工號</th>
                        <th className="py-2.5 px-3">部室 / 職稱</th>
                        <th className="py-2.5 px-3">報名時間</th>
                        <th className="py-2.5 px-3 text-center">簽核狀態</th>
                        <th className="py-2.5 px-3 text-center">報到狀態</th>
                        <th className="py-2.5 px-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {courseEnrollments
                        .filter(
                          (e) =>
                            e.batchId === rosterBatch.batch.id &&
                            (e.listType === 'regular' || e.listType === 'pending_approval') &&
                            e.status !== 'cancelled'
                        )
                        .map((enr) => (
                          <tr key={enr.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{enr.empName}</div>
                              <div className="text-[10px] text-slate-400">{enr.empNo}</div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {enr.department} {enr.title}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">{enr.enrolledAt}</td>
                            <td className="py-2.5 px-3 text-center">
                              {enr.approvalStatus === 'pending' ? (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-bold">
                                  待主管審核
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                                  已核准正取
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {enr.attendanceStatus === 'checked_in' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  已簽到 ({enr.checkInTime?.slice(11, 16) || '現場'})
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium text-[11px]">
                                  未報到
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {enr.approvalStatus === 'pending' && (
                                  <button
                                    onClick={() => approveEnrollment(enr.id, true, 'ADM-001', '人資主管核准')}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold"
                                  >
                                    核准報名
                                  </button>
                                )}
                                {enr.attendanceStatus !== 'checked_in' ? (
                                  <button
                                    onClick={() => checkInEnrollment(enr.id, 'manual_host')}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold flex items-center gap-1"
                                  >
                                    <QrCode className="w-3 h-3" />
                                    手動報到
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-emerald-600 font-semibold">簽到完成</span>
                                )}
                                <button
                                  onClick={() => {
                                    if (window.confirm(`確定要取消 ${enr.empName} 的報名嗎？取消後若有候補將自動遞補。`)) {
                                      cancelEnrollment(enr.id, '管理員手動調整名單');
                                    }
                                  }}
                                  className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-[10px] font-medium"
                                >
                                  取消席位
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Waitlist */}
              <div>
                <h4 className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  候補學員名單 (依序自動遞補)
                </h4>

                <div className="border border-amber-200 rounded-xl overflow-hidden shadow-xs bg-amber-50/20">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-amber-100/50 border-b border-amber-200 text-amber-900 font-semibold">
                        <th className="py-2.5 px-3">候補順位</th>
                        <th className="py-2.5 px-3">同仁姓名 / 工號</th>
                        <th className="py-2.5 px-3">部室 / 職稱</th>
                        <th className="py-2.5 px-3">排隊報名時間</th>
                        <th className="py-2.5 px-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {courseEnrollments
                        .filter((e) => e.batchId === rosterBatch.batch.id && e.listType === 'waitlist' && e.status !== 'cancelled')
                        .sort((a, b) => (a.waitlistRank || 999) - (b.waitlistRank || 999))
                        .map((enr) => (
                          <tr key={enr.id} className="hover:bg-amber-50/60 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="px-2.5 py-0.5 bg-amber-500 text-white rounded-full font-bold text-[10px]">
                                第 {enr.waitlistRank} 順位
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {enr.empName} ({enr.empNo})
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {enr.department} {enr.title}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">{enr.enrolledAt}</td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  if (window.confirm(`確定要將 ${enr.empName} 移除候補排隊嗎？`)) {
                                    cancelEnrollment(enr.id, '取消候補');
                                  }
                                }}
                                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-[10px] font-medium"
                              >
                                取消候補
                              </button>
                            </td>
                          </tr>
                        ))}
                      {courseEnrollments.filter(
                        (e) => e.batchId === rosterBatch.batch.id && e.listType === 'waitlist' && e.status !== 'cancelled'
                      ).length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-xs text-slate-400">
                            目前無候補排隊學員
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setRosterBatch(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900"
              >
                關閉名冊
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Classroom Settings Modal */}
      {classroomSettingsTarget && (
        <BatchClassroomSettingsModal
          course={classroomSettingsTarget.course}
          batch={classroomSettingsTarget.batch}
          onSave={(updatedBatch, updatedCourseData) => {
            updateCourseBatch(classroomSettingsTarget.course.id, updatedBatch.id, updatedBatch);
            if (updatedCourseData) {
              updateInternalCourse(classroomSettingsTarget.course.id, updatedCourseData);
            }
          }}
          onClose={() => setClassroomSettingsTarget(null)}
        />
      )}

      {/* Batch Student Progress Tracker & Reminders Modal */}
      {progressTrackerBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <BatchStudentProgressTrackerModal
              course={progressTrackerBatch.course}
              batch={progressTrackerBatch.batch}
              onClose={() => setProgressTrackerBatch(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
