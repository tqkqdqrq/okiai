export type ButtonType = 
  | 'number' 
  | 'bb' 
  | 'rb' 
  | 'current' 
  | 'separator' 
  | 'backspace' 
  | 'up' 
  | 'down' 
  | 'addTop' 
  | 'addBottom' 
  | 'enter';

export interface NumpadButton {
  id: string;
  type: ButtonType;
  label: string;
  value?: string;
  className?: string;
  icon?: boolean;
}

export interface NumpadLayout {
  rows: NumpadButton[][];
}

export const DEFAULT_LAYOUT: NumpadLayout = {
  rows: [
    [
      { id: 'bb', type: 'bb', label: 'BB' },
      { id: '1', type: 'number', label: '1', value: '1' },
      { id: '2', type: 'number', label: '2', value: '2' },
      { id: '3', type: 'number', label: '3', value: '3' },
      { id: 'backspace', type: 'backspace', label: '', icon: true }
    ],
    [
      { id: 'rb', type: 'rb', label: 'RB' },
      { id: '4', type: 'number', label: '4', value: '4' },
      { id: '5', type: 'number', label: '5', value: '5' },
      { id: '6', type: 'number', label: '6', value: '6' },
      { id: 'up', type: 'up', label: '↑' }
    ],
    [
      { id: 'current', type: 'current', label: '現在' },
      { id: '7', type: 'number', label: '7', value: '7' },
      { id: '8', type: 'number', label: '8', value: '8' },
      { id: '9', type: 'number', label: '9', value: '9' },
      { id: 'down', type: 'down', label: '↓' }
    ],
    [
      { id: 'separator', type: 'separator', label: '区切り' },
      { id: 'addTop', type: 'addTop', label: '上追加' },
      { id: 'addBottom', type: 'addBottom', label: '下追加' },
      { id: '0', type: 'number', label: '0', value: '0' },
      { id: 'enter', type: 'enter', label: '確定' }
    ]
  ]
};