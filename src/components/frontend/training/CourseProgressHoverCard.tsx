import React from 'react';
import {
  CheckCircle2,
  Clock,
  Award,
  Video,
  FileCheck,
  FileBadge,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Target,
} from 'lucide-react';
import { InternalCourse, CourseEnrollment, CourseVideoChapter } from '../../../types';
import { CircularProgressBar } from './CircularProgressBar';

interface CourseProgressHoverCardProps {
  course: InternalCourse;
  enrollment?: CourseEnrollment;
  className?: string;
  onOpenClassroom?: () => void;
  onOpenCertificate?: () => void;
}

export const CourseProgressHoverCard: React.FC<CourseProgressHoverCardProps> = ({
  course,
  enrollment,
  className = '',
  onOpenClassroom,
  onOpenCertificate,
}) => {
  // Extract or synthesize chapter list
  const chapters: CourseVideoChapter[] =
    course.videoConfig?.chapters && course.videoConfig.chapters.length > 0
      ? course.videoConfig.chapters
      : [
          {
            id: `ch-${course.id}-1`,
            chapterNo: 1,
            title: '第 1 章：工程實務法規與作業標準導入',
            durationSeconds: Math.round(((course.hours || 4) * 3600) * 0.35),
          },
          {
            id: `ch-${course.id}-2`,
            chapterNo: 2,
            title: '第 2 章：關鍵工法分析與施工界面防錯實務',
            durationSeconds: Math.round(((course.hours || 4) * 3600) * 0.4),
          },
          {
            id: `ch-${course.id}-3`,
            chapterNo: 3,
            title: '第 3 章：案例檢討與現場品質查核要領',
            durationSeconds: Math.round(((course.hours || 4) * 3600) * 0.25),
          },
        ];

  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === 'completed' || (enrollment?.videoWatchPercent || 0) >= 100;
  const overallProgress = isCompleted
    ? 100
    : isEnrolled
    ? enrollment?.videoWatchPercent || 25
    : 0;

  // Chapter progress map
  const chapterProgressMap = enrollment?.chapterProgress || {};

  return (
    <div
      className={`w-80 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 p-4 text-left z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150 ${className}`}
      style={{ boxShadow: '0 20px 35px -8px rgba(15, 23, 42, 0.25), 0 1px 3px rgba(0, 0, 0, 0.08)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {course.categoryName}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {course.courseCode}
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
            {course.title}
          </h4>
        </div>

        {/* Big Overall Circular Progress */}
        <div className="flex flex-col items-center shrink-0">
          <CircularProgressBar
            progress={overallProgress}
            size={46}
            strokeWidth={4.5}
            completed={isCompleted}
          />
          <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
            {isCompleted ? '已完訓' : isEnrolled ? '總研習進度' : '未報名'}
          </span>
        </div>
      </div>

      {/* Chapter Reading Progress List */}
      <div className="py-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
          <span className="flex items-center gap-1">
            <Video className="w-3.5 h-3.5 text-blue-600" />
            章節教材閱讀進度 ({chapters.length} 單元)
          </span>
          <span className="text-[10px] font-normal text-slate-500">
            {isCompleted
              ? '全章節達標'
              : `${chapters.filter((ch) => isCompleted || chapterProgressMap[ch.id]?.completed).length}/${chapters.length} 完訓`}
          </span>
        </div>

        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {chapters.map((ch, idx) => {
            const rawProg = chapterProgressMap[ch.id];
            const chDone = isCompleted || rawProg?.completed;
            const dur = ch.durationSeconds || 1200;
            const chPercent = chDone
              ? 100
              : rawProg?.watchedSeconds
              ? Math.min(100, Math.round((rawProg.watchedSeconds / dur) * 100))
              : isEnrolled && idx === 0
              ? 65
              : 0;

            return (
              <div
                key={ch.id || idx}
                className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                  chDone
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : chPercent > 0
                    ? 'bg-blue-50/40 border-blue-200'
                    : 'bg-slate-50/60 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Chapter circular progress ring */}
                  <CircularProgressBar
                    progress={chPercent}
                    size={26}
                    strokeWidth={3}
                    completed={chDone}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate">
                      {ch.title}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      預估研習：{Math.round(dur / 60)} 分鐘
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {chDone ? (
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                      達標
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-600 font-bold">
                      {chPercent}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verification / Passing Checklist */}
      <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          完訓考核達標檢核
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              overallProgress >= 90
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-slate-50 text-slate-600'
            }`}
          >
            <CheckCircle2
              className={`w-3 h-3 ${overallProgress >= 90 ? 'text-emerald-600' : 'text-slate-300'}`}
            />
            <span className="truncate">教材研習 ≥90%</span>
          </div>

          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              isCompleted || (enrollment?.examScore && enrollment.examScore >= 70)
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-slate-50 text-slate-600'
            }`}
          >
            <CheckCircle2
              className={`w-3 h-3 ${
                isCompleted || (enrollment?.examScore && enrollment.examScore >= 70)
                  ? 'text-emerald-600'
                  : 'text-slate-300'
              }`}
            />
            <span className="truncate">測驗及格 (≥70分)</span>
          </div>
        </div>
      </div>

      {/* Certificate Status & Quick Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-2">
        {isCompleted ? (
          <div className="flex items-center gap-1.5 text-amber-700 font-bold text-[11px]">
            <FileBadge className="w-4 h-4 text-amber-600" />
            <span>已頒發電子完訓證書 (PDF)</span>
          </div>
        ) : isEnrolled ? (
          <div className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>課程研習進行中</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400">
            <span>尚未報名本課程</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {isCompleted && onOpenCertificate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCertificate();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <FileBadge className="w-3 h-3" />
              查看證書
            </button>
          )}

          {isEnrolled && onOpenClassroom && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenClassroom();
              }}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              進入研習教室
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
