
import { BonusType } from "./types";

export const BONUS_GAME_COUNT: { [key in BonusType | '']: number } = {
  [BonusType.BB]: 69,
  [BonusType.RB]: 29,
  [BonusType.CURRENT]: 0,
  [BonusType.SEPARATOR]: 0,
  [BonusType.EMPTY]: 0,
};
