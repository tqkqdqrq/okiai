
import type { RawRecord } from "../types";
import { BonusType } from "../types";

const API_KEY = import.meta.env.VITE_DIFY_API_KEY;
const BASE_URL = import.meta.env.VITE_DIFY_BASE_URL || "https://suroschooldifyai.xyz/v1";

console.log("Debug - API_KEY loaded:", API_KEY ? "✓ Key present" : "✗ Key missing");
console.log("Debug - API_KEY value:", API_KEY ? `${API_KEY.substring(0, 8)}...` : "undefined");
console.log("Debug - Base URL:", BASE_URL);
console.log("Debug - All environment variables:", Object.keys(import.meta.env));
console.log("Debug - VITE_ variables:", Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));

if (!API_KEY) {
  console.error("DIFY API_KEY environment variable not set.");
}

// 手動でテキストからパチスロデータを解析する関数
function parseManually(text: string): { results: RawRecord[] } {
  console.log("Debug - Manual parsing of text:", text);
  
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
  
  console.log("Debug - Manual parsing results:", results);
  return { results };
}

// Function to convert a File object to a base64 string
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

  try {
    console.log("Debug - Starting Dify API call...");
    console.log("Debug - File type:", file.type, "File size:", file.size);
    
    // Step 1: Upload file to Dify
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user", "pachislot-calculator");

    console.log("Debug - Uploading file...");
    const uploadResponse = await fetch(`${BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text();
      console.error("Debug - Upload error response:", uploadError);
      throw new Error(`File upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${uploadError}`);
    }

    const uploadData = await uploadResponse.json();
    console.log("Debug - File uploaded successfully:", uploadData);

    // Step 2: Send chat message with uploaded file reference
    const chatPayload = {
      inputs: {},
      query: prompt,
      response_mode: 'blocking',
      conversation_id: '',
      user: 'pachislot-calculator',
      files: [{
        type: 'image',
        transfer_method: 'local_file',
        upload_file_id: uploadData.id
      }]
    };

    console.log("Debug - Sending chat message...");
    const response = await fetch(`${BASE_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatPayload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Debug - API error response:", errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Debug - API response received:", data);

    // Difyのレスポンス形式に応じて調整
    const responseText = data.answer || data.data || data.message || '';
    console.log("Debug - Response text:", responseText);
    
    // JSONを抽出する（日本語テキストの中からJSONを探す）
    let parsed;
    try {
      // まずそのままJSONパースを試す
      parsed = JSON.parse(responseText);
    } catch (e) {
      // JSONが直接パースできない場合、テキストからJSONを抽出
      console.log("Debug - Trying to extract JSON from text response");
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log("Debug - Found JSON in text:", jsonMatch[0]);
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.log("Debug - Failed to parse extracted JSON, trying manual parsing");
          // 手動でデータを解析（フォールバック）
          parsed = parseManually(responseText);
        }
      } else {
        console.log("Debug - No JSON found, trying manual parsing");
        parsed = parseManually(responseText);
      }
    }
    
    // Ensure the response has the expected structure
    if (parsed && Array.isArray(parsed.results)) {
        // Further validation to filter out any malformed entries
        const validResults = parsed.results.filter(
            (r: any): r is RawRecord => 
            typeof r.game === 'number' && (r.type === BonusType.BB || r.type === BonusType.RB)
        );
        return validResults;
    } else {
        throw new Error("AI response did not match the expected format.");
    }
    
  } catch (error) {
    console.error("Debug - Detailed error:", error);
    console.error("Debug - Error message:", error instanceof Error ? error.message : String(error));
    console.error("Debug - Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    if (error instanceof Error && error.message.includes('429')) {
         throw new Error("API rate limit exceeded. Please wait and try again.");
    }
    if (error instanceof Error && error.message.includes('API_KEY')) {
         throw new Error("Invalid API key. Please check your VITE_DIFY_API_KEY in .env.local");
    }
    throw new Error(`Failed to process image with AI: ${error instanceof Error ? error.message : String(error)}`);
  }
}
