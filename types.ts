
export enum BonusType {
  BB = 'BB',
  RB = 'RB',
  CURRENT = '現在',
  SEPARATOR = '区切',
  EMPTY = ''
}

export interface GameRecord {
  id: number;
  gameCount: string;
  bonusType: BonusType | '';
  isSeparator: boolean;
  // Calculated fields are added dynamically by the recalculate function
  favorableZoneStart?: number;
  favorableZoneEnd?: number;
  segmentNumber?: number;
}

export interface RawRecord {
  game: number;
  type: BonusType.BB | BonusType.RB;
}
