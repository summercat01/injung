export const CATEGORIES = ['자유', '게임', '투자', '소비', '연애', '일상', '운동', '음식', '학교', '직장', '기타'] as const;
export type Category = (typeof CATEGORIES)[number];
