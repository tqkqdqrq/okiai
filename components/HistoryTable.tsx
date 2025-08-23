
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

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
  element: HTMLElement;
  index: number;
  longPressTimer?: number;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ records, isDeleteMode, onUpdate, onDelete, onReorder, gameMode = 'GOLD' }) => {
    const [draggedSeparatorIndex, setDraggedSeparatorIndex] = React.useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
    const [dropSuccess, setDropSuccess] = React.useState<number | null>(null);
    const [touchData, setTouchData] = React.useState<TouchData | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isLongPress, setIsLongPress] = React.useState(false);
    const [dragPreview, setDragPreview] = React.useState<{x: number, y: number} | null>(null);
    
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
    
    // バイブレーション関数
    const triggerHapticFeedback = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(50); // 50ms の短いバイブレーション
        }
    };
    
    // タッチイベント（スマホ対応） - 長押しドラッグ
    const handleTouchStart = (e: React.TouchEvent<HTMLTableRowElement>, index: number) => {
        if (!records[index].isSeparator) return;
        
        const touch = e.touches[0];
        const element = e.currentTarget;
        
        // 長押しタイマーを設定
        const longPressTimer = window.setTimeout(() => {
            setIsLongPress(true);
            setDraggedSeparatorIndex(index);
            triggerHapticFeedback();
            
            // 長押し成功時の視覚的フィードバック
            element.style.transform = 'scale(1.1)';
            element.style.opacity = '0.9';
            element.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
            element.style.zIndex = '1000';
            element.style.transition = 'all 0.2s ease-out';
        }, 500); // 500ms の長押し
        
        setTouchData({
            startX: touch.clientX,
            startY: touch.clientY,
            startTime: Date.now(),
            element,
            index,
            longPressTimer
        });
        setIsDragging(false);
    };
    
    const handleTouchMove = (e: React.TouchEvent<HTMLTableRowElement>) => {
        if (!touchData) return;
        
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchData.startX);
        const deltaY = Math.abs(touch.clientY - touchData.startY);
        const totalDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // 長押し中に大きく動いた場合は長押しをキャンセル
        if (totalDelta > 15 && !isLongPress) {
            if (touchData.longPressTimer) {
                clearTimeout(touchData.longPressTimer);
            }
            resetTouchState();
            return;
        }
        
        // 長押しが完了している場合のみドラッグを許可
        if (isLongPress) {
            e.preventDefault(); // スクロール防止
            setIsDragging(true);
            
            // ドラッグ中の要素を移動
            const offsetY = touch.clientY - touchData.startY;
            touchData.element.style.transform = `translateY(${offsetY}px) scale(1.1)`;
            touchData.element.style.transition = 'none'; // ドラッグ中はトランジション無効
            
            // 仮想的なドラッグプレビューを設定
            setDragPreview({
                x: touch.clientX,
                y: touch.clientY
            });
            
            // より正確なドロップ位置検出
            const tableRect = touchData.element.closest('table')?.getBoundingClientRect();
            if (tableRect) {
                const rows = Array.from(touchData.element.closest('tbody')?.querySelectorAll('tr') || []);
                let bestTargetIndex = -1;
                let bestDistance = Infinity;
                
                rows.forEach((row, idx) => {
                    const rect = row.getBoundingClientRect();
                    const rowCenterY = rect.top + rect.height / 2;
                    const distance = Math.abs(touch.clientY - rowCenterY);
                    
                    if (distance < bestDistance && idx !== touchData.index) {
                        bestDistance = distance;
                        bestTargetIndex = idx;
                    }
                });
                
                if (bestTargetIndex >= 0 && bestDistance < 50) { // 50px以内で有効
                    setDragOverIndex(bestTargetIndex);
                } else {
                    setDragOverIndex(null);
                }
            }
        }
    };
    
    const resetTouchState = () => {
        if (touchData) {
            // スタイルをリセット
            touchData.element.style.transform = '';
            touchData.element.style.opacity = '';
            touchData.element.style.boxShadow = '';
            touchData.element.style.zIndex = '';
            touchData.element.style.transition = '';
            
            if (touchData.longPressTimer) {
                clearTimeout(touchData.longPressTimer);
            }
        }
        
        setTouchData(null);
        setDraggedSeparatorIndex(null);
        setDragOverIndex(null);
        setIsDragging(false);
        setIsLongPress(false);
        setDragPreview(null);
    };
    
    const handleTouchEnd = (e: React.TouchEvent<HTMLTableRowElement>) => {
        if (!touchData) return;
        
        // 長押しタイマーをクリア
        if (touchData.longPressTimer) {
            clearTimeout(touchData.longPressTimer);
        }
        
        // ドラッグ完了の場合
        if (isLongPress && isDragging && dragOverIndex !== null && dragOverIndex !== touchData.index && onReorder) {
            // ドロップ処理
            const newRecords = [...records];
            const [draggedRecord] = newRecords.splice(touchData.index, 1);
            newRecords.splice(dragOverIndex, 0, draggedRecord);
            
            setDropSuccess(dragOverIndex);
            setTimeout(() => setDropSuccess(null), 1000);
            onReorder(newRecords);
            
            triggerHapticFeedback(); // 成功時のフィードバック
        } else if (isLongPress) {
            // 長押ししたが有効なドロップ位置がない場合のアニメーション
            touchData.element.style.transition = 'all 0.3s ease-out';
            touchData.element.style.transform = 'scale(1.05)';
            setTimeout(() => {
                if (touchData.element) {
                    touchData.element.style.transform = '';
                }
            }, 150);
        }
        
        // 状態をリセット
        setTimeout(resetTouchState, 100); // 少し遅延してリセット
    };
    
    const handleTouchCancel = (e: React.TouchEvent<HTMLTableRowElement>) => {
        resetTouchState();
    };
    
    // クリーンアップ効果
    React.useEffect(() => {
        return () => {
            // コンポーネントアンマウント時にタイマーをクリア
            if (touchData?.longPressTimer) {
                clearTimeout(touchData.longPressTimer);
            }
        };
    }, [touchData]);
    
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
                        <th className="w-24 p-2 text-sm font-semibold text-center">Ｇ数</th>
                        <th className="w-32 p-2 text-sm font-semibold text-center">種</th>
                        <th className="w-24 p-2 text-sm font-semibold text-center">有利開始</th>
                        <th className="w-24 p-2 text-sm font-semibold text-center">終了</th>
                    </tr>
                </thead>
                <tbody className={gameMode === 'BLACK' ? 'bg-gray-800' : 'bg-white'}>
                    {records.map((record, index) => (
                        <React.Fragment key={record.id}>
                            {record.isSeparator && (
                                <tr 
                                    data-index={index}
                                    className={`
                                        ${gameMode === 'BLACK' ? 'bg-gray-600' : 'bg-gray-200'} 
                                        ${draggedSeparatorIndex === index ? 'opacity-70' : ''} 
                                        ${dropSuccess === index ? 'animate-bounce bg-green-400 scale-110' : ''}
                                        ${isLongPress && draggedSeparatorIndex === index ? 'shadow-2xl ring-4 ring-blue-400 ring-opacity-50' : ''}
                                        cursor-move transition-all duration-200 hover:shadow-lg relative
                                        ${!isLongPress ? 'hover:scale-[1.02] hover:shadow-md' : ''}
                                        touch-none select-none
                                        ${isDragging && draggedSeparatorIndex === index ? 'z-50' : ''}
                                    `}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onTouchStart={(e) => handleTouchStart(e, index)}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                    onTouchCancel={handleTouchCancel}
                                >
                                    <td colSpan={5} className={`
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
                                data-index={index}
                                className={`
                                    ${gameMode === 'BLACK' ? 'border-b border-gray-600 hover:bg-gray-700' : 'border-b border-gray-200 hover:bg-gray-50'} 
                                    ${!record.isSeparator && dragOverIndex === index ? 
                                        `${gameMode === 'BLACK' ? 'bg-gradient-to-r from-blue-900 to-blue-800' : 'bg-gradient-to-r from-blue-100 to-cyan-100'} 
                                         shadow-lg border-2 ${gameMode === 'BLACK' ? 'border-blue-400' : 'border-blue-500'} 
                                         ring-2 ring-blue-300 ring-opacity-50 transition-all duration-200 transform scale-[1.02]` 
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
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const nextInput = e.currentTarget.closest('tr')?.nextElementSibling?.querySelector('input[type="number"]') as HTMLInputElement;
                                                if (nextInput) {
                                                    nextInput.focus();
                                                    nextInput.select();
                                                }
                                            }
                                        }}
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
                                <td className={`p-2 text-center font-mono text-xs ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {record.favorableZoneStart}G
                                </td>
                                <td className={`p-2 text-center font-mono text-xs ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-600'}`}>
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
