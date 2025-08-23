
import type { GameRecord } from '../types';
import { BONUS_GAME_COUNT } from '../constants';

type GameMode = 'GOLD' | 'BLACK';

const BLACK_BONUS_GAME_COUNT = {
    'BB': 59,
    'RB': 24,
    '現在': 0,
    '区切': 0,
    '': 0
};

export const recalculateRecords = (records: GameRecord[], gameMode: GameMode = 'GOLD'): GameRecord[] => {
    let favorableZoneG = 0;
    let segmentNum = 0;
    
    const bonusGameCounts = gameMode === 'BLACK' ? BLACK_BONUS_GAME_COUNT : BONUS_GAME_COUNT;

    // まず区切り行のインデックスを特定
    const separatorIndexes = records.map((record, index) => record.isSeparator ? index : -1).filter(index => index !== -1);
    
    return records.map((record, index) => {
        // 区切り行の上のセルから累積をリセット
        // 区切り行のインデックスを確認し、そのインデックスでリセット
        if (separatorIndexes.includes(index)) {
            favorableZoneG = 0;
            segmentNum = 0;
        }

        segmentNum++;
        const currentGameCount = Number(record.gameCount) || 0;
        const bonusGames = bonusGameCounts[record.bonusType] || 0;
        
        const favorableZoneStart = favorableZoneG + currentGameCount;
        const favorableZoneEnd = favorableZoneStart + bonusGames;
        
        favorableZoneG = favorableZoneEnd;

        return {
            ...record,
            favorableZoneStart,
            favorableZoneEnd,
            segmentNumber: segmentNum
        };
    });
};
