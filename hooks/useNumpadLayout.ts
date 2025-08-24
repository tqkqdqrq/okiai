import { useState, useEffect } from 'react';
import { NumpadLayout, NumpadButton, DEFAULT_LAYOUT } from '../types/numpadTypes';

const STORAGE_KEY = 'numpadCustomLayout';

export const useNumpadLayout = () => {
  const [layout, setLayout] = useState<NumpadLayout>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved layout:', e);
        return DEFAULT_LAYOUT;
      }
    }
    return DEFAULT_LAYOUT;
  });

  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [draggedButton, setDraggedButton] = useState<{
    button: NumpadButton;
    fromRow: number;
    fromCol: number;
  } | null>(null);
  
  // タッチドラッグ用の状態
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{ row: number; col: number } | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  const swapButtons = (
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
  ) => {
    if (fromRow === toRow && fromCol === toCol) return;

    const newLayout = { ...layout };
    const newRows = newLayout.rows.map(row => [...row]);

    const fromButton = newRows[fromRow][fromCol];
    const toButton = newRows[toRow][toCol];

    newRows[fromRow][fromCol] = toButton;
    newRows[toRow][toCol] = fromButton;

    setLayout({ rows: newRows });
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    localStorage.removeItem(STORAGE_KEY);
  };

  const startDrag = (button: NumpadButton, row: number, col: number) => {
    setDraggedButton({ button, fromRow: row, fromCol: col });
  };

  const endDrag = (toRow: number, toCol: number) => {
    if (draggedButton) {
      swapButtons(
        draggedButton.fromRow,
        draggedButton.fromCol,
        toRow,
        toCol
      );
      setDraggedButton(null);
    }
  };

  const cancelDrag = () => {
    setDraggedButton(null);
  };

  const toggleCustomizeMode = () => {
    setIsCustomizeMode(prev => !prev);
    if (draggedButton) {
      setDraggedButton(null);
    }
    setIsDragging(false);
    setDragPosition(null);
    setHoveredPosition(null);
  };

  // タッチドラッグ開始
  const startTouchDrag = (button: NumpadButton, row: number, col: number) => {
    setDraggedButton({ button, fromRow: row, fromCol: col });
    setIsDragging(true);
  };

  // ドラッグ位置更新
  const updateDragPosition = (x: number, y: number) => {
    setDragPosition({ x, y });
  };

  // ホバー位置更新
  const updateHoveredPosition = (row: number | null, col: number | null) => {
    if (row !== null && col !== null) {
      setHoveredPosition({ row, col });
    } else {
      setHoveredPosition(null);
    }
  };

  // タッチドラッグ終了
  const endTouchDrag = () => {
    if (draggedButton && hoveredPosition) {
      swapButtons(
        draggedButton.fromRow,
        draggedButton.fromCol,
        hoveredPosition.row,
        hoveredPosition.col
      );
    }
    setDraggedButton(null);
    setIsDragging(false);
    setDragPosition(null);
    setHoveredPosition(null);
  };

  return {
    layout,
    isCustomizeMode,
    draggedButton,
    isDragging,
    dragPosition,
    hoveredPosition,
    swapButtons,
    resetLayout,
    startDrag,
    endDrag,
    cancelDrag,
    toggleCustomizeMode,
    startTouchDrag,
    updateDragPosition,
    updateHoveredPosition,
    endTouchDrag
  };
};