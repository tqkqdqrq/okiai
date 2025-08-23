// Vercel Serverless Function for secure API proxy
export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 環境変数からAPIキーを取得（サーバーサイドで安全）
    const API_KEY = process.env.DIFY_API_KEY;
    const BASE_URL = process.env.DIFY_BASE_URL || "https://suroschooldifyai.xyz/v1";

    if (!API_KEY) {
      console.error('DIFY_API_KEY not set');
      return res.status(500).json({ 
        error: 'API configuration error',
        message: 'APIキーが設定されていません'
      });
    }

    const { fileData, fileName, fileType } = req.body;

    if (!fileData) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'ファイルデータが必要です'
      });
    }

    console.log('🚀 Processing image analysis request');
    console.log('📎 File info:', { fileName, fileType });

    // Base64データをBufferに変換
    const buffer = Buffer.from(fileData, 'base64');
    
    // FormDataを作成
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', buffer, {
      filename: fileName || 'image.png',
      contentType: fileType || 'image/png'
    });
    form.append('user', 'pachislot-calculator');

    // Step 1: ファイルをアップロード
    console.log('📤 Uploading file to Dify...');
    const uploadResponse = await fetch(`${BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        ...form.getHeaders()
      },
      body: form
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload error:', errorText);
      return res.status(uploadResponse.status).json({
        error: 'Upload failed',
        message: `ファイルのアップロードに失敗しました: ${uploadResponse.status}`
      });
    }

    const uploadData = await uploadResponse.json();
    console.log('✅ File uploaded:', uploadData);

    // Step 2: チャットメッセージを送信
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

    console.log('💬 Sending chat message...');
    const chatResponse = await fetch(`${BASE_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatPayload)
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('Chat error:', errorText);
      return res.status(chatResponse.status).json({
        error: 'Chat failed',
        message: `AI処理に失敗しました: ${chatResponse.status}`
      });
    }

    const chatData = await chatResponse.json();
    console.log('📨 Chat response received:', chatData);

    // レスポンスを解析
    const responseText = chatData.answer || chatData.data || chatData.message || '';
    
    // JSONを抽出
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.log('JSON parsing failed, using fallback');
          return res.status(200).json({
            results: [],
            message: 'AIの応答を解析できませんでした',
            rawResponse: responseText
          });
        }
      } else {
        return res.status(200).json({
          results: [],
          message: 'JSONが見つかりませんでした',
          rawResponse: responseText
        });
      }
    }

    // 結果を検証してフィルタリング
    if (parsed && Array.isArray(parsed.results)) {
      const validResults = parsed.results.filter(
        (r) => typeof r.game === 'number' && (r.type === 'BB' || r.type === 'RB')
      );
      
      console.log('✅ Analysis completed:', validResults);
      return res.status(200).json({
        results: validResults,
        message: '画像解析が完了しました'
      });
    } else {
      console.error('Invalid response format:', parsed);
      return res.status(200).json({
        results: [],
        message: 'AIの応答形式が正しくありません',
        rawResponse: parsed
      });
    }

  } catch (error) {
    console.error('💥 Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: `処理中にエラーが発生しました: ${error.message}`
    });
  }
}