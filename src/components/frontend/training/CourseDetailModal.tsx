import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Video,
  Award,
  Users,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Play,
  ExternalLink,
  Download,
  Briefcase,
  FileSpreadsheet,
  Presentation,
  Cloud,
  Lock,
  Unlock,
  ArrowRight,
  UserCheck,
  Search,
  ShieldCheck,
  Filter,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { InternalCourse, CourseBatch, TrainingMaterial, Employee } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { getOrgTreeSubordinatesScope } from '../../../utils/orgScope';
import { SubordinatePersonnelPickerModal } from './SubordinatePersonnelPickerModal';
import {
  formatTargetAudience,
  detectMaterialMediaType,
  getYouTubeEmbedUrl,
  extractYouTubeVideoId,
  isMicrosoftVideoUrl,
  getMicrosoftVideoEmbedUrl,
  isOneDriveDocUrl,
  detectOneDriveDocType,
} from '../../../utils/trainingUtils';
import { PdfViewerModal } from '../../common/PdfViewerModal';
import { OneDriveDocumentViewerModal } from '../../common/OneDriveDocumentViewerModal';
import { OnlineClassroomModal } from './OnlineClassroomModal';

interface CourseDetailModalProps {
  course: InternalCourse;
  currentEmpNo?: string;
  onClose: () => void;
  onEnrolledSuccess?: () => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  course,
  currentEmpNo,
  onClose,
  onEnrolledSuccess,
}) => {
  const { employees, enrollInBatch, courseEnrollments, currentUser, orgTree } = useApp();
  const [selectedBatchId, setSelectedBatchId] = useState<string>(course.batches?.[0]?.id || '');
  const [isPersonnelPickerOpen, setIsPersonnelPickerOpen] = useState(false);

  // Compute personnel scope according to org tree rules:
  // Non-managers are strictly locked to self. Only org tree managers can select subordinates via filter screen.
  const personnelScope = useMemo(() => {
    return getOrgTreeSubordinatesScope(currentUser, employees, orgTree, currentEmpNo);
  }, [currentUser, employees, orgTree, currentEmpNo]);

  const [targetEmpNo, setTargetEmpNo] = useState<string>(
    personnelScope.loggedInEmployee?.empNo || currentEmpNo || 'FG1001'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'waitlist' | 'error'; text: string } | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<TrainingMaterial | null>(null);
  const [pdfModalMaterial, setPdfModalMaterial] = useState<TrainingMaterial | null>(null);
  const [oneDriveModalMaterial, setOneDriveModalMaterial] = useState<TrainingMaterial | null>(null);
  const [isClassroomOpen, setIsClassroomOpen] = useState(false);

  // Strictly enforce locking for non-managers to the logged in employee
  useEffect(() => {
    if (!personnelScope.canSelectSubordinates) {
      if (targetEmpNo !== personnelScope.loggedInEmployee.empNo) {
        setTargetEmpNo(personnelScope.loggedInEmployee.empNo);
      }
    }
  }, [personnelScope.canSelectSubordinates, personnelScope.loggedInEmployee.empNo, targetEmpNo]);

  const batches = course.batches || [];
  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  // Check enrollment status for gatekeeping
  const existingEnrollment = courseEnrollments.find(
    (e) => e.courseId === course.id && e.empNo === targetEmpNo && e.status !== 'cancelled'
  );
  const isEnrolled = !!existingEnrollment && existingEnrollment.listType === 'regular';
  const isWaitlisted = !!existingEnrollment && existingEnrollment.listType === 'waitlist';

  const handleEnroll = () => {
    if (!selectedBatch) {
      alert('請先選擇開課梯次');
      return;
    }

    const currentEmp =
      employees.find((e) => (e.empNo || '').trim().toUpperCase() === (targetEmpNo || '').trim().toUpperCase()) ||
      employees.find((e) => (e.name || '').trim() === (targetEmpNo || '').trim()) ||
      employees[0];
    if (!currentEmp) {
      setResultMsg({
        type: 'error',
        text: '請選擇有效的報名同仁',
      });
      return;
    }

    setIsSubmitting(true);
    const res = enrollInBatch({
      courseId: course.id,
      batchId: selectedBatch.id,
      empNo: currentEmp.empNo,
    });

    if (res.success) {
      const isWait = res.listType === 'waitlist' || res.enrollment?.listType === 'waitlist';
      const rank = res.waitlistRank || res.enrollment?.waitlistRank || 1;
      if (isWait) {
        setResultMsg({
          type: 'waitlist',
          text: `正取席位已滿！您已排入「候補第 ${rank} 順位」，待有正取名額釋出將自動遞補並開放教室權限。`,
        });
      } else {
        setResultMsg({
          type: 'success',
          text: course.approvalRequired
            ? '報名成功！已送交直屬主管簽核，審核通過後即可進入教室研習。'
            : '報名完成！您已具備正取資格，可點擊下方按鈕立即進入數位研習教室。',
        });
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
      if (onEnrolledSuccess) onEnrolledSuccess();
    } else {
      setResultMsg({
        type: 'error',
        text: res.message || '報名失敗，請稍候重試。',
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-800 text-white rounded-md text-[10px] font-bold">
                {course.courseCode}
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold">
                {course.categoryName}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  course.deliveryType === 'physical'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {course.deliveryType === 'physical' ? '實體研習' : '線上數位'}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1.5">{course.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Key Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[11px] block">培訓時數</span>
              <span className="text-base font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                <Clock className="w-4 h-4 text-blue-600" />
                {course.hours} 小時
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[11px] block">職能學分</span>
              <span className="text-base font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                <Award className="w-4 h-4 text-amber-500" />
                {course.credits} 點
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[11px] block">考核方式</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                {course.hasPostTest ? `課後測驗 (${course.passingScore}分及格)` : '出席出勤'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[11px] block">簽核流程</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                {course.approvalRequired ? '需主管簽核' : '免簽核 (即時正取)'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-1.5">課程目標與大綱說明</h4>
            <p className="p-4 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-slate-600">
              {course.description || '本課程針對案主管及工程核心職能規劃，涵蓋法規政策、技術實務及現場管理控制指標。'}
            </p>
          </div>

          {/* Target Audience */}
          <div>
            <span className="font-bold text-slate-900">建議受訓對象：</span>
            <span className="text-slate-600 ml-1.5">{formatTargetAudience(course.targetAudience)}</span>
          </div>

          {/* Enrollment Gatekeeper Status Banner */}
          {isEnrolled ? (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Unlock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    <span>已完成梯次報名 (正取學員)</span>
                    <span className="px-2 py-0.5 bg-emerald-200/70 text-emerald-900 rounded text-[10px]">
                      {existingEnrollment?.batchName}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    您已具備研習教室權限，可觀看全部配套講義教材、填寫課前問卷、參與防弊影音研習與隨堂測驗。
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsClassroomOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-center hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                進入研習教室
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : isWaitlisted ? (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 text-xs flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-amber-950">
                  候補排隊中 (第 {existingEnrollment?.waitlistRank} 順位)
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  待正取學員取消遞補為正取後，系統將自動為您解鎖研習教室所有講義、影音與測驗功能。
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-100/80 rounded-xl border border-slate-200 text-xs flex items-start gap-2.5 text-slate-600">
              <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-slate-800">研習教室權限限制：</span>
                <span className="text-[11px]">
                  本課程之教材講義、MS Forms問卷、線上影音與隨堂測驗為研習教室專屬內容。
                  請先於下方選擇開課梯次完成報名，完成後即可進入『研習教室』進行相關作業。
                </span>
              </div>
            </div>
          )}

          {/* Materials */}
          {course.materials && course.materials.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  課程配套教材與數位影音
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {isEnrolled ? '已解鎖：點擊可直接線上預覽或播放' : '需完成報名後方可進入教室觀看'}
                </span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {course.materials.map((mat) => {
                  const detectedType = detectMaterialMediaType(mat);
                  const isOneDrive = detectedType === 'onedrive_doc' || isOneDriveDocUrl(mat.fileUrl);
                  const oneDriveDocType = isOneDrive ? detectOneDriveDocType(mat.fileUrl, mat.title) : null;

                  return (
                    <div
                      key={mat.id}
                      onClick={() => {
                        if (!isEnrolled) {
                          alert('【教室權限限制】請先完成下方開課梯次報名作業，完成後方可進入教室預覽講義或觀看影音。');
                          return;
                        }
                        if (isOneDrive) {
                          setOneDriveModalMaterial(mat);
                        } else if (detectedType === 'pdf') {
                          setPdfModalMaterial(mat);
                        } else {
                          setPreviewMaterial(mat);
                        }
                      }}
                      className={`p-3 bg-white rounded-lg border flex items-center justify-between shadow-xs transition-all cursor-pointer group ${
                        isEnrolled
                          ? 'border-slate-200 hover:border-blue-400 hover:shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 opacity-90'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                            isOneDrive
                              ? oneDriveDocType === 'word'
                                ? 'bg-blue-50 text-blue-600'
                                : oneDriveDocType === 'excel'
                                ? 'bg-emerald-50 text-emerald-600'
                                : oneDriveDocType === 'powerpoint'
                                ? 'bg-orange-50 text-orange-600'
                                : 'bg-rose-50 text-rose-600'
                              : detectedType === 'youtube'
                              ? 'bg-red-50 text-red-600'
                              : detectedType === 'teams_onedrive'
                              ? 'bg-indigo-50 text-indigo-600'
                              : detectedType === 'video'
                              ? 'bg-purple-50 text-purple-600'
                              : detectedType === 'pdf'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {isOneDrive ? (
                            oneDriveDocType === 'excel' ? (
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            ) : oneDriveDocType === 'powerpoint' ? (
                              <Presentation className="w-3.5 h-3.5" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )
                          ) : detectedType === 'youtube' ? (
                            <Play className="w-3.5 h-3.5 fill-red-600" />
                          ) : detectedType === 'teams_onedrive' ? (
                            <Briefcase className="w-3.5 h-3.5" />
                          ) : detectedType === 'video' ? (
                            <Video className="w-3.5 h-3.5" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 text-xs truncate group-hover:text-blue-600 transition-colors">
                            {mat.title}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="uppercase font-bold text-slate-500">
                              {isOneDrive
                                ? `OneDrive ${oneDriveDocType?.toUpperCase()} 文件`
                                : detectedType === 'youtube'
                                ? 'YouTube 影音'
                                : detectedType === 'teams_onedrive'
                                ? '微軟 Teams / OneDrive 串流'
                                : mat.fileType}
                            </span>
                            <span>·</span>
                            <span>{mat.fileSize || (isOneDrive ? '微軟雲端掛載' : '線上資源')}</span>
                          </div>
                        </div>
                      </div>

                      {isEnrolled ? (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded shrink-0 flex items-center gap-1 ${
                            isOneDrive
                              ? 'bg-sky-50 text-sky-700'
                              : detectedType === 'youtube'
                              ? 'bg-red-50 text-red-700'
                              : detectedType === 'teams_onedrive'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {isOneDrive ? (
                            <>
                              <ExternalLink className="w-2.5 h-2.5" />
                              365 原生開啟
                            </>
                          ) : detectedType === 'youtube' || detectedType === 'teams_onedrive' ? (
                            <>
                              <Play className="w-2.5 h-2.5 fill-current" />
                              播放
                            </>
                          ) : (
                            '預覽'
                          )}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 rounded shrink-0 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" />
                          待報名
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Batch Selector Section */}
          <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-200 space-y-3">
            <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              選擇開課梯次與報名席位
            </h4>

            {batches.length === 0 ? (
              <p className="text-xs text-slate-400">目前暫無開放中之梯次</p>
            ) : (
              <div className="space-y-2">
                {batches.map((batch) => {
                  const enrolledCount = courseEnrollments.filter(
                    (e) => e.batchId === batch.id && e.listType === 'regular' && e.status !== 'cancelled'
                  ).length;
                  const waitlistCount = courseEnrollments.filter(
                    (e) => e.batchId === batch.id && e.listType === 'waitlist' && e.status !== 'cancelled'
                  ).length;
                  const isFull = enrolledCount >= batch.maxParticipants;
                  const isSelected = selectedBatchId === batch.id;

                  return (
                    <label
                      key={batch.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-white/70 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="course_batch"
                          checked={isSelected}
                          onChange={() => setSelectedBatchId(batch.id)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{batch.batchName || batch.batchNo || '第 01 梯次'}</span>
                            {batch.batchCode && (
                              <span className="text-[10px] text-slate-400 font-normal">({batch.batchCode})</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                            <span>📅 {batch.startDate} ({batch.startTime}~{batch.endTime})</span>
                            {(batch.primaryInstructorName || course.instructorName) && (
                              <span>👨‍🏫 {batch.primaryInstructorName || course.instructorName}</span>
                            )}
                            <span>📍 {batch.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 sm:mt-0 flex items-center gap-2 self-end sm:self-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isFull
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isFull
                            ? `正取已滿 (候補中 ${waitlistCount}/${batch.maxWaitlist}人)`
                            : `正取席位餘 ${batch.maxParticipants - enrolledCount} 席`}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Registrant Identity Section (Role-locked for general employees, filter screen for managers) */}
          {!personnelScope.canSelectSubordinates ? (
            /* 1. General Employee: Strictly Locked to Logged-in Account */
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-slate-600" />
                  報名學員身分設定：
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs">
                  <Lock className="w-3 h-3 text-slate-500" />
                  已鎖定登入帳號 (本人報名)
                </span>
              </div>

              {/* Locked Profile Card */}
              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-2xs shrink-0">
                    {personnelScope.loggedInEmployee.name?.slice(0, 1) || '同'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm">{personnelScope.loggedInEmployee.name}</span>
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {personnelScope.loggedInEmployee.empNo}
                      </span>
                      <span className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-bold">
                        本人
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {personnelScope.loggedInEmployee.department} · {personnelScope.loggedInEmployee.title}
                      {personnelScope.loggedInEmployee.section ? ` (${personnelScope.loggedInEmployee.section})` : ''}
                    </div>
                  </div>
                </div>
                {existingEnrollment && (
                  <span className="px-2.5 py-1 rounded-md font-bold text-xs bg-blue-50 border border-blue-200 text-blue-800 shrink-0">
                    {existingEnrollment.listType === 'regular' ? '已報名正取' : '候補排隊中'}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                ※ 依公司學習訓練管理規範，一般同仁報名作業鎖定為登入帳號本人；如需為轄下同仁代辦報名，須為組織樹設定之權責主管。
              </p>
            </div>
          ) : (
            /* 2. Organization Tree Manager: Allows selecting subordinates via dedicated filter modal */
            <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-blue-50/60 rounded-2xl border border-indigo-200/80 space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    報名學員身分設定 (主管權限)：
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {personnelScope.scopeTitle}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {targetEmpNo !== personnelScope.loggedInEmployee.empNo && (
                    <button
                      type="button"
                      onClick={() => {
                        setTargetEmpNo(personnelScope.loggedInEmployee.empNo);
                        setResultMsg(null);
                      }}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold rounded-lg shadow-2xs hover:bg-slate-50 flex items-center gap-1 transition-all"
                      title="切換回主管本人報名"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      切換回本人
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsPersonnelPickerOpen(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    選擇轄下人員 (篩選畫面)
                  </button>
                </div>
              </div>

              {/* Active Selected Subordinate Card */}
              {(() => {
                const activeEmp = employees.find((e) => e.empNo === targetEmpNo) || personnelScope.loggedInEmployee;
                const isSelf = activeEmp.empNo === personnelScope.loggedInEmployee.empNo;
                return (
                  <div className="p-3 bg-white border border-indigo-100 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white shadow-2xs shrink-0 ${
                          isSelf ? 'bg-indigo-600' : 'bg-blue-600'
                        }`}
                      >
                        {activeEmp.name?.slice(0, 1) || '同'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">{activeEmp.name}</span>
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {activeEmp.empNo}
                          </span>
                          {isSelf ? (
                            <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded font-bold">
                              主管本人報名
                            </span>
                          ) : (
                            <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-bold">
                              代轄下同仁報名 (由主管 {personnelScope.loggedInEmployee.name} 代辦)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {activeEmp.department} · {activeEmp.title}
                          {activeEmp.section ? ` (${activeEmp.section})` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {existingEnrollment ? (
                        <span className="px-2.5 py-1 rounded-lg font-bold text-xs bg-blue-50 border border-blue-200 text-blue-800">
                          {existingEnrollment.listType === 'regular' ? '已報名正取' : '候補排隊中'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg font-bold text-xs bg-emerald-50 border border-emerald-200 text-emerald-800">
                          尚未報名本課程
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsPersonnelPickerOpen(true)}
                        className="px-2.5 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors font-bold"
                      >
                        更換人員
                      </button>
                    </div>
                  </div>
                );
              })()}

              <p className="text-[11px] text-slate-500">
                ※ {personnelScope.scopeDescription}。點擊「選擇轄下人員 (篩選畫面)」可依單位、職稱與受訓狀態快速篩選並選定轄下同仁。
              </p>
            </div>
          )}

          {/* Result message alert */}
          {resultMsg && (
            <div
              className={`p-4 rounded-xl border text-xs font-semibold ${
                resultMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : resultMsg.type === 'waitlist'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {resultMsg.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {isEnrolled && (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                您已完成報名，隨時可進入研習教室
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              關閉
            </button>
            {isEnrolled ? (
              <button
                onClick={() => setIsClassroomOpen(true)}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                進入研習教室
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={isSubmitting || !selectedBatch}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:bg-slate-300"
              >
                {isSubmitting ? '報名處理中...' : '確認送出報名'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Direct Online Classroom Launcher */}
      {isClassroomOpen && existingEnrollment && (
        <OnlineClassroomModal
          course={course}
          enrollment={existingEnrollment}
          onClose={() => setIsClassroomOpen(false)}
          onComplete={() => {
            setIsClassroomOpen(false);
          }}
        />
      )}

      {/* Material Preview Modal */}
      {previewMaterial &&
        (detectMaterialMediaType(previewMaterial) === 'pdf' || previewMaterial.convertedFrom ? (
          <PdfViewerModal
            material={previewMaterial}
            onClose={() => setPreviewMaterial(null)}
          />
        ) : (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase">
                    {detectMaterialMediaType(previewMaterial) === 'youtube' ? 'YouTube 影音' : previewMaterial.fileType}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800">{previewMaterial.title}</h4>
                </div>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 bg-slate-950 text-white flex-1 overflow-y-auto flex flex-col items-center justify-center">
                {detectMaterialMediaType(previewMaterial) === 'youtube' || getYouTubeEmbedUrl(previewMaterial.fileUrl) ? (
                  <div className="w-full space-y-3">
                    <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800">
                      <iframe
                        src={getYouTubeEmbedUrl(previewMaterial.fileUrl, true) || ''}
                        title={previewMaterial.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{previewMaterial.description || '線上影音教材 (YouTube 串流)'}</span>
                      <a
                        href={previewMaterial.fileUrl.startsWith('http') ? previewMaterial.fileUrl : `https://www.youtube.com/watch?v=${extractYouTubeVideoId(previewMaterial.fileUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        開啟 YouTube
                      </a>
                    </div>
                  </div>
                ) : detectMaterialMediaType(previewMaterial) === 'teams_onedrive' || isMicrosoftVideoUrl(previewMaterial.fileUrl) ? (
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-between text-xs bg-indigo-950 p-2.5 rounded-lg border border-indigo-800 text-slate-200">
                      <span className="font-semibold flex items-center gap-1.5 text-indigo-300">
                        <Briefcase className="w-3.5 h-3.5" />
                        微軟 Teams / OneDrive 企業雲端串流
                      </span>
                      <a
                        href={previewMaterial.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded flex items-center gap-1 shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        在新分頁直接播放 ↗
                      </a>
                    </div>
                    <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800">
                      <iframe
                        src={getMicrosoftVideoEmbedUrl(previewMaterial.fileUrl) || previewMaterial.fileUrl}
                        title={previewMaterial.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{previewMaterial.description || '微軟 Teams 錄影 / OneDrive 雲端串流教材 (若畫面空白請點右上在新分頁開啟)'}</span>
                      <a
                        href={previewMaterial.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        在微軟雲端開啟
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white text-slate-800 p-6 rounded-xl text-center space-y-3 max-w-md w-full">
                    <FileText className="w-10 h-10 text-blue-600 mx-auto" />
                    <h5 className="font-bold text-sm">{previewMaterial.title}</h5>
                    <p className="text-xs text-slate-500">{previewMaterial.description || '課程講義教材'}</p>
                    {previewMaterial.fileUrl?.startsWith('http') && (
                      <a
                        href={previewMaterial.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        開啟 / 下載講義
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        ))}

      {/* PDF Viewer Modal */}
      {pdfModalMaterial && (
        <PdfViewerModal
          material={pdfModalMaterial}
          onClose={() => setPdfModalMaterial(null)}
        />
      )}

      {/* OneDrive / SharePoint Document Viewer Modal */}
      {oneDriveModalMaterial && (
        <OneDriveDocumentViewerModal
          isOpen={!!oneDriveModalMaterial}
          material={oneDriveModalMaterial}
          onClose={() => setOneDriveModalMaterial(null)}
        />
      )}

      {/* Manager Subordinate Personnel Selector Modal */}
      {personnelScope.canSelectSubordinates && (
        <SubordinatePersonnelPickerModal
          isOpen={isPersonnelPickerOpen}
          onClose={() => setIsPersonnelPickerOpen(false)}
          subordinateEmployees={personnelScope.subordinateEmployees}
          managerEmployee={personnelScope.loggedInEmployee}
          selectedEmpNo={targetEmpNo}
          onSelectEmployee={(emp) => {
            setTargetEmpNo(emp.empNo);
            setResultMsg(null);
          }}
          course={course}
          selectedBatchId={selectedBatchId}
          courseEnrollments={courseEnrollments}
          scopeTitle={personnelScope.scopeTitle}
          scopeDescription={personnelScope.scopeDescription}
        />
      )}
    </div>
  );
};
