import { CandidateProfile, ProjectPlan } from '../types';

export interface MatchScoreResult {
  candidate: CandidateProfile;
  totalScore: number;
  matchScore: number; // alias for compatibility
  breakdown: {
    regionMatch: boolean;
    scaleMatch: boolean;
    methodMatch: boolean;
    experienceScore: number;
    performanceScore: number;
    releaseStatusScore: number;
  };
  reasons: string[];
  matchReasons: string[]; // alias for compatibility
}

export function matchCandidatesForProject(
  project: ProjectPlan,
  candidates: CandidateProfile[]
): MatchScoreResult[] {
  const results: MatchScoreResult[] = candidates.map((cand) => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Region match
    const isNorth = (project.region || '').includes('台北') || (project.region || '').includes('新北') || (project.region || '').includes('基隆') || (project.region || '').includes('桃園') || (project.region || '').includes('新竹');
    const isMiddle = (project.region || '').includes('台中') || (project.region || '').includes('彰化') || (project.region || '').includes('南投') || (project.region || '').includes('苗栗');
    const isSouth = (project.region || '').includes('台南') || (project.region || '').includes('高雄') || (project.region || '').includes('屏東') || (project.region || '').includes('嘉義') || (project.region || '').includes('雲林');

    const regions = cand.availableRegions || [];
    let regionMatch = false;
    if (isNorth && (regions.includes('北區') || regions.includes('台北市') || regions.includes('新北市') || regions.includes('桃園市'))) regionMatch = true;
    if (isMiddle && (regions.includes('中區') || regions.includes('台中市'))) regionMatch = true;
    if (isSouth && (regions.includes('南區') || regions.includes('台南市') || regions.includes('高雄市'))) regionMatch = true;
    if (project.region && regions.includes(project.region)) regionMatch = true;
    if (project.normalizedRegion && regions.includes(project.normalizedRegion)) regionMatch = true;

    if (regionMatch) {
      score += 25;
      reasons.push('符合區域調動意願');
    }

    // 2. Scale match
    const scaleMatch = cand.acceptedScales?.includes(project.scaleType) || cand.acceptedScales?.some((s) => s.includes((project.scaleType || '').slice(0, 2)));
    if (scaleMatch) {
      score += 20;
      reasons.push(`可接受${project.scaleType}規模`);
    }

    // 3. Special method match
    let methodMatch = false;
    if (project.specialMethod && project.specialMethod !== '無') {
      if (cand.specialMethods?.includes(project.specialMethod as any)) {
        methodMatch = true;
        score += 20;
        reasons.push(`具備【${project.specialMethod}】工法經驗`);
      }
    } else {
      methodMatch = true;
      score += 10;
    }

    // 4. Seven stages experience
    let experienceScore = 0;
    const totalExp = Object.values(cand.sevenStagesYears || {}).reduce((a, b) => a + b, 0);
    if (totalExp > 12) {
      experienceScore = 15;
      reasons.push('七大階段歷練扎實 (>12年)');
    } else if (totalExp > 8) {
      experienceScore = 10;
      reasons.push('具備良好七大階段實務年資');
    } else {
      experienceScore = 5;
    }
    score += experienceScore;

    // 5. Performance ratings
    let performanceScore = 0;
    if (cand.eval2025 === '甲上' || cand.eval2024 === '甲上') {
      performanceScore = 10;
      reasons.push('近三年獲甲上優異考績');
    } else if (cand.eval2025 === '甲') {
      performanceScore = 6;
    }
    score += performanceScore;

    // 6. Release status
    let releaseStatusScore = 0;
    const releaseStatus = cand.releaseStatus || '';
    if (releaseStatus.includes('已達標準釋出') || releaseStatus.includes('已達使照提前釋出')) {
      releaseStatusScore = 10;
      reasons.push('目前處於可直接接案釋出狀態');
    } else if (releaseStatus.includes('曾任主管') || releaseStatus.includes('儲備幹部') || releaseStatus.includes('儲備主管')) {
      releaseStatusScore = 8;
      reasons.push('可列入遴選評估人選');
    } else {
      releaseStatusScore = 3;
    }
    score += releaseStatusScore;

    return {
      candidate: cand,
      totalScore: score,
      matchScore: score,
      breakdown: {
        regionMatch,
        scaleMatch,
        methodMatch,
        experienceScore,
        performanceScore,
        releaseStatusScore,
      },
      reasons,
      matchReasons: reasons,
    };
  });

  return results.sort((a, b) => b.totalScore - a.totalScore);
}
