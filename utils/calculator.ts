
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
        // 区切り行の場合は累積をリセットし、次のデータ行が1回目から始まるようにする
        if (separatorIndexes.includes(index)) {
            favorableZoneG = 0;
            segmentNum = 0;  // 区切り行で0にリセット
            
            return {
                ...record,
                favorableZoneStart: 0,
                favorableZoneEnd: 0,
                segmentNumber: 0
            };
        }

        // データ行の場合のみセグメント番号をカウント（区切り後は1から開始）
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
