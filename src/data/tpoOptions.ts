import type { IconName } from '../components/ui/Icon';

export interface TpoOption {
  key: 'work' | 'date' | 'campus' | 'wedding' | 'street';
  icon: IconName;
  labelKo: string;
  labelEn: string;
  descKo: string;
  descEn: string;
}

export const tpoOptions: TpoOption[] = [
  {
    key: 'work',
    icon: 'bag',
    labelKo: '출근',
    labelEn: 'Work',
    descKo: '단정함과 신뢰감을 중점적으로 봐요',
    descEn: 'Focuses on neatness and trustworthiness',
  },
  {
    key: 'date',
    icon: 'heart',
    labelKo: '소개팅',
    labelEn: 'A Date',
    descKo: '호감형 무드와 디테일을 확인해요',
    descEn: 'Checks for an approachable mood and detail',
  },
  {
    key: 'campus',
    icon: 'cap',
    labelKo: '캠퍼스',
    labelEn: 'Campus',
    descKo: '편안하면서 개성 있는 밸런스를 봐요',
    descEn: 'Looks for a comfortable yet personal balance',
  },
  {
    key: 'wedding',
    icon: 'ring',
    labelKo: '결혼식 하객',
    labelEn: 'Wedding Guest',
    descKo: '과하지 않은 포멀함을 평가해요',
    descEn: 'Evaluates formality without overdoing it',
  },
  {
    key: 'street',
    icon: 'bolt',
    labelKo: '스트릿',
    labelEn: 'Streetwear',
    descKo: '개성과 트렌드 감각을 중점적으로 봐요',
    descEn: 'Focuses on personality and trend sense',
  },
];
