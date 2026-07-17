export interface SampleCategoryScore {
  labelKo: string;
  labelEn: string;
  score: number;
  max: number;
}

export const sampleCategoryScores: SampleCategoryScore[] = [
  { labelKo: '색상 조합', labelEn: 'Color Harmony', score: 22, max: 25 },
  { labelKo: '상하의 조화', labelEn: 'Top-Bottom Balance', score: 18, max: 20 },
  { labelKo: '핏', labelEn: 'Fit', score: 17, max: 20 },
  { labelKo: '신발', labelEn: 'Shoes', score: 13, max: 15 },
  { labelKo: '액세서리 밸런스', labelEn: 'Accessory Balance', score: 8, max: 12 },
  { labelKo: 'TPO 적합도', labelEn: 'TPO Fit', score: 6, max: 8 },
];

export const sampleOverallScore = sampleCategoryScores.reduce((sum, c) => sum + c.score, 0);

export const sampleFeedbackKo =
  '자켓과 팬츠의 톤은 잘 맞았지만, 액세서리가 두 가지 이상 겹치면서 시선이 분산돼요. 시계만 남기고 목걸이를 빼면 핏이 훨씬 깔끔해지고 점수도 6점 정도 올라가요.';
export const sampleFeedbackEn =
  'The jacket and pants tones matched well, but two overlapping accessories scatter the focus. Keep only the watch and remove the necklace — it will look cleaner and add about 6 points.';

export const sampleTpoKo = '소개팅';
export const sampleTpoEn = 'A Date';
