
import React from 'react';
import type { GameRecord } from '../types';
import { BonusType } from '../types';
import { TrashIcon } from './icons';
import CustomNumpad from './CustomNumpad';

interface HistoryTableProps {
  records: GameRecord[];
  isDeleteMode: boolean;
  onUpdate: (id: number, updatedFields: Partial<Omit<GameRecord, 'id'>>) => void;
  onDelete: (id: number) => void;
  onReorder?: (newRecords: GameRecord[]) => void;
  gameMode?: 'GOLD' | 'BLACK';
  onNumpadToggle?: (show: boolean) => void;
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
  element: HTMLElement;
  index: number;
  longPressTimer?: number;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ records, isDeleteMode, onUpdate, onDelete, onReorder, gameMode = 'GOLD', onNumpadToggle }) => {
    const [draggedSeparatorIndex, setDraggedSeparatorIndex] = React.useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
    const [dropSuccess, setDropSuccess] = React.useState<number | null>(null);
    const [touchData, setTouchData] = React.useState<TouchData | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isLongPress, setIsLongPress] = React.useState(false);
    const [dragPreview, setDragPreview] = React.useState<{x: number, y: number} | null>(null);
    const [showNumpad, setShowNumpad] = React.useState(false);
    const [focusedRecordId, setFocusedRecordId] = React.useState<number | null>(null);
    const inputRefs = React.useRef<{ [key: number]: HTMLInputElement | null }>({});
    
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
            const draggedRecord = records[draggedSeparatorIndex];
            const targetRecord = records[dropIndex];
            
            // 区切りレコード同士の移動のみ許可
            if (draggedRecord.isSeparator && targetRecord.isSeparator) {
                // 区切りレコードのisSeparatorフラグを入れ替える
                const newRecords = [...records];
                newRecords[draggedSeparatorIndex] = { ...draggedRecord, isSeparator: false };
                newRecords[dropIndex] = { ...targetRecord, isSeparator: true };
                
                // 成功アニメーション
                setDropSuccess(dropIndex);
                setTimeout(() => setDropSuccess(null), 1000);
                
                // 親コンポーネントに新しい順序を通知
                onReorder(newRecords);
            } else if (draggedRecord.isSeparator) {
                // 区切りを通常レコードの位置に移動する場合
                const newRecords = [...records];
                newRecords[draggedSeparatorIndex] = { ...draggedRecord, isSeparator: false };
                newRecords[dropIndex] = { ...targetRecord, isSeparator: true };
                
                // 成功アニメーション
                setDropSuccess(dropIndex);
                setTimeout(() => setDropSuccess(null), 1000);
                
                // 親コンポーネントに新しい順序を通知
                onReorder(newRecords);
            }
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
                    const rect = (row as HTMLElement).getBoundingClientRect();
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
            const draggedRecord = records[touchData.index];
            const targetRecord = records[dragOverIndex];
            
            // 区切りレコードの移動処理
            if (draggedRecord.isSeparator) {
                const newRecords = [...records];
                newRecords[touchData.index] = { ...draggedRecord, isSeparator: false };
                newRecords[dragOverIndex] = { ...targetRecord, isSeparator: true };
                
                setDropSuccess(dragOverIndex);
                setTimeout(() => setDropSuccess(null), 1000);
                onReorder(newRecords);
                
                triggerHapticFeedback(); // 成功時のフィードバック
            }
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
    
    const BonusTypeDisplay: React.FC<{ record: GameRecord }> = ({ record }) => {
        const typeDisplay = {
            [BonusType.BB]: { text: 'BB', className: gameMode === 'BLACK' ? 'bg-red-800 text-red-200' : 'bg-red-600 text-white' },
            [BonusType.RB]: { text: 'RB', className: gameMode === 'BLACK' ? 'bg-blue-800 text-blue-200' : 'bg-blue-600 text-white' },
            [BonusType.CURRENT]: { text: '現在', className: gameMode === 'BLACK' ? 'bg-orange-800 text-orange-200' : 'bg-orange-600 text-white' },
            [BonusType.EMPTY]: { text: '-', className: gameMode === 'BLACK' ? 'text-gray-500' : 'text-gray-400' },
            [BonusType.SEPARATOR]: { text: '', className: '' }
        };
        
        const display = typeDisplay[record.bonusType] || typeDisplay[BonusType.EMPTY];
        
        return display.text ? (
            <span className={`inline-block px-1 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded ${display.className}`}>
                {display.text}
            </span>
        ) : null;
    };

    const handleNumberClick = (num: string) => {
        if (focusedRecordId !== null) {
            const record = records.find(r => r.id === focusedRecordId);
            if (record) {
                const currentValue = record.gameCount || '';
                onUpdate(focusedRecordId, { gameCount: currentValue + num });
            }
        }
    };

    const handleBonusTypeClick = (type: BonusType) => {
        if (focusedRecordId !== null) {
            const record = records.find(r => r.id === focusedRecordId);
            if (record) {
                // 現在のレコードのボーナスタイプを更新
                const newBonusType = record.bonusType === type ? BonusType.EMPTY : type;
                onUpdate(focusedRecordId, { 
                    bonusType: newBonusType 
                });
                
                // 自動的に次の行へ移動
                const currentIndex = records.findIndex(r => r.id === focusedRecordId);
                if (currentIndex !== -1) {
                    if (currentIndex < records.length - 1) {
                        // 次の行が存在する場合
                        const nextRecord = records[currentIndex + 1];
                        setFocusedRecordId(nextRecord.id);
                        setTimeout(() => {
                            inputRefs.current[nextRecord.id]?.focus();
                        }, 50);
                    } else if (onReorder && type !== BonusType.CURRENT) {
                        // 最終行でBB/RBボタンの場合のみ、新しい行を自動追加（現在ボタンは除外）
                        const updatedRecord = {
                            ...record,
                            bonusType: newBonusType
                        };
                        
                        // 更新を反映したレコード配列を作成
                        const updatedRecords = records.map(r => 
                            r.id === focusedRecordId ? updatedRecord : r
                        );
                        
                        // 新しい行を追加
                        const newRecord: GameRecord = {
                            id: Date.now() + Math.random(),
                            gameCount: '',
                            bonusType: BonusType.EMPTY,
                            isSeparator: false
                        };
                        
                        const newRecords = [...updatedRecords, newRecord];
                        onReorder(newRecords);
                        
                        // 新しい行にフォーカス
                        setTimeout(() => {
                            setFocusedRecordId(newRecord.id);
                            setTimeout(() => {
                                inputRefs.current[newRecord.id]?.focus();
                            }, 100);
                        }, 50);
                    }
                }
            }
        }
    };

    const handleSeparatorClick = () => {
        if (focusedRecordId !== null) {
            const record = records.find(r => r.id === focusedRecordId);
            if (record) {
                onUpdate(focusedRecordId, { isSeparator: !record.isSeparator });
            }
        }
    };

    const handleBackspaceClick = () => {
        if (focusedRecordId !== null) {
            const record = records.find(r => r.id === focusedRecordId);
            if (record && record.gameCount) {
                onUpdate(focusedRecordId, { 
                    gameCount: record.gameCount.slice(0, -1) 
                });
            }
        }
    };

    const handleEnterClick = () => {
        setShowNumpad(false);
        setFocusedRecordId(null);
        onNumpadToggle?.(false);
    };

    const handleNavigateClick = (direction: 'up' | 'down') => {
        const currentIndex = records.findIndex(r => r.id === focusedRecordId);
        if (currentIndex === -1) return;

        if (direction === 'up' && currentIndex > 0) {
            const prevRecord = records[currentIndex - 1];
            setFocusedRecordId(prevRecord.id);
            setTimeout(() => {
                inputRefs.current[prevRecord.id]?.focus();
            }, 50);
        } else if (direction === 'down' && currentIndex < records.length - 1) {
            const nextRecord = records[currentIndex + 1];
            setFocusedRecordId(nextRecord.id);
            setTimeout(() => {
                inputRefs.current[nextRecord.id]?.focus();
            }, 50);
        }
    };

    const handleAddRowClick = (position: 'top' | 'bottom') => {
        if (focusedRecordId === null) return;
        
        const currentIndex = records.findIndex(r => r.id === focusedRecordId);
        if (currentIndex === -1) return;
        
        const newRecord: GameRecord = { 
            id: Date.now() + Math.random(), 
            gameCount: '', 
            bonusType: BonusType.EMPTY, 
            isSeparator: false 
        };
        
        const newRecords = [...records];
        if (position === 'top') {
            newRecords.splice(currentIndex, 0, newRecord);
        } else {
            newRecords.splice(currentIndex + 1, 0, newRecord);
        }
        
        if (onReorder) {
            onReorder(newRecords);
        }
        
        // 新しい行にフォーカス
        setTimeout(() => {
            setFocusedRecordId(newRecord.id);
            setTimeout(() => {
                inputRefs.current[newRecord.id]?.focus();
            }, 100);
        }, 50);
    };

    const handleCloseNumpad = () => {
        setShowNumpad(false);
        setFocusedRecordId(null);
        onNumpadToggle?.(false);
    };

    return (
        <div className="w-full">
            <table className="w-full border-collapse">
                <thead>
                    <tr className={`${gameMode === 'BLACK' ? 'bg-red-600' : 'bg-gold'} text-white`}>
                        <th className="w-6 sm:w-10 p-1 sm:p-2 text-xs sm:text-sm font-semibold text-center">回</th>
                        <th className="w-14 sm:w-20 p-1 sm:p-2 text-xs sm:text-sm font-semibold text-center">Ｇ数</th>
                        <th className="w-10 sm:w-16 p-1 sm:p-2 text-xs sm:text-sm font-semibold text-center">種</th>
                        <th className="flex-1 p-1 sm:p-2 text-xs sm:text-sm font-semibold text-center">有利区間G数</th>
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
                                    <td colSpan={4} className={`
                                        text-center py-0.5 sm:py-1 text-xs sm:text-sm font-semibold italic 
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
                                    ${record.isSeparator ? (gameMode === 'BLACK' ? 'bg-green-900 bg-opacity-30' : 'bg-green-50') : ''}
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
                                <td className={`p-1 sm:p-2 text-center text-xs sm:text-sm ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {isDeleteMode ? (
                                        <button onClick={() => onDelete(record.id)} className="w-full h-full flex items-center justify-center text-red-500 hover:text-red-700">
                                            <TrashIcon className="w-4 sm:w-5 h-4 sm:h-5"/>
                                        </button>
                                    ) : (
                                        record.segmentNumber
                                    )}
                                </td>
                                <td className="p-1 sm:p-2 text-center">
                                    <input 
                                        ref={(el) => { inputRefs.current[record.id] = el; }}
                                        type="text" 
                                        inputMode="none"
                                        value={record.gameCount}
                                        onFocus={(e) => {
                                            setFocusedRecordId(record.id);
                                            setShowNumpad(true);
                                            onNumpadToggle?.(true);
                                            // スクロール位置の調整
                                            setTimeout(() => {
                                                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }, 100);
                                        }}
                                        readOnly
                                        style={{ fontSize: '16px' }} // iOS自動ズーム防止
                                        className={`w-full px-1 sm:px-2 py-0.5 sm:py-1 text-center border rounded focus:ring-1 ${
                                            gameMode === 'BLACK' 
                                                ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-400 focus:border-red-400 placeholder-gray-400' 
                                                : 'bg-white text-gray-900 border-gray-300 focus:ring-gold focus:border-gold placeholder-gray-500'
                                        } ${
                                            focusedRecordId === record.id ? 'ring-2 ring-blue-400' : ''
                                        }`}
                                        placeholder="G数"
                                    />
                                </td>
                                <td className="p-1 sm:p-2 text-center">
                                    <BonusTypeDisplay record={record} />
                                </td>
                                <td className={`p-1 sm:p-2 text-center font-mono text-sm sm:text-base whitespace-nowrap ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {record.favorableZoneStart}G→{record.favorableZoneEnd}G
                                </td>
                            </tr>
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
            
            {showNumpad && (
                <CustomNumpad
                    onNumberClick={handleNumberClick}
                    onBonusTypeClick={handleBonusTypeClick}
                    onSeparatorClick={handleSeparatorClick}
                    onEnterClick={handleEnterClick}
                    onNavigateClick={handleNavigateClick}
                    onBackspaceClick={handleBackspaceClick}
                    onAddRowClick={handleAddRowClick}
                    onClose={handleCloseNumpad}
                    gameMode={gameMode}
                />
            )}
        </div>
    );
};

export default HistoryTable;
