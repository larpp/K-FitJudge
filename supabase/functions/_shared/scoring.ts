// 클라이언트(src/data/mockScoring.ts, src/data/tpoOptions.ts)와 동일한 채점 기준을 서버에서도 써야 해서
// Deno 런타임 경계상 공유 import가 안 되니 최소 정보만 그대로 복제해둔다.

export interface CategoryDef {
  key: string;
  max: number;
  icon: string;
  labelKo: string;
  labelEn: string;
  isBonus?: boolean;
}

export const CATEGORY_DEFS: CategoryDef[] = [
  { key: 'color', max: 20, icon: 'palette', labelKo: '색상 조합', labelEn: 'Color Harmony' },
  { key: 'topBottom', max: 15, icon: 'shirt', labelKo: '상하의 조화', labelEn: 'Top-Bottom Balance' },
  { key: 'fit', max: 18, icon: 'check', labelKo: '핏', labelEn: 'Fit' },
  { key: 'shoes', max: 12, icon: 'shoe', labelKo: '신발', labelEn: 'Shoes' },
  { key: 'accessory', max: 10, icon: 'tag', labelKo: '액세서리 밸런스', labelEn: 'Accessory Balance' },
  { key: 'tpoFit', max: 10, icon: 'bag', labelKo: 'TPO 적합도', labelEn: 'TPO Fit' },
  {
    key: 'personalColor',
    max: 8,
    icon: 'sparkle',
    labelKo: '퍼스널컬러 궁합',
    labelEn: 'Personal Color Match',
    isBonus: true,
  },
  { key: 'hair', max: 7, icon: 'star', labelKo: '헤어스타일 궁합', labelEn: 'Hairstyle Match', isBonus: true },
];

export const TPO_LABELS: Record<string, { ko: string; en: string }> = {
  work: { ko: '출근', en: 'work' },
  date: { ko: '소개팅', en: 'a date' },
  campus: { ko: '캠퍼스', en: 'campus' },
  wedding: { ko: '결혼식 하객', en: 'a wedding guest' },
  street: { ko: '스트릿', en: 'streetwear' },
};
