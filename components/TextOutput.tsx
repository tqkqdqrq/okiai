import React, { useState, useCallback, useMemo } from 'react';
import type { GameRecord } from '../types';

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
  element: HTMLElement;
  index: number;
  longPressTimer?: number;
}

interface TextOutputProps {
  records: GameRecord[];
  gameMode?: 'GOLD' | 'BLACK';
  onReorder?: (newRecords: GameRecord[]) => void;
}

export default function TextOutput({ records, gameMode = 'GOLD', onReorder }: TextOutputProps): React.ReactNode {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [touchData, setTouchData] = useState<TouchData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const [dragPreview, setDragPreview] = useState<{x: number, y: number} | null>(null);

  // ドラッグ開始
  const handleDragStart = useCallback((e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    const record = records[index];
    if (record?.isSeparator) {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
    }
  }, [records]);

  // ドラッグオーバー
  const handleDragOver = useCallback((e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  // ドラッグ終了
  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  // ドロップ
  const handleDrop = useCallback((e: React.DragEvent<HTMLTableRowElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex && onReorder) {
      const newRecords = [...records];
      const [draggedRecord] = newRecords.splice(draggedIndex, 1);
      newRecords.splice(dropIndex, 0, draggedRecord);
      onReorder(newRecords);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, records, onReorder]);

  // バイブレーション関数
  const triggerHapticFeedback = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  // タッチイベント（スマホ対応） - 長押しドラッグ
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLTableRowElement>, index: number) => {
    const record = records[index];
    if (!record?.isSeparator) return;
    
    const touch = e.touches[0];
    const element = e.currentTarget;
    
    // 長押しタイマーを設定
    const longPressTimer = window.setTimeout(() => {
      setIsLongPress(true);
      setDraggedIndex(index);
      triggerHapticFeedback();
      
      // 長押し成功時の視覚的フィードバック
      element.style.transform = 'scale(1.1)';
      element.style.opacity = '0.9';
      element.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
      element.style.zIndex = '1000';
      element.style.transition = 'all 0.2s ease-out';
    }, 500);
    
    setTouchData({
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      element,
      index,
      longPressTimer
    });
    setIsDragging(false);
  }, [records, triggerHapticFeedback]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLTableRowElement>) => {
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
      e.preventDefault();
      setIsDragging(true);
      
      // ドラッグ中の要素を移動
      const offsetY = touch.clientY - touchData.startY;
      touchData.element.style.transform = `translateY(${offsetY}px) scale(1.1)`;
      touchData.element.style.transition = 'none';
      
      setDragPreview({
        x: touch.clientX,
        y: touch.clientY
      });
      
      // ドロップ位置検出
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
        
        if (bestTargetIndex >= 0 && bestDistance < 50) {
          setDragOverIndex(bestTargetIndex);
        } else {
          setDragOverIndex(null);
        }
      }
    }
  }, [touchData, isLongPress]);
  
  const resetTouchState = useCallback(() => {
    if (touchData) {
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
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
    setIsLongPress(false);
    setDragPreview(null);
  }, [touchData]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLTableRowElement>) => {
    if (!touchData) return;
    
    if (touchData.longPressTimer) {
      clearTimeout(touchData.longPressTimer);
    }
    
    // ドラッグ完了の場合
    if (isLongPress && isDragging && dragOverIndex !== null && dragOverIndex !== touchData.index && onReorder) {
      const newRecords = [...records];
      const [draggedRecord] = newRecords.splice(touchData.index, 1);
      newRecords.splice(dragOverIndex, 0, draggedRecord);
      onReorder(newRecords);
      triggerHapticFeedback();
    } else if (isLongPress) {
      // 長押ししたが有効なドロップ位置がない場合
      touchData.element.style.transition = 'all 0.3s ease-out';
      touchData.element.style.transform = 'scale(1.05)';
      setTimeout(() => {
        if (touchData.element) {
          touchData.element.style.transform = '';
        }
      }, 150);
    }
    
    setTimeout(resetTouchState, 100);
  }, [touchData, isLongPress, isDragging, dragOverIndex, onReorder, records, triggerHapticFeedback, resetTouchState]);
  
  const handleTouchCancel = useCallback((e: React.TouchEvent<HTMLTableRowElement>) => {
    resetTouchState();
  }, [resetTouchState]);

  // クリーンアップ
  React.useEffect(() => {
    return () => {
      if (touchData?.longPressTimer) {
        clearTimeout(touchData.longPressTimer);
      }
    };
  }, [touchData]);

  const resultHtml = useMemo(() => {
    // 全レコードを処理（区切り行も現在も含む）
    const allRecords = records;
    
    if (allRecords.length === 0) {
      return '<div style="color: #666; padding: 8px;">データがありません。履歴を入力してください。</div>';
    }

    const bgColor = gameMode === 'BLACK' ? '#1f2937' : '#f7f7f7';
    const borderColor = gameMode === 'BLACK' ? '#4b5563' : '#ccc';
    const textColor = gameMode === 'BLACK' ? '#f9fafb' : '#000';
    
    let html = `<div style="font-family: monospace; font-size: 12px; padding: 4px 8px; background: ${bgColor}; border: 1px solid ${borderColor}; line-height: 1.4; color: ${textColor};">`;
    
    // ヘッダー
    const headerColor = gameMode === 'BLACK' ? '#ef4444' : '#1976d2';
    const headerText = gameMode === 'BLACK' ? '沖ドキBLACK&GS 有利区間計算結果' : '沖ドキGOLD 有利区間計算結果';
    html += `<div style="font-weight: bold; margin-bottom: 8px; color: ${headerColor};">${headerText}</div>`;
    
    // 統計情報（区切り行を除く）
    const validRecords = allRecords.filter(record => !record.isSeparator && record.gameCount);
    const bbCount = validRecords.filter(r => r.bonusType === 'BB').length;
    const rbCount = validRecords.filter(r => r.bonusType === 'RB').length;
    const currentCount = validRecords.filter(r => r.bonusType === '現在').length;
    
    html += `<div style="margin-bottom: 12px;">`;
    html += `総レコード数: ${validRecords.length} | `;
    html += `BB回数: ${bbCount} | `;
    html += `RB回数: ${rbCount}`;
    if (currentCount > 0) {
      html += ` | 現在: ${currentCount}`;
    }
    html += `</div>`;
    
    // データ表
    const tableBgColor = gameMode === 'BLACK' ? '#374151' : '#eee';
    const cellBorderColor = gameMode === 'BLACK' ? '#6b7280' : '#ccc';
    
    html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">';
    html += `<tr style="background: ${tableBgColor}; font-weight: bold;">`;
    html += `<td style="padding: 2px 4px; border: 1px solid ${cellBorderColor};">回</td>`;
    html += `<td style="padding: 2px 4px; border: 1px solid ${cellBorderColor};">Ｇ数</td>`;
    html += `<td style="padding: 2px 4px; border: 1px solid ${cellBorderColor};">種</td>`;
    html += `<td style="padding: 2px 4px; border: 1px solid ${cellBorderColor};">有利開始</td>`;
    html += `<td style="padding: 2px 4px; border: 1px solid ${cellBorderColor};">終了</td>`;
    html += '</tr>';
    
    let rowNumber = 1;
    const separatorBgColor = gameMode === 'BLACK' ? '#4b5563' : '#ddd';
    const separatorTextColor = gameMode === 'BLACK' ? '#d1d5db' : '#666';
    
    allRecords.forEach((record) => {
      if (record.isSeparator) {
        // 区切り線を表示
        html += `<tr style="background: ${separatorBgColor};">`;
        html += `<td colspan="5" style="padding: 4px; border: 1px solid ${cellBorderColor}; text-align: center; font-weight: bold; color: ${separatorTextColor};">--- 区切り ---</td>`;
        html += '</tr>';
      } else {
        html += '<tr>';
        html += `<td style="padding: 2px 4px; border: 1px solid ${cellBorderColor}; text-align: center;">${rowNumber}</td>`;
        html += `<td style="padding: 2px 4px; border: 1px solid ${cellBorderColor}; text-align: right;">${record.gameCount || ''}</td>`;
        html += `<td style="padding: 2px 4px; border: 1px solid ${cellBorderColor}; text-align: center; color: ${record.bonusType === 'BB' ? '#d32f2f' : '#1976d2'};">${record.bonusType || ''}</td>`;
        html += `<td style="padding: 2px 4px; border: 1px solid ${cellBorderColor}; text-align: right;">${record.favorableZoneStart || ''}</td>`;
        html += `<td style="padding: 2px 4px; border: 1px solid ${cellBorderColor}; text-align: right;">${record.favorableZoneEnd || ''}</td>`;
        html += '</tr>';
        rowNumber++;
      }
    });
    
    html += '</table>';
    
    // 生成日時
    html += `<div style="text-align: right; font-size: 10px; color: #666; margin-top: 8px;">`;
    html += `生成日時: ${new Date().toLocaleString('ja-JP')}`;
    html += `</div>`;
    
    html += '</div>';
    return html;
  }, [records, gameMode]);

  const copyToClipboard = useCallback(async () => {
    // HTMLをプレーンテキストに変換
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = resultHtml;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    try {
      await navigator.clipboard.writeText(textContent);
      alert('結果をクリップボードにコピーしました！');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('コピーに失敗しました。テキストを手動で選択してコピーしてください。');
    }
  }, [resultHtml]);

  // 全レコード（現在も含む）
  const allRecords = records;
  const validRecords = allRecords.filter(record => !record.isSeparator && record.gameCount);
  const bbCount = validRecords.filter(r => r.bonusType === 'BB').length;
  const rbCount = validRecords.filter(r => r.bonusType === 'RB').length;
  const currentCount = validRecords.filter(r => r.bonusType === '現在').length;

  return (
    <div className={`mt-4 pt-4 ${gameMode === 'BLACK' ? 'border-t border-gray-600' : 'border-t'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${gameMode === 'BLACK' ? 'text-white' : 'text-gray-700'}`}>結果</h3>
        <button 
          onClick={copyToClipboard}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-200"
        >
          コピー
        </button>
      </div>
      
      {/* 統計情報 */}
      <div className={`mb-2 text-sm ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-700'}`}>
        <span className={`font-bold ${gameMode === 'BLACK' ? 'text-red-400' : 'text-blue-600'}`}>
          {gameMode === 'BLACK' ? '沖ドキBLACK&GS' : '沖ドキGOLD'} 有利区間計算結果
        </span>
        <div className="mt-1">
          総レコード数: {validRecords.length} | BB回数: {bbCount} | RB回数: {rbCount}
          {currentCount > 0 && ` | 現在: ${currentCount}`}
        </div>
      </div>

      {/* インタラクティブテーブル */}
      <div className={`border rounded-lg overflow-auto max-h-96 ${gameMode === 'BLACK' ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`${gameMode === 'BLACK' ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'} font-bold`}>
              <td className={`px-2 py-1 border ${gameMode === 'BLACK' ? 'border-gray-600' : 'border-gray-300'}`}>回</td>
              <td className={`px-2 py-1 border ${gameMode === 'BLACK' ? 'border-gray-600' : 'border-gray-300'}`}>Ｇ数</td>
              <td className={`px-2 py-1 border ${gameMode === 'BLACK' ? 'border-gray-600' : 'border-gray-300'}`}>種</td>
              <td className={`px-2 py-1 border ${gameMode === 'BLACK' ? 'border-gray-600' : 'border-gray-300'}`}>有利開始</td>
              <td className={`px-2 py-1 border ${gameMode === 'BLACK' ? 'border-gray-600' : 'border-gray-300'}`}>終了</td>
            </tr>
          </thead>
          <tbody>
            {allRecords.map((record, index) => {
              let rowNumber = allRecords.slice(0, index + 1).filter(r => !r.isSeparator).length;
              
              if (record.isSeparator) {
                return (
                  <tr 
                    key={record.id}
                    className={`
                      ${gameMode === 'BLACK' ? 'bg-gray-600' : 'bg-gray-300'} 
                      ${draggedIndex === index ? 'opacity-70' : ''} 
                      ${isLongPress && draggedIndex === index ? 'shadow-2xl ring-4 ring-blue-400 ring-opacity-50' : ''}
                      cursor-move transition-all duration-200 hover:shadow-lg relative
                      ${!isLongPress ? 'hover:scale-[1.02] hover:shadow-md' : ''}
                      touch-none select-none
                      ${isDragging && draggedIndex === index ? 'z-50' : ''}
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
                      px-2 py-1 border text-center font-bold 
                      ${gameMode === 'BLACK' ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-600'} 
                      ${dragOverIndex === index ? 
                        `bg-gradient-to-r ${gameMode === 'BLACK' ? 'from-blue-800 to-purple-800' : 'from-blue-200 to-purple-200'} 
                         shadow-lg border-2 ${gameMode === 'BLACK' ? 'border-blue-400' : 'border-blue-500'} 
                         ring-2 ring-blue-300 ring-opacity-50 transition-all duration-200 transform scale-[1.02]` 
                        : 'transition-all duration-300'
                      }
                    `}>
                      <span className="select-none flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 inline-block" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"/>
                        </svg>
                        --- 区切り ---
                        <svg className="w-4 h-4 inline-block" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"/>
                        </svg>
                      </span>
                    </td>
                  </tr>
                );
              }
              
              return (
                <tr 
                  key={record.id}
                  className={`
                    ${gameMode === 'BLACK' ? 'text-gray-200' : 'text-gray-800'} 
                    ${dragOverIndex === index ? 
                      `${gameMode === 'BLACK' ? 'bg-gradient-to-r from-blue-900 to-blue-800' : 'bg-gradient-to-r from-blue-100 to-cyan-100'} 
                       shadow-lg border-2 ${gameMode === 'BLACK' ? 'border-blue-400' : 'border-blue-500'} 
                       ring-2 ring-blue-300 ring-opacity-50 transition-all duration-200 transform scale-[1.02]` 
                      : 'hover:bg-opacity-50 transition-all duration-200'
                    }
                  `}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <td className={`px-2 py-1 border text-center ${gameMode === 'BLACK' ? 'border-gray-600' : 'border-gray-300'}`}>
                    {rowNumber}
                  </td>
                  <td className={`px-2 py-1 border text-right ${gameMode === 'BLACK' ? 'border-gray-600' : 'border-gray-300'}`}>
                    {record.gameCount || ''}
                  </td>
                  <td className={`px-2 py-1 border text-center ${gameMode === 'BLACK' ? 'border-gray-600' : 'border-gray-300'}`}>
                    <span className={record.bonusType === 'BB' ? 'text-red-500' : record.bonusType === 'RB' ? 'text-blue-500' : ''}>
                      {record.bonusType || ''}
                    </span>
                  </td>
                  <td className={`px-2 py-1 border text-right ${gameMode === 'BLACK' ? 'border-gray-600' : 'border-gray-300'}`}>
                    {record.favorableZoneStart}
                  </td>
                  <td className={`px-2 py-1 border text-right ${gameMode === 'BLACK' ? 'border-gray-600' : 'border-gray-300'}`}>
                    {record.favorableZoneEnd}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* 非表示のHTMLコンテンツ（コピー用） */}
      <div 
        dangerouslySetInnerHTML={{ __html: resultHtml }}
        className="hidden"
      />
    </div>
  );
}