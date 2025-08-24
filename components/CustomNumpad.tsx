import React, { useState, useRef, useEffect } from 'react';
import { BonusType } from '../types';

interface CustomNumpadProps {
  onNumberClick: (num: string) => void;
  onBonusTypeClick: (type: BonusType) => void;
  onSeparatorClick: () => void;
  onEnterClick: () => void;
  onNavigateClick: (direction: 'up' | 'down') => void;
  onBackspaceClick: () => void;
  onAddRowClick: (position: 'top' | 'bottom') => void;
  onClose: () => void;
  onClearAll: () => void;
  gameMode: 'GOLD' | 'BLACK';
}

const CustomNumpad: React.FC<CustomNumpadProps> = ({
  onNumberClick,
  onBonusTypeClick,
  onSeparatorClick,
  onEnterClick,
  onNavigateClick,
  onBackspaceClick,
  onAddRowClick,
  onClose,
  onClearAll,
  gameMode
}) => {
  const [numpadSize, setNumpadSize] = useState(() => {
    const saved = localStorage.getItem('numpadSize');
    return saved ? JSON.parse(saved) : { width: 320, height: 400 };
  });
  const [isResizing, setIsResizing] = useState(false);
  const numpadRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const baseButtonClass = `
    font-bold rounded-lg transition-all duration-150 
    active:scale-95 select-none cursor-pointer
    shadow-sm hover:shadow-md
  `;

  const numberButtonClass = `
    ${baseButtonClass}
    ${gameMode === 'BLACK' 
      ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
      : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300'}
    text-lg sm:text-xl py-2 sm:py-3
  `;

  const specialButtonClass = `
    ${baseButtonClass}
    py-2 px-1 sm:px-2 text-xs sm:text-sm font-semibold
  `;

  const bonusButtonStyles = {
    [BonusType.BB]: gameMode === 'BLACK' 
      ? 'bg-red-700 hover:bg-red-600 text-white' 
      : 'bg-red-500 hover:bg-red-600 text-white',
    [BonusType.RB]: gameMode === 'BLACK'
      ? 'bg-blue-700 hover:bg-blue-600 text-white'
      : 'bg-blue-500 hover:bg-blue-600 text-white',
    [BonusType.CURRENT]: gameMode === 'BLACK'
      ? 'bg-orange-700 hover:bg-orange-600 text-white'
      : 'bg-orange-500 hover:bg-orange-600 text-white',
  };

  const separatorButtonClass = `
    ${specialButtonClass}
    ${gameMode === 'BLACK'
      ? 'bg-green-700 hover:bg-green-600 text-white'
      : 'bg-green-500 hover:bg-green-600 text-white'}
  `;

  const actionButtonClass = `
    ${specialButtonClass}
    ${gameMode === 'BLACK'
      ? 'bg-gray-600 hover:bg-gray-500 text-white'
      : 'bg-gray-500 hover:bg-gray-600 text-white'}
  `;

  const navigationButtonClass = `
    ${baseButtonClass}
    ${gameMode === 'BLACK'
      ? 'bg-indigo-700 hover:bg-indigo-600 text-white'
      : 'bg-indigo-500 hover:bg-indigo-600 text-white'}
    py-2 sm:py-3 text-lg sm:text-xl
  `;

  const enterButtonClass = `
    ${baseButtonClass}
    ${gameMode === 'BLACK'
      ? 'bg-blue-700 hover:bg-blue-600 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white'}
    py-2 sm:py-3 text-base sm:text-lg font-bold
  `;

  const addRowButtonClass = `
    ${baseButtonClass}
    ${gameMode === 'BLACK'
      ? 'bg-purple-700 hover:bg-purple-600 text-white'
      : 'bg-purple-500 hover:bg-purple-600 text-white'}
    py-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1
  `;

  const handleTouchEnd = (e: React.TouchEvent, callback: () => void) => {
    e.preventDefault();
    callback();
  };

  // リサイズ機能
  useEffect(() => {
    localStorage.setItem('numpadSize', JSON.stringify(numpadSize));
  }, [numpadSize]);

  const startResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    startPosRef.current = {
      x: clientX,
      y: clientY,
      width: numpadSize.width,
      height: numpadSize.height
    };
  };

  useEffect(() => {
    const handleResize = (e: MouseEvent | TouchEvent) => {
      if (!isResizing) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const deltaX = clientX - startPosRef.current.x;
      const deltaY = clientY - startPosRef.current.y;
      
      const newWidth = Math.max(280, Math.min(500, startPosRef.current.width + deltaX));
      const newHeight = Math.max(350, Math.min(600, startPosRef.current.height + deltaY));
      
      setNumpadSize({ width: newWidth, height: newHeight });
    };

    const stopResize = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
      document.addEventListener('touchmove', handleResize);
      document.addEventListener('touchend', stopResize);
    }

    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
      document.removeEventListener('touchmove', handleResize);
      document.removeEventListener('touchend', stopResize);
    };
  }, [isResizing]);

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50">
        <div 
          ref={numpadRef}
          className={`
            ${gameMode === 'BLACK' ? 'bg-gray-900' : 'bg-gray-50'} 
            border ${gameMode === 'BLACK' ? 'border-gray-700' : 'border-gray-300'}
            shadow-lg p-2 sm:p-3 pb-safe rounded-t-lg relative
            ${isResizing ? 'select-none' : ''}
          `}
          style={{
            width: `${numpadSize.width}px`,
            height: `${numpadSize.height}px`,
            transition: isResizing ? 'none' : 'all 0.3s ease'
          }}
        >
        {/* 全クリアボタン */}
        <button
          onClick={onClearAll}
          className={`
            absolute top-2 right-12 p-2 rounded-full
            ${gameMode === 'BLACK' ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}
          `}
          title="全クリア"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        
        {/* クローズボタン */}
        <button
          onClick={onClose}
          className={`
            absolute top-2 right-2 p-2 rounded-full
            ${gameMode === 'BLACK' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}
          `}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* リサイズハンドル */}
        <div
          ref={resizeRef}
          className={`
            absolute bottom-1 right-1 w-6 h-6 cursor-se-resize
            ${gameMode === 'BLACK' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}
            flex items-center justify-center rounded-full
            ${isResizing ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}
          `}
          onMouseDown={startResize}
          onTouchStart={startResize}
          title="ドラッグでサイズ調整"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22,22H20V20H22V22M22,18H20V16H22V18M18,22H16V20H18V22M18,18H16V16H18V18M14,22H12V20H14V22M22,14H20V12H22V14Z" />
          </svg>
        </div>

        <div className="grid gap-1 sm:gap-2 h-full overflow-auto" style={{ paddingTop: '40px', paddingBottom: '30px' }}>
          {/* 行追加ボタン */}
          <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-1 sm:mb-2">
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onAddRowClick('top'))}
              onClick={() => onAddRowClick('top')}
              className={addRowButtonClass}
            >
              <span>上に行追加</span>
            </button>
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onAddRowClick('bottom'))}
              onClick={() => onAddRowClick('bottom')}
              className={addRowButtonClass}
            >
              <span>下に行追加</span>
            </button>
          </div>

          {/* 特殊ボタン行 */}
          <div className="grid grid-cols-4 gap-1 sm:gap-2">
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onBonusTypeClick(BonusType.BB))}
              onClick={() => onBonusTypeClick(BonusType.BB)}
              className={`${specialButtonClass} ${bonusButtonStyles[BonusType.BB]}`}
            >
              BB
            </button>
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onBonusTypeClick(BonusType.RB))}
              onClick={() => onBonusTypeClick(BonusType.RB)}
              className={`${specialButtonClass} ${bonusButtonStyles[BonusType.RB]}`}
            >
              RB
            </button>
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onBonusTypeClick(BonusType.CURRENT))}
              onClick={() => onBonusTypeClick(BonusType.CURRENT)}
              className={`${specialButtonClass} ${bonusButtonStyles[BonusType.CURRENT]}`}
            >
              現在
            </button>
            <button
              onTouchEnd={(e) => handleTouchEnd(e, onSeparatorClick)}
              onClick={onSeparatorClick}
              className={separatorButtonClass}
            >
              区切り
            </button>
          </div>

          {/* 数字キーと操作ボタン */}
          <div className="grid grid-cols-4 gap-1 sm:gap-2">
            {/* 1-3 */}
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('1'))}
              onClick={() => onNumberClick('1')}
              className={numberButtonClass}
            >
              1
            </button>
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('2'))}
              onClick={() => onNumberClick('2')}
              className={numberButtonClass}
            >
              2
            </button>
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('3'))}
              onClick={() => onNumberClick('3')}
              className={numberButtonClass}
            >
              3
            </button>
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onNavigateClick('up'))}
              onClick={() => onNavigateClick('up')}
              className={navigationButtonClass}
            >
              ↑
            </button>

            {/* 4-6 */}
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('4'))}
              onClick={() => onNumberClick('4')}
              className={numberButtonClass}
            >
              4
            </button>
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('5'))}
              onClick={() => onNumberClick('5')}
              className={numberButtonClass}
            >
              5
            </button>
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('6'))}
              onClick={() => onNumberClick('6')}
              className={numberButtonClass}
            >
              6
            </button>
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onNavigateClick('down'))}
              onClick={() => onNavigateClick('down')}
              className={navigationButtonClass}
            >
              ↓
            </button>

            {/* 7-9 */}
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('7'))}
              onClick={() => onNumberClick('7')}
              className={numberButtonClass}
            >
              7
            </button>
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('8'))}
              onClick={() => onNumberClick('8')}
              className={numberButtonClass}
            >
              8
            </button>
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('9'))}
              onClick={() => onNumberClick('9')}
              className={numberButtonClass}
            >
              9
            </button>
            <button
              onTouchEnd={(e) => handleTouchEnd(e, onBackspaceClick)}
              onClick={onBackspaceClick}
              className={actionButtonClass}
              style={{ padding: '0' }}
            >
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            </button>

            {/* 0とエンター */}
            <button
              onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('0'))}
              onClick={() => onNumberClick('0')}
              className={`${numberButtonClass} col-span-2`}
            >
              0
            </button>
            <button
              onTouchEnd={(e) => handleTouchEnd(e, onEnterClick)}
              onClick={onEnterClick}
              className={`${enterButtonClass} col-span-2`}
            >
              確定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomNumpad;