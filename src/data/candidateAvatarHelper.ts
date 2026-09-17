import { getCartoonAvatarUrl } from '../utils/candidatePkHelper';

// 高質感專業職場亞洲商務主管大頭照片庫 (精選穩定 Unsplash 職場攝影集，帶有 Dicebear 備援)
export const PROFESSIONAL_AVATARS: string[] = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=256&h=256&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&h=256&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=256&h=256&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&h=256&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=256&h=256&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&h=256&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=256&h=256&fit=crop&crop=faces&q=80',
];

export function getCandidateAvatar(empNo: string, name: string, index: number): string {
  const photo = PROFESSIONAL_AVATARS[index % PROFESSIONAL_AVATARS.length];
  return photo || getCartoonAvatarUrl(`${empNo}-${name}`);
}
