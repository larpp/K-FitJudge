import type { IconName } from '../components/ui/Icon';
import type { TpoOption } from './tpoOptions';
import type { StyleIntent } from '../components/evaluate/IntentStep';

export type CategoryKey =
  | 'color'
  | 'topBottom'
  | 'fit'
  | 'shoes'
  | 'accessory'
  | 'tpoFit'
  | 'personalColor'
  | 'hair';

interface CategoryDef {
  key: CategoryKey;
  max: number;
  icon: IconName;
  labelKo: string;
  labelEn: string;
  isBonus?: boolean;
}

const CATEGORY_DEFS: CategoryDef[] = [
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

const FEEDBACK_BANK: Record<CategoryKey, { improveKo: string; improveEn: string; goodKo: string; goodEn: string }> = {
  color: {
    improveKo: '상의와 하의 톤이 살짝 부딪혀요. 한쪽을 무채색으로 낮추면 조화가 좋아져요.',
    improveEn: 'The top and bottom tones clash slightly. Muting one side to neutral improves the harmony.',
    goodKo: '색상 밸런스가 안정적이에요',
    goodEn: 'The color balance is well-grounded',
  },
  topBottom: {
    improveKo: '상의와 하의가 모두 루즈해서 실루엣이 흐려져요. 한쪽만 타이트하게 잡아보세요.',
    improveEn: 'Both the top and bottom are loose, blurring the silhouette. Try tightening just one side.',
    goodKo: '상하의 비율이 조화로워요',
    goodEn: 'The top-bottom proportion is well balanced',
  },
  fit: {
    improveKo: '소매와 밑단 기장이 살짝 커요. 소매를 한 번 접거나 기장을 줄이면 핏이 살아나요.',
    improveEn: 'The sleeves and hem run a bit long. Rolling the sleeves once or shortening the hem sharpens the fit.',
    goodKo: '몸에 잘 맞는 핏이에요',
    goodEn: 'The fit sits well on your frame',
  },
  shoes: {
    improveKo: '신발 색상이 전체 톤과 따로 놀아요. 아우터나 하의 색과 맞추면 통일감이 생겨요.',
    improveEn: "The shoe color stands apart from the rest. Matching it to your outerwear or bottoms ties the look together.",
    goodKo: '신발 선택이 스타일과 잘 어울려요',
    goodEn: 'The shoes suit the overall style',
  },
  accessory: {
    improveKo: '액세서리가 두 가지 이상 겹쳐서 시선이 분산돼요. 포인트 하나만 남겨보세요.',
    improveEn: 'Two or more accessories overlap and scatter the focus. Try keeping just one statement piece.',
    goodKo: '액세서리 활용이 과하지 않고 적절해요',
    goodEn: 'The accessories are used just enough, not overdone',
  },
  tpoFit: {
    improveKo: '{tpo} 자리치고는 캐주얼함이 조금 강해요. 아우터를 하나 더하면 격식이 살아나요.',
    improveEn: 'This reads a bit too casual for {tpo}. Adding one outer layer raises the formality.',
    goodKo: '{tpo} 분위기에 잘 맞는 룩이에요',
    goodEn: 'This look fits the mood of {tpo} well',
  },
  personalColor: {
    improveKo: '퍼스널컬러 대비 색상 채도가 조금 높아요. 톤을 한 단계 낮추면 얼굴이 더 화사해 보여요.',
    improveEn: 'The saturation runs a bit high for your personal color. Toning it down one step brightens your face more.',
    goodKo: '퍼스널컬러와 옷 색상의 궁합이 좋아요',
    goodEn: 'Your personal color and outfit color pair well',
  },
  hair: {
    improveKo: '헤어스타일과 옷의 무드가 살짝 엇갈려요. 헤어를 조금 더 정돈하면 톤이 맞아떨어져요.',
    improveEn: 'The hairstyle mood drifts slightly from the outfit. Tidying it a touch brings the tones together.',
    goodKo: '헤어스타일과 옷 스타일의 무드가 잘 맞아요',
    goodEn: 'The hairstyle mood matches the outfit well',
  },
};

export interface ScoreCategory {
  key: CategoryKey;
  icon: IconName;
  labelKo: string;
  labelEn: string;
  score: number;
  max: number;
  isBonus?: boolean;
}

export interface FeedbackEntry {
  key: CategoryKey;
  textKo: string;
  textEn: string;
  pointsGain: number;
}

export interface StrengthEntry {
  key: CategoryKey;
  textKo: string;
  textEn: string;
}

export interface MockResult {
  overall: number;
  categories: ScoreCategory[];
  strengths: StrengthEntry[];
  improvements: FeedbackEntry[];
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function generateMockResult(
  tpo: TpoOption,
  intent: StyleIntent,
  locale: 'ko' | 'en',
  seed: number,
): MockResult {
  const rand = mulberry32(hashString(`${tpo.key}-${intent}-${seed}`));
  // 실험적 의도는 채점 기준을 완화해 창의적인 룩이 억울하게 감점되지 않도록 한다.
  const minRatio = intent === 'experimental' ? 0.72 : 0.62;
  const maxRatio = intent === 'experimental' ? 0.98 : 0.95;

  const categories: ScoreCategory[] = CATEGORY_DEFS.map((def) => {
    const ratio = minRatio + rand() * (maxRatio - minRatio);
    const score = Math.max(1, Math.round(def.max * ratio));
    return {
      key: def.key,
      icon: def.icon,
      labelKo: def.labelKo,
      labelEn: def.labelEn,
      score,
      max: def.max,
      isBonus: def.isBonus,
    };
  });

  const overall = categories.reduce((sum, c) => sum + c.score, 0);

  const tpoLabel = locale === 'ko' ? tpo.labelKo : tpo.labelEn;
  const ranked = [...categories].sort((a, b) => a.score / a.max - b.score / b.max);

  const improvements: FeedbackEntry[] = ranked
    .filter((c) => c.score / c.max < 0.92)
    .slice(0, 3)
    .map((c) => {
      const bank = FEEDBACK_BANK[c.key];
      const pointsGain = Math.min(6, Math.max(2, c.max - c.score));
      return {
        key: c.key,
        textKo: bank.improveKo.replace('{tpo}', tpoLabel),
        textEn: bank.improveEn.replace('{tpo}', tpoLabel),
        pointsGain,
      };
    });

  const strengths: StrengthEntry[] = [...ranked]
    .reverse()
    .slice(0, 2)
    .map((c) => {
      const bank = FEEDBACK_BANK[c.key];
      return {
        key: c.key,
        textKo: bank.goodKo.replace('{tpo}', tpoLabel),
        textEn: bank.goodEn.replace('{tpo}', tpoLabel),
      };
    });

  return { overall, categories, strengths, improvements };
}
