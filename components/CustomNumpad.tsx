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
  gameMode
}) => {
  const [numpadSize, setNumpadSize] = useState(() => {
    const saved = localStorage.getItem('numpadSize');
    return saved ? JSON.parse(saved) : { width: 300, height: 380 };
  });
  const [isResizing, setIsResizing] = useState(false);
  const numpadRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const baseButtonClass = `
    font-bold rounded-lg transition-all duration-150 
    active:scale-95 select-none cursor-pointer
    shadow-sm hover:shadow-md
    flex items-center justify-center
  `;

  const numberButtonClass = `
    ${baseButtonClass}
    ${gameMode === 'BLACK' 
      ? 'bg-gray-700 hover:bg-gray-600 text-white border-2 border-transparent hover:border-gray-400' 
      : 'bg-white hover:bg-gray-100 text-gray-800 border-2 border-transparent hover:border-gray-500'}
  `;

  const specialButtonClass = `
    ${baseButtonClass}
    font-semibold border-2 border-transparent
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
      ? 'bg-green-700 hover:bg-green-600 text-white hover:border-green-400'
      : 'bg-green-500 hover:bg-green-600 text-white hover:border-green-300'}
  `;

  const actionButtonClass = `
    ${specialButtonClass}
    ${gameMode === 'BLACK'
      ? 'bg-gray-600 hover:bg-gray-500 text-white hover:border-gray-400'
      : 'bg-gray-500 hover:bg-gray-600 text-white hover:border-gray-500'}
  `;

  const navigationButtonClass = `
    ${baseButtonClass}
    ${gameMode === 'BLACK'
      ? 'bg-indigo-700 hover:bg-indigo-600 text-white border-2 border-transparent hover:border-indigo-400'
      : 'bg-indigo-500 hover:bg-indigo-600 text-white border-2 border-transparent hover:border-indigo-300'}
  `;

  const enterButtonClass = `
    ${baseButtonClass}
    ${gameMode === 'BLACK'
      ? 'bg-blue-700 hover:bg-blue-600 text-white border-2 border-transparent hover:border-blue-400'
      : 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-transparent hover:border-blue-400'}
    font-bold
  `;

  const addRowButtonClass = `
    ${baseButtonClass}
    ${gameMode === 'BLACK'
      ? 'bg-purple-700 hover:bg-purple-600 text-white border-2 border-transparent hover:border-purple-400'
      : 'bg-purple-500 hover:bg-purple-600 text-white border-2 border-transparent hover:border-purple-300'}
    font-semibold
  `;

  const handleTouchEnd = (e: React.TouchEvent, callback: () => void) => {
    e.preventDefault();
    callback();
  };

  // デッドスペースゼロの完全フィット計算 4行×5列
  const getResponsiveStyles = () => {
    // 4行×5列の完全グリッドでデッドスペースゼロ
    const buttonHeight = `${numpadSize.height / 4}px`;
    const buttonWidth = `${numpadSize.width / 5}px`;
    
    // フォントサイズは高さに比例
    const fontSize = `${Math.max(10, numpadSize.height / 24)}px`;
    const iconSize = `${Math.max(12, numpadSize.height / 20)}px`;
    
    return {
      buttonHeight,
      buttonWidth,
      fontSize,
      iconSize,
      buttonGap: '0px'
    };
  };
  
  const styles = getResponsiveStyles();

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
      
      const newWidth = Math.max(200, Math.min(500, startPosRef.current.width + deltaX));
      const newHeight = Math.max(250, Math.min(600, startPosRef.current.height + deltaY));
      
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
            shadow-lg rounded-t-lg relative overflow-hidden
            ${isResizing ? 'select-none' : ''}
          `}
          style={{
            width: `${numpadSize.width}px`,
            height: `${numpadSize.height}px`,
            transition: isResizing ? 'none' : 'all 0.3s ease'
          }}
        >
        {/* オーバーレイリサイズハンドル */}
        <div
          ref={resizeRef}
          className={`
            absolute top-0 right-0 w-8 h-8 cursor-se-resize z-10
            ${gameMode === 'BLACK' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}
            flex items-center justify-center
            ${isResizing ? 'bg-blue-500 text-white opacity-80' : 'bg-black bg-opacity-20 hover:bg-opacity-40'}
            rounded-bl-lg
          `}
          onMouseDown={startResize}
          onTouchStart={startResize}
          title="ドラッグでサイズ調整"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22,22H20V20H22V22M22,18H20V16H22V18M18,22H16V20H18V22M18,18H16V16H18V18M14,22H12V20H14V22M22,14H20V12H22V14Z" />
          </svg>
        </div>

        <div 
          className="grid grid-cols-5 grid-rows-4 w-full h-full" 
          style={{ 
            gap: styles.buttonGap
          }}
        >
          {/* 行1: [BB][1][2][3][BS] */}
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onBonusTypeClick(BonusType.BB))}
            onClick={() => onBonusTypeClick(BonusType.BB)}
            className={`${specialButtonClass} ${bonusButtonStyles[BonusType.BB]}`}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            BB
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('1'))}
            onClick={() => onNumberClick('1')}
            className={numberButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            1
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('2'))}
            onClick={() => onNumberClick('2')}
            className={numberButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            2
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('3'))}
            onClick={() => onNumberClick('3')}
            className={numberButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            3
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, onBackspaceClick)}
            onClick={onBackspaceClick}
            className={actionButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth
            }}
          >
            <svg 
              style={{ width: styles.iconSize, height: styles.iconSize }} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
            </svg>
          </button>

          {/* 行2: [RB][4][5][6][下追加] */}
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onBonusTypeClick(BonusType.RB))}
            onClick={() => onBonusTypeClick(BonusType.RB)}
            className={`${specialButtonClass} ${bonusButtonStyles[BonusType.RB]}`}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            RB
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('4'))}
            onClick={() => onNumberClick('4')}
            className={numberButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            4
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('5'))}
            onClick={() => onNumberClick('5')}
            className={numberButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            5
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('6'))}
            onClick={() => onNumberClick('6')}
            className={numberButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            6
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onAddRowClick('bottom'))}
            onClick={() => onAddRowClick('bottom')}
            className={addRowButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            <span>下追加</span>
          </button>

          {/* 行3: [現在][7][8][9][上追加] */}
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onBonusTypeClick(BonusType.CURRENT))}
            onClick={() => onBonusTypeClick(BonusType.CURRENT)}
            className={`${specialButtonClass} ${bonusButtonStyles[BonusType.CURRENT]}`}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            現在
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('7'))}
            onClick={() => onNumberClick('7')}
            className={numberButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            7
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('8'))}
            onClick={() => onNumberClick('8')}
            className={numberButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            8
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('9'))}
            onClick={() => onNumberClick('9')}
            className={numberButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            9
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onAddRowClick('top'))}
            onClick={() => onAddRowClick('top')}
            className={addRowButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            <span>上追加</span>
          </button>

          {/* 行4: [区切り][↑][0][↓][確定] */}
          <button
            onTouchEnd={(e) => handleTouchEnd(e, onSeparatorClick)}
            onClick={onSeparatorClick}
            className={separatorButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            区切り
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onNavigateClick('up'))}
            onClick={() => onNavigateClick('up')}
            className={navigationButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            ↑
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onNumberClick('0'))}
            onClick={() => onNumberClick('0')}
            className={numberButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            0
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, () => onNavigateClick('down'))}
            onClick={() => onNavigateClick('down')}
            className={navigationButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            ↓
          </button>
          <button
            onTouchEnd={(e) => handleTouchEnd(e, onEnterClick)}
            onClick={onEnterClick}
            className={enterButtonClass}
            style={{ 
              height: styles.buttonHeight,
              width: styles.buttonWidth,
              fontSize: styles.fontSize
            }}
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomNumpad;