/**
 * Utility to parse raw text in CSV, TSV (Tab), or Slash (/) delimited formats
 */

export function detectDelimiter(text: string): string {
  const firstLine = text.trim().split('\n')[0] || '';
  if (firstLine.includes('\t')) return '\t';
  if (firstLine.includes(',')) return ',';
  if (firstLine.includes('/')) return '/';
  if (firstLine.includes(';')) return ';';
  return ',';
}

export function parseDelimitedText(
  rawText: string,
  customDelimiter?: string
): string[][] {
  if (!rawText || !rawText.trim()) return [];

  const delimiter = customDelimiter || detectDelimiter(rawText);
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  return lines.map((line) => {
    // If delimiter is comma, handle basic quotes if present
    if (delimiter === ',') {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    }

    // Default split
    return line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
  });
}

/**
 * Normalize and parse various date string representations into YYYY-MM-DD
 * Supports ISO (YYYY-MM-DD), Slash (YYYY/MM/DD), Dot (YYYY.MM.DD), Compact (YYYYMMDD),
 * and Taiwan ROC Minguo formats (e.g. 108/03/01, 108-03-01, 108.03.01, 1080301).
 */
export function normalizeDateString(dateStr: string | undefined | null): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim().replace(/^["']|["']$/g, '');
  if (!clean || clean === '-' || clean === '未填寫' || clean === '無' || clean === 'null' || clean === 'undefined') {
    return null;
  }

  // 1. Separated format: YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD, or ROC YYY/MM/DD
  const separatedMatch = clean.match(/^(\d{2,4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (separatedMatch) {
    let year = parseInt(separatedMatch[1], 10);
    const month = parseInt(separatedMatch[2], 10);
    const day = parseInt(separatedMatch[3], 10);

    // If ROC Year (e.g. 98, 108, 112)
    if (year <= 200) {
      year += 1911;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const mm = month.toString().padStart(2, '0');
      const dd = day.toString().padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    }
  }

  // 2. Compact format: 8-digit YYYYMMDD or 7-digit YYYMMDD (ROC)
  const compactMatch = clean.match(/^(\d{7,8})$/);
  if (compactMatch) {
    const str = compactMatch[1];
    let year: number;
    let month: number;
    let day: number;

    if (str.length === 7) {
      // ROC year 3 digits + 2 month + 2 day (e.g. 1080301)
      year = parseInt(str.slice(0, 3), 10) + 1911;
      month = parseInt(str.slice(3, 5), 10);
      day = parseInt(str.slice(5, 7), 10);
    } else {
      // 8 digits (e.g. 20190301)
      year = parseInt(str.slice(0, 4), 10);
      month = parseInt(str.slice(4, 6), 10);
      day = parseInt(str.slice(6, 8), 10);
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const mm = month.toString().padStart(2, '0');
      const dd = day.toString().padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    }
  }

  // 3. Fallback standard parse
  const sanitized = clean.replace(/\//g, '-').replace(/\./g, '-');
  const d = new Date(sanitized);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return null;
}

/**
 * Format date helpers
 */
export function calculateAge(birthday: string, referenceDate = '2026-08-25'): number {
  const normBirth = normalizeDateString(birthday);
  const normRef = normalizeDateString(referenceDate) || '2026-08-25';
  if (!normBirth) return 0;

  const birth = new Date(normBirth);
  const ref = new Date(normRef);
  if (isNaN(birth.getTime()) || isNaN(ref.getTime())) return 0;
  
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? age : 0;
}

export function calculateYearsDifference(
  startDate: string,
  referenceDate = '2026-08-25',
  decimals = 2
): number {
  const normStart = normalizeDateString(startDate);
  const normRef = normalizeDateString(referenceDate) || '2026-08-25';
  if (!normStart) return 0;

  const start = new Date(normStart);
  const ref = new Date(normRef);
  if (isNaN(start.getTime()) || isNaN(ref.getTime())) return 0;
  
  const diffTime = ref.getTime() - start.getTime();
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  if (diffYears <= 0) return 0;
  return Number(diffYears.toFixed(decimals));
}

export function formatYears(val: number | string | undefined | null, decimals = 2): string {
  if (val === undefined || val === null || val === '' || val === '-') return '0';
  const num = typeof val === 'string' ? parseFloat(val) : Number(val);
  if (isNaN(num)) return '0';
  // Strip trailing zeros after rounding or keep up to `decimals` places without floating precision errors
  return Number(num.toFixed(decimals)).toString();
}

export function formatAge(birthdayOrAge: string | number | undefined | null, referenceDate = '2026-08-25'): string {
  if (birthdayOrAge === undefined || birthdayOrAge === null || birthdayOrAge === '' || birthdayOrAge === '-') return '-';
  if (typeof birthdayOrAge === 'number') {
    return Number(birthdayOrAge.toFixed(1)).toString();
  }
  if (!isNaN(Number(birthdayOrAge))) {
    return Number(Number(birthdayOrAge).toFixed(1)).toString();
  }
  const age = calculateAge(birthdayOrAge, referenceDate);
  return age > 0 ? age.toString() : '-';
}

export function formatDecimal(val: number | undefined | null, decimals = 2): string {
  if (val === undefined || val === null || isNaN(Number(val))) return (0).toFixed(decimals);
  return Number(val).toFixed(decimals);
}

export const SIX_CITIES = [
  '台北市',
  '新北市',
  '桃園市',
  '台中市',
  '台南市',
  '高雄市',
  '其他',
] as const;

export function getSixCityCategory(regionStr: string | undefined | null): string {
  if (!regionStr || typeof regionStr !== 'string') return '其他';
  const clean = regionStr.trim();
  if (clean.includes('台北') || clean.includes('臺北')) return '台北市';
  if (clean.includes('新北')) return '新北市';
  if (clean.includes('桃園')) return '桃園市';
  if (clean.includes('台中') || clean.includes('臺中')) return '台中市';
  if (clean.includes('台南') || clean.includes('臺南')) return '台南市';
  if (clean.includes('高雄')) return '高雄市';
  return '其他';
}

export function normalizeRegionToSixCities(regionStr: string | undefined | null): string {
  return getSixCityCategory(regionStr);
}
