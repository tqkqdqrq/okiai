
import React from 'react';
import type { GameRecord } from '../types';
import { BonusType } from '../types';
import { TrashIcon } from './icons';

interface HistoryTableProps {
  records: GameRecord[];
  isDeleteMode: boolean;
  onUpdate: (id: number, updatedFields: Partial<Omit<GameRecord, 'id'>>) => void;
  onDelete: (id: number) => void;
  onReorder?: (newRecords: GameRecord[]) => void;
  gameMode?: 'GOLD' | 'BLACK';
}

const HistoryTable: React.FC<HistoryTableProps> = ({ records, isDeleteMode, onUpdate, onDelete, onReorder, gameMode = 'GOLD' }) => {
    const [draggedSeparatorIndex, setDraggedSeparatorIndex] = React.useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
    const [dropSuccess, setDropSuccess] = React.useState<number | null>(null);
    
    // 区切り行をドラッグ開始
    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
        setDraggedSeparatorIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };
    
    // ドロップ可能エリアの上にドラッグ中
    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };
    
    // ドラッグが離れた時
    const handleDragLeave = () => {
        setDragOverIndex(null);
    };
    
    // ドロップ時の処理
    const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, dropIndex: number) => {
        e.preventDefault();
        if (draggedSeparatorIndex !== null && draggedSeparatorIndex !== dropIndex && onReorder) {
            // レコードの順序を入れ替える
            const newRecords = [...records];
            const [draggedRecord] = newRecords.splice(draggedSeparatorIndex, 1);
            newRecords.splice(dropIndex, 0, draggedRecord);
            
            // 成功アニメーション
            setDropSuccess(dropIndex);
            setTimeout(() => setDropSuccess(null), 1000);
            
            // 親コンポーネントに新しい順序を通知
            onReorder(newRecords);
        }
        setDraggedSeparatorIndex(null);
        setDragOverIndex(null);
    };
    
    const BonusTypeSelector: React.FC<{ record: GameRecord }> = ({ record }) => {
        const types: BonusType[] = [BonusType.BB, BonusType.RB, BonusType.CURRENT, BonusType.SEPARATOR];
        
        return (
            <div className="grid grid-cols-2 gap-1">
                {types.map(type => {
                    const isSelected = type === BonusType.SEPARATOR ? record.isSeparator : record.bonusType === type;
                    const styleMap = {
                        [BonusType.BB]: 'hover:bg-red-200 ' + (isSelected ? 'bg-brand-red text-white' : 'bg-red-100 text-brand-red'),
                        [BonusType.RB]: 'hover:bg-blue-200 ' + (isSelected ? 'bg-brand-blue text-white' : 'bg-blue-100 text-brand-blue'),
                        [BonusType.CURRENT]: 'hover:bg-orange-200 ' + (isSelected ? 'bg-brand-orange text-white' : 'bg-orange-100 text-brand-orange'),
                        [BonusType.SEPARATOR]: 'hover:bg-green-200 ' + (isSelected ? 'bg-brand-green text-white' : 'bg-green-100 text-brand-green'),
                        [BonusType.EMPTY]: ''
                    };

                    const handleClick = () => {
                        if (type === BonusType.SEPARATOR) {
                            onUpdate(record.id, { isSeparator: !record.isSeparator });
                        } else {
                            onUpdate(record.id, { bonusType: record.bonusType === type ? BonusType.EMPTY : type });
                        }
                    };
                    
                    return (
                        <button
                            key={type}
                            onClick={handleClick}
                            className={`px-2 py-1.5 text-xs font-bold rounded transition-colors duration-150 ${styleMap[type]}`}
                        >
                            {type}
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] border-collapse table-fixed">
                <thead>
                    <tr className={`${gameMode === 'BLACK' ? 'bg-red-600' : 'bg-gold'} text-white`}>
                        <th className="w-12 p-2 text-sm font-semibold text-center">回</th>
                        <th className="w-24 p-2 text-sm font-semibold text-center">G数</th>
                        <th className="w-32 p-2 text-sm font-semibold text-center">種別</th>
                        <th className="p-2 text-sm font-semibold text-center">有利区間G数</th>
                    </tr>
                </thead>
                <tbody className={gameMode === 'BLACK' ? 'bg-gray-800' : 'bg-white'}>
                    {records.map((record, index) => (
                        <React.Fragment key={record.id}>
                            {record.isSeparator && (
                                <tr 
                                    className={`
                                        ${gameMode === 'BLACK' ? 'bg-gray-600' : 'bg-gray-200'} 
                                        ${draggedSeparatorIndex === index ? 'opacity-40 scale-105' : ''} 
                                        ${dropSuccess === index ? 'animate-pulse bg-green-400 scale-110' : ''}
                                        cursor-move transition-all duration-300 hover:shadow-lg relative
                                        ${draggedSeparatorIndex !== null && draggedSeparatorIndex !== index ? 'hover:scale-[1.02]' : ''}
                                    `}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, index)}
                                >
                                    <td colSpan={4} className={`
                                        text-center py-1 text-sm font-semibold italic 
                                        ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-600'} 
                                        ${dragOverIndex === index ? 'bg-gradient-to-r from-blue-400 to-cyan-400 bg-opacity-30 animate-pulse' : ''}
                                        transition-all duration-300
                                    `}>
                                        <span className="select-none flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4 inline-block" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"/>
                                            </svg>
                                            -- 区切り --
                                            <svg className="w-4 h-4 inline-block" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"/>
                                            </svg>
                                        </span>
                                    </td>
                                </tr>
                            )}
                            <tr 
                                className={`
                                    ${gameMode === 'BLACK' ? 'border-b border-gray-600 hover:bg-gray-700' : 'border-b border-gray-200 hover:bg-gray-50'} 
                                    ${!record.isSeparator && dragOverIndex === index ? 
                                        `${gameMode === 'BLACK' ? 'bg-gradient-to-r from-gray-700 to-gray-600' : 'bg-gradient-to-r from-blue-50 to-cyan-50'} 
                                         shadow-inner border-2 ${gameMode === 'BLACK' ? 'border-blue-500' : 'border-blue-400'} transition-all duration-300` 
                                        : 'transition-colors duration-150'
                                    }
                                `}
                                onDragOver={(e) => !record.isSeparator && handleDragOver(e, index)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => !record.isSeparator && handleDrop(e, index)}
                            >
                                <td className={`p-2 text-center ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {isDeleteMode ? (
                                        <button onClick={() => onDelete(record.id)} className="w-full h-full flex items-center justify-center text-red-500 hover:text-red-700">
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    ) : (
                                        record.segmentNumber
                                    )}
                                </td>
                                <td className="p-2 text-center">
                                    <input 
                                        type="number" 
                                        value={record.gameCount}
                                        onChange={(e) => onUpdate(record.id, { gameCount: e.target.value })}
                                        className={`w-full px-2 py-1 text-center border rounded-md focus:ring-1 ${
                                            gameMode === 'BLACK' 
                                                ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-400 focus:border-red-400 placeholder-gray-400' 
                                                : 'bg-white text-gray-900 border-gray-300 focus:ring-gold focus:border-gold placeholder-gray-500'
                                        }`}
                                        placeholder="G数"
                                    />
                                </td>
                                <td className="p-2 text-center">
                                    <BonusTypeSelector record={record} />
                                </td>
                                <td className={`p-2 text-center font-mono ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {record.favorableZoneStart}G
                                    <span className="mx-1">→</span>
                                    {record.favorableZoneEnd}G
                                </td>
                            </tr>
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default HistoryTable;
