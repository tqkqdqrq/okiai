import React, { useState, useRef, useEffect } from 'react';
import { BonusType } from '../types';
import { useNumpadLayout } from '../hooks/useNumpadLayout';
import { ButtonType, NumpadButton } from '../types/numpadTypes';

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
  
  // タッチドラッグ用のref
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number; row: number; col: number } | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const {
    layout,
    isCustomizeMode,
    draggedButton,
    isDragging,
    dragPosition,
    hoveredPosition,
    resetLayout,
    startDrag,
    endDrag,
    cancelDrag,
    toggleCustomizeMode,
    startTouchDrag,
    updateDragPosition,
    updateHoveredPosition,
    endTouchDrag
  } = useNumpadLayout();

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
    bb: gameMode === 'BLACK' 
      ? 'bg-red-700 hover:bg-red-600 text-white' 
      : 'bg-red-500 hover:bg-red-600 text-white',
    rb: gameMode === 'BLACK'
      ? 'bg-blue-700 hover:bg-blue-600 text-white'
      : 'bg-blue-500 hover:bg-blue-600 text-white',
    current: gameMode === 'BLACK'
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


  const getResponsiveStyles = () => {
    const buttonHeight = `${numpadSize.height / 4}px`;
    const buttonWidth = `${numpadSize.width / 5}px`;
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

  const handleButtonClick = (button: NumpadButton) => {
    if (isCustomizeMode) return;

    switch (button.type) {
      case 'number':
        if (button.value) onNumberClick(button.value);
        break;
      case 'bb':
        onBonusTypeClick(BonusType.BB);
        break;
      case 'rb':
        onBonusTypeClick(BonusType.RB);
        break;
      case 'current':
        onBonusTypeClick(BonusType.CURRENT);
        break;
      case 'separator':
        onSeparatorClick();
        break;
      case 'backspace':
        onBackspaceClick();
        break;
      case 'up':
        onNavigateClick('up');
        break;
      case 'down':
        onNavigateClick('down');
        break;
      case 'addTop':
        onAddRowClick('top');
        break;
      case 'addBottom':
        onAddRowClick('bottom');
        break;
      case 'enter':
        onEnterClick();
        break;
    }
  };

  const getButtonClass = (button: NumpadButton) => {
    switch (button.type) {
      case 'number':
        return numberButtonClass;
      case 'bb':
        return `${specialButtonClass} ${bonusButtonStyles.bb}`;
      case 'rb':
        return `${specialButtonClass} ${bonusButtonStyles.rb}`;
      case 'current':
        return `${specialButtonClass} ${bonusButtonStyles.current}`;
      case 'separator':
        return separatorButtonClass;
      case 'backspace':
        return actionButtonClass;
      case 'up':
      case 'down':
        return navigationButtonClass;
      case 'addTop':
      case 'addBottom':
        return addRowButtonClass;
      case 'enter':
        return enterButtonClass;
      default:
        return baseButtonClass;
    }
  };

  const renderButton = (button: NumpadButton) => {
    if (button.type === 'backspace' && button.icon) {
      return (
        <svg 
          style={{ width: styles.iconSize, height: styles.iconSize }} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
        </svg>
      );
    }
    return button.label;
  };

  const handleDragStart = (e: React.DragEvent, button: NumpadButton, row: number, col: number) => {
    if (!isCustomizeMode) return;
    e.dataTransfer.effectAllowed = 'move';
    startDrag(button, row, col);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isCustomizeMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    if (!isCustomizeMode) return;
    e.preventDefault();
    endDrag(row, col);
  };

  const handleDragEnd = () => {
    if (!isCustomizeMode) return;
    cancelDrag();
  };

  // タッチイベントハンドラー
  const handleTouchStart = (e: React.TouchEvent, button: NumpadButton, row: number, col: number) => {
    if (!isCustomizeMode) return;
    
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY, row, col };
    
    // 長押しタイマー開始（500ms）
    longPressTimerRef.current = setTimeout(() => {
      // バイブレーションフィードバック
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      startTouchDrag(button, row, col);
      updateDragPosition(touch.clientX, touch.clientY);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isCustomizeMode) return;
    
    const touch = e.touches[0];
    
    // 長押し判定前に移動した場合はキャンセル
    if (longPressTimerRef.current && touchStartPosRef.current) {
      const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
    
    // ドラッグ中の処理
    if (isDragging) {
      e.preventDefault();
      updateDragPosition(touch.clientX, touch.clientY);
      
      // タッチ位置からホバー対象を判定
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element && element.hasAttribute('data-grid-pos')) {
        const pos = element.getAttribute('data-grid-pos')?.split('-');
        if (pos && pos.length === 2) {
          updateHoveredPosition(parseInt(pos[0]), parseInt(pos[1]));
        }
      } else {
        updateHoveredPosition(null, null);
      }
    }
  };

  const handleTouchEndOrCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (isDragging) {
      endTouchDrag();
    }
    
    touchStartPosRef.current = null;
  };

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50">
      <div 
        ref={numpadRef}
        className={`
          ${gameMode === 'BLACK' ? 'bg-gray-900' : 'bg-gray-50'} 
          border ${gameMode === 'BLACK' ? 'border-gray-700' : 'border-gray-300'}
          shadow-lg rounded-t-lg relative overflow-hidden
          ${isResizing ? 'select-none' : ''}
          ${isCustomizeMode ? 'ring-2 ring-purple-500' : ''}
        `}
        style={{
          width: `${numpadSize.width}px`,
          height: `${numpadSize.height + (isCustomizeMode ? 40 : 0)}px`,
          transition: isResizing ? 'none' : 'all 0.3s ease'
        }}
      >
        {/* カスタマイズモードツールバー */}
        {isCustomizeMode && (
          <div className={`
            flex items-center justify-between px-2 h-10
            ${gameMode === 'BLACK' ? 'bg-purple-900' : 'bg-purple-100'}
            border-b ${gameMode === 'BLACK' ? 'border-purple-700' : 'border-purple-300'}
          `}>
            <span className={`text-sm font-semibold ${gameMode === 'BLACK' ? 'text-purple-200' : 'text-purple-800'}`}>
              カスタマイズモード
            </span>
            <button
              onClick={resetLayout}
              className={`
                px-2 py-1 text-xs rounded
                ${gameMode === 'BLACK' 
                  ? 'bg-red-700 hover:bg-red-600 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'}
              `}
            >
              リセット
            </button>
          </div>
        )}

        {/* リサイズハンドル */}
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

        {/* カスタマイズモード切り替えボタン */}
        <button
          onClick={toggleCustomizeMode}
          className={`
            absolute top-0 left-0 w-8 h-8 z-10
            ${gameMode === 'BLACK' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}
            flex items-center justify-center
            ${isCustomizeMode ? 'bg-purple-500 text-white' : 'bg-black bg-opacity-20 hover:bg-opacity-40'}
            rounded-br-lg
          `}
          title={isCustomizeMode ? 'カスタマイズモード終了' : 'ボタン配置をカスタマイズ'}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
          </svg>
        </button>

        <div 
          className="grid grid-cols-5 grid-rows-4 w-full h-full" 
          style={{ 
            gap: styles.buttonGap,
            paddingTop: isCustomizeMode ? '0' : '0'
          }}
        >
          {layout.rows.map((row, rowIndex) => 
            row.map((button, colIndex) => (
              <button
                key={button.id}
                ref={(el) => { buttonRefs.current[`${rowIndex}-${colIndex}`] = el; }}
                data-grid-pos={`${rowIndex}-${colIndex}`}
                draggable={isCustomizeMode && !isDragging}
                onDragStart={(e) => handleDragStart(e, button, rowIndex, colIndex)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleTouchStart(e, button, rowIndex, colIndex)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEndOrCancel}
                onTouchCancel={handleTouchEndOrCancel}
                onTouchEndCapture={(e) => {
                  if (!isCustomizeMode && !isDragging) {
                    e.preventDefault();
                    handleButtonClick(button);
                  }
                }}
                onClick={() => {
                  if (!isCustomizeMode) {
                    handleButtonClick(button);
                  }
                }}
                className={`
                  ${getButtonClass(button)}
                  ${isCustomizeMode ? 'cursor-move' : ''}
                  ${draggedButton?.button.id === button.id ? (isDragging ? 'opacity-30 scale-110' : 'opacity-50') : ''}
                  ${hoveredPosition?.row === rowIndex && hoveredPosition?.col === colIndex ? 'ring-2 ring-blue-400 scale-105' : ''}
                  ${isDragging && draggedButton?.button.id === button.id ? 'z-50' : ''}
                `}
                style={{ 
                  height: styles.buttonHeight,
                  width: styles.buttonWidth,
                  fontSize: styles.fontSize,
                  touchAction: isCustomizeMode ? 'none' : 'auto',
                  transition: isDragging ? 'transform 0.2s, opacity 0.2s' : 'all 0.15s'
                }}
              >
                {renderButton(button)}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomNumpad;