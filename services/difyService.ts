import type { RawRecord } from "../types";
import { BonusType } from "../types";

// 環境変数の設定 - 簡素化
const getConfig = () => {
  const config = {
    apiKey: import.meta.env.VITE_DIFY_API_KEY || import.meta.env.DIFY_API_KEY,
    baseUrl: import.meta.env.VITE_DIFY_BASE_URL || import.meta.env.DIFY_BASE_URL || "https://suroschooldifyai.xyz/v1"
  };
  
  console.log("🔧 Config loaded:", {
    hasApiKey: !!config.apiKey,
    apiKeyPrefix: config.apiKey ? config.apiKey.substring(0, 8) + "..." : "undefined",
    baseUrl: config.baseUrl,
    allEnvKeys: Object.keys(import.meta.env).filter(key => key.includes('DIFY'))
  });
  
  return config;
};

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

// APIクライアント
class DifyAPIClient {
  private config: { apiKey: string; baseUrl: string };
  
  constructor() {
    this.config = getConfig();
  }
  
  async uploadFile(file: File): Promise<{ id: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user", "pachislot-calculator");

    const response = await fetch(`${this.config.baseUrl}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`File upload failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
  
  async sendChatMessage(fileId: string, prompt: string): Promise<any> {
    const payload = {
      inputs: {},
      query: prompt,
      response_mode: 'blocking',
      conversation_id: '',
      user: 'pachislot-calculator',
      files: [{
        type: 'image',
        transfer_method: 'local_file',
        upload_file_id: fileId
      }]
    };

    const response = await fetch(`${this.config.baseUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chat API failed: ${response.status} - ${errorText}`);
    }
    
    return response.json();
  }
}

export async function analyzeImageHistory(file: File): Promise<RawRecord[]> {
  const prompt = `
    画像からパチスロの履歴データを解析してください。
    各行のゲーム数とボーナス種別（BBまたはRB）を抽出してください。
    ヘッダーやサマリーは無視して、ゲーム結果の行のみを対象にしてください。
    
    必ず以下の形式のJSONのみで回答してください：
    {
      "results": [
        {"game": ゲーム数, "type": "BB"},
        {"game": ゲーム数, "type": "RB"}
      ]
    }
    
    例：
    {
      "results": [
        {"game": 123, "type": "BB"},
        {"game": 456, "type": "RB"}
      ]
    }
    
    説明や追加テキストは不要です。JSONのみ返してください。
  `;

  const config = getConfig();
  
  // APIキーが設定されていない場合はフォールバックを使用
  if (!config.apiKey) {
    console.warn("⚠️ API key not found, using fallback parsing");
    return parseManually("No API available - manual parsing required").results;
  }

  try {
    console.log("🚀 Starting Dify API call...");
    console.log("📎 File:", { type: file.type, size: file.size, name: file.name });
    
    const client = new DifyAPIClient();
    
    // Step 1: Upload file
    console.log("📤 Uploading file...");
    const uploadData = await client.uploadFile(file);
    console.log("✅ File uploaded:", uploadData);

    // Step 2: Send chat message
    console.log("💬 Sending chat message...");
    const data = await client.sendChatMessage(uploadData.id, prompt);
    console.log("📨 API response:", data);

    // Parse response
    const responseText = data.answer || data.data || data.message || '';
    console.log("📝 Response text:", responseText);
    
    // JSONを抽出する
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      console.log("🔍 Extracting JSON from text response");
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.log("⚠️ JSON parsing failed, using manual parsing");
          parsed = parseManually(responseText);
        }
      } else {
        console.log("⚠️ No JSON found, using manual parsing");
        parsed = parseManually(responseText);
      }
    }
    
    // Validate and filter results
    if (parsed && Array.isArray(parsed.results)) {
        const validResults = parsed.results.filter(
            (r: any): r is RawRecord => 
            typeof r.game === 'number' && (r.type === BonusType.BB || r.type === BonusType.RB)
        );
        console.log("✅ Valid results:", validResults);
        return validResults;
    } else {
        console.error("❌ Invalid response format:", parsed);
        throw new Error("AI response did not match the expected format.");
    }
    
  } catch (error) {
    console.error("💥 API Error:", error);
    
    // エラーの詳細ログ
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // 特定のエラーに対する対応
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        throw new Error("🔑 認証エラー: APIキーを確認してください。Vercelの環境変数でVITE_DIFY_API_KEYを設定してください。");
      }
      if (error.message.includes('429')) {
        throw new Error("⏰ レート制限: しばらく待ってから再試行してください。");
      }
      if (error.message.includes('400') || error.message.includes('Bad Request')) {
        throw new Error("📝 リクエストエラー: ファイル形式または内容を確認してください。");
      }
    }
    
    throw new Error(`🔥 画像処理に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}