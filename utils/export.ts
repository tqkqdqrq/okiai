import type { GameRecord } from '../types';

export function exportToCSV(records: GameRecord[], filename: string = 'pachislot_data.csv'): void {
  // CSVヘッダー
  const headers = [
    '番号',
    'ゲーム数',
    'ボーナス種別',
    '有利区間開始',
    '有利区間終了',
    'セグメント番号'
  ];

  // データ行を作成
  const rows = records
    .filter(record => !record.isSeparator) // 区切り行を除外
    .map((record, index) => [
      (index + 1).toString(),
      record.gameCount || '',
      record.bonusType || '',
      record.favorableZoneStart?.toString() || '',
      record.favorableZoneEnd?.toString() || '',
      record.segmentNumber?.toString() || ''
    ]);

  // CSV形式に変換
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  // BOMを追加（Excel対応）
  const bom = '\uFEFF';
  const csvWithBom = bom + csvContent;

  // ファイルダウンロード
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function exportToJSON(records: GameRecord[], filename: string = 'pachislot_data.json'): void {
  const exportData = {
    exportDate: new Date().toISOString(),
    totalRecords: records.length,
    data: records.map(record => ({
      id: record.id,
      gameCount: record.gameCount,
      bonusType: record.bonusType,
      isSeparator: record.isSeparator,
      favorableZoneStart: record.favorableZoneStart,
      favorableZoneEnd: record.favorableZoneEnd,
      segmentNumber: record.segmentNumber
    }))
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}