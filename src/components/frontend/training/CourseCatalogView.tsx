import React, { useState, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  BookOpen,
  Search,
  Filter,
  Calendar,
  Clock,
  Award,
  Users,
  ChevronRight,
  Sparkles,
  MapPin,
  Video,
  CheckCircle2,
  FileBadge,
} from 'lucide-react';
import { InternalCourse, CourseEnrollment } from '../../../types';
import { CourseDetailModal } from './CourseDetailModal';
import { CourseProgressHoverCard } from './CourseProgressHoverCard';
import { OnlineClassroomModal } from './OnlineClassroomModal';
import { CertificateModal } from './CertificateModal';
import { CircularProgressBar } from './CircularProgressBar';

interface CourseCatalogViewProps {
  currentEmpNo?: string;
  onNavigateToMyLearning?: () => void;
}

export const CourseCatalogView: React.FC<CourseCatalogViewProps> = ({
  currentEmpNo,
  onNavigateToMyLearning,
}) => {
  const { internalCourses, trainingCategories, courseEnrollments, employees } = useApp();
  const effectiveEmpNo = currentEmpNo || employees[0]?.empNo || 'FG1001';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<string>('all');
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<InternalCourse | null>(null);

  // Hover card state
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Quick action modals triggered from hover card
  const [classroomCourse, setClassroomCourse] = useState<{
    course: InternalCourse;
    enrollment: CourseEnrollment;
  } | null>(null);
  const [certCourse, setCertCourse] = useState<{
    course: InternalCourse;
    enrollment: CourseEnrollment;
  } | null>(null);

  const handleMouseEnter = (courseId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredCourseId(courseId);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCourseId(null);
    }, 200);
  };

  const filtered = internalCourses.filter((c) => {
    if (selectedCategory !== 'all' && c.categoryId !== selectedCategory && c.categoryName !== selectedCategory) {
      return false;
    }
    if (selectedDelivery !== 'all' && c.deliveryType !== selectedDelivery) {
      return false;
    }
    if (
      searchTerm &&
      !c.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            遠雄營造 全員職能進修與案主管培育專區
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            探索專業訓練課程 · 強化工程管理硬實力
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            依據職能地圖自主選課，修習工期控制、BIM、工程品質與法令工安等必修專案學程，累計學分可作為未來案主管（工務所長）遴選關鍵指標。
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜尋課程名稱、關鍵字或代碼..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 focus:bg-white"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">全部訓練類別</option>
            {trainingCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDelivery}
            onChange={(e) => setSelectedDelivery(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">全部授課形式</option>
            <option value="physical">實體研習</option>
            <option value="online">線上影音</option>
            <option value="blended">混成式學程</option>
          </select>
        </div>

        <div className="text-slate-500 font-medium">
          共篩選出 <strong className="text-blue-600 font-bold">{filtered.length}</strong> 門研習課程
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((course) => {
          const batches = course.batches || [];
          const activeBatch = batches[0];
          const matchedEnrollment = courseEnrollments.find(
            (e) => e.courseId === course.id && e.empNo === effectiveEmpNo && e.status !== 'cancelled'
          );
          const isEnrolled = !!matchedEnrollment;
          const isHovered = hoveredCourseId === course.id;
          const isCompleted = matchedEnrollment?.status === 'completed' || (matchedEnrollment?.videoWatchPercent || 0) >= 100;
          const watchPercent = isCompleted ? 100 : matchedEnrollment?.videoWatchPercent || (isEnrolled ? 45 : 0);

          return (
            <div
              key={course.id}
              onMouseEnter={() => handleMouseEnter(course.id)}
              onMouseLeave={handleMouseLeave}
              className={`bg-white rounded-2xl border shadow-xs hover:shadow-xl transition-all flex flex-col justify-between overflow-visible relative group ${
                isHovered ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              {/* Floating Progress Overview Card on Hover */}
              {isHovered && (
                <div
                  className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
                  onMouseEnter={() => handleMouseEnter(course.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <CourseProgressHoverCard
                    course={course}
                    enrollment={matchedEnrollment}
                    onOpenClassroom={() => {
                      if (matchedEnrollment) {
                        setClassroomCourse({ course, enrollment: matchedEnrollment });
                      } else {
                        setSelectedCourseForModal(course);
                      }
                    }}
                    onOpenCertificate={() => {
                      if (matchedEnrollment) {
                        setCertCourse({ course, enrollment: matchedEnrollment });
                      }
                    }}
                  />
                  {/* Subtle triangular arrow pointing down */}
                  <div className="w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45 mx-auto -mt-1.5 shadow-xs" />
                </div>
              )}

              <div className="p-5 space-y-3">
                {/* Badge row with hover hint indicator */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
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
                      {course.deliveryType === 'physical' ? '實體研習' : '線上影音'}
                    </span>
                  </div>

                  {/* Progress hover pill indicator */}
                  <div
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isEnrolled
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600'
                    }`}
                    title="懸停預覽章節閱讀進度與完訓概況"
                  >
                    <CircularProgressBar
                      progress={watchPercent}
                      size={18}
                      strokeWidth={2.5}
                      completed={isCompleted}
                    />
                    <span>{isCompleted ? '已完訓' : isEnrolled ? `${watchPercent}%` : '概覽'}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400">{course.courseCode}</div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-0.5">
                    {course.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {course.description || '本課程提供完整專業實務培訓與專案落地方案。'}
                </p>

                {/* Key stats */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>時數：<strong className="text-slate-900">{course.hours} hrs</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>學分：<strong className="text-slate-900">{course.credits} 點</strong></span>
                  </div>
                </div>

                {/* Next Batch Info */}
                {activeBatch && (
                  <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>梯次：{activeBatch.batchName} ({activeBatch.startDate})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="truncate">地點：{activeBatch.location || '線上研習教室'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                {isCompleted ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (matchedEnrollment) {
                        setCertCourse({ course, enrollment: matchedEnrollment });
                      }
                    }}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                  >
                    <FileBadge className="w-3.5 h-3.5 text-amber-600" />
                    獲頒 PDF 證書
                  </button>
                ) : isEnrolled ? (
                  <span className="text-xs font-bold text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    已報名研習中
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">
                    開放同仁報名中
                  </span>
                )}

                <button
                  onClick={() => setSelectedCourseForModal(course)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {isEnrolled ? '課程詳情' : '大綱 / 報名'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">查無符合條件的課程</h4>
          <p className="text-xs text-slate-400 mt-1">請嘗試調整搜尋關鍵字或類別條件</p>
        </div>
      )}

      {/* Course Detail / Enrollment Modal */}
      {selectedCourseForModal && (
        <CourseDetailModal
          course={selectedCourseForModal}
          currentEmpNo={effectiveEmpNo}
          onClose={() => setSelectedCourseForModal(null)}
          onEnrolledSuccess={() => {
            // Success callback
          }}
        />
      )}

      {/* Quick Launch Classroom from Hover Card */}
      {classroomCourse && (
        <OnlineClassroomModal
          course={classroomCourse.course}
          enrollment={classroomCourse.enrollment}
          onClose={() => setClassroomCourse(null)}
        />
      )}

      {/* Quick Launch Certificate from Hover Card */}
      {certCourse && (
        <CertificateModal
          course={certCourse.course}
          enrollment={certCourse.enrollment}
          onClose={() => setCertCourse(null)}
        />
      )}
    </div>
  );
};
