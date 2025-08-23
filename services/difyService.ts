import type { RawRecord } from "../types";
import { BonusType } from "../types";

// 手動でテキストからパチスロデータを解析する関数（フォールバック）
function parseManually(text: string): { results: RawRecord[] } {
  console.log("🔍 Manual parsing of text:", text.substring(0, 100) + "...");
  
  const results: RawRecord[] = [];
  
  // パターン1: 数字+BBまたは数字+RBを探す
  const gamePattern = /(\d+)\s*([BR]B)/gi;
  let match;
  
  while ((match = gamePattern.exec(text)) !== null) {
    const game = parseInt(match[1]);
    const type = match[2].toUpperCase() as 'BB' | 'RB';
    
    if (game > 0) {
      results.push({
        game: game,
        type: type === 'BB' ? BonusType.BB : BonusType.RB
      });
    }
  }
  
  // パターン2: より詳細なパターンマッチング
  if (results.length === 0) {
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const lineMatch = line.match(/(\d+).*?([BR]B)/i);
      if (lineMatch) {
        const game = parseInt(lineMatch[1]);
        const type = lineMatch[2].toUpperCase() as 'BB' | 'RB';
        
        if (game > 0) {
          results.push({
            game: game,
            type: type === 'BB' ? BonusType.BB : BonusType.RB
          });
        }
      }
    }
  }
  
  console.log("✅ Manual parsing results:", results);
  return { results };
}

// File to base64 conversion
const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
};

export async function analyzeImageHistory(file: File): Promise<RawRecord[]> {
  try {
    console.log("🚀 Starting secure image analysis...");
    console.log("📎 File info:", { type: file.type, size: file.size, name: file.name });
    
    // ファイルをbase64に変換
    const fileData = await fileToBase64(file);
    
    // サーバーサイドAPIエンドポイントに送信
    const response = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileData,
        fileName: file.name,
        fileType: file.type
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      
      // 特定のエラーメッセージ
      if (response.status === 401) {
        throw new Error("🔑 認証エラー: サーバーの環境変数を確認してください");
      }
      if (response.status === 429) {
        throw new Error("⏰ レート制限: しばらく待ってから再試行してください");
      }
      if (response.status === 400) {
        throw new Error("📝 リクエストエラー: ファイル形式を確認してください");
      }
      
      throw new Error(errorData.message || `🔥 API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("📨 API Response:", data);

    if (data.results && Array.isArray(data.results)) {
      // 結果を再検証
      const validResults = data.results.filter(
        (r: any): r is RawRecord => 
        typeof r.game === 'number' && (r.type === BonusType.BB || r.type === BonusType.RB)
      );
      
      console.log("✅ Valid results:", validResults);
      return validResults;
    } else {
      console.warn("⚠️ No valid results, trying manual parsing");
      return parseManually(data.rawResponse || "No data").results;
    }
    
  } catch (error) {
    console.error("💥 Client Error:", error);
    
    if (error instanceof Error) {
      // ネットワークエラーの場合はフォールバック
      if (error.message.includes('fetch')) {
        console.warn("⚠️ Network error, using manual parsing");
        return parseManually("Network error - manual parsing").results;
      }
      
      // その他のエラーはそのまま再スロー
      throw error;
    }
    
    throw new Error(`🔥 画像処理に失敗しました: ${String(error)}`);
  }
}