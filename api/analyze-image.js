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
    console.log('📦 Buffer size:', buffer.length, 'bytes');
    console.log('🔑 API Key configured:', API_KEY ? 'Yes (hidden)' : 'No');

    // Step 1: ファイルをアップロード（Node.js標準FormData APIを使用）
    console.log('📤 Uploading file to Dify...');
    console.log('🔗 Target URL:', `${BASE_URL}/files/upload`);

    // Node.js標準のFormData APIを使用
    const form = new FormData();

    // BlobからFileオブジェクトを作成
    const blob = new Blob([buffer], { type: fileType || 'image/png' });
    const file = new File([blob], fileName || 'image.png', { type: fileType || 'image/png' });

    // ファイルを追加
    form.append('file', file);

    // userフィールドを追加（Dify API必須）
    form.append('user', 'pachislot-calculator');

    // fetchは自動的にContent-Typeヘッダーを設定
    const uploadResponse = await fetch(`${BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        // Content-Typeは自動設定されるため、明示的に設定しない
      },
      body: form
    });

    if (!uploadResponse.ok) {
      let errorText;
      let errorJson;

      try {
        errorJson = await uploadResponse.json();
        errorText = JSON.stringify(errorJson, null, 2);
      } catch (e) {
        errorText = await uploadResponse.text();
      }

      console.error('❌ Upload failed');
      console.error('Status:', uploadResponse.status);
      console.error('Response:', errorText);

      return res.status(uploadResponse.status).json({
        error: 'Upload failed',
        message: `ファイルのアップロードに失敗しました: ${uploadResponse.status}`,
        details: errorJson || errorText
      });
    }

    const uploadData = await uploadResponse.json();
    console.log('✅ File uploaded successfully');
    console.log('📄 Upload ID:', uploadData.id);

    // Step 2: チャットメッセージを送信
    const prompt = `
      画像からパチスロの履歴データを解析してください。
      各行のゲーム数とボーナス種別（BBまたはRB）を抽出してください。
      ヘッダーやサマリーは無視して、ゲーム結果の行のみを対象にしてください。

      必ず以下のカンマ区切り形式（CSV形式）で、1行ごとに回答してください：
      ゲーム数,ボーナス種別

      例：
      8,RB
      1,BB
      3,BB
      48,RB

      注意事項：
      - 各行は「数字,BB」または「数字,RB」の形式で出力
      - 説明や追加テキストは不要
      - ヘッダー行は不要
      - データのみを出力してください
    `;

    const chatPayload = {
      inputs: {},
      query: prompt,
      response_mode: 'blocking',
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
      let errorText;
      let errorJson;

      try {
        errorJson = await chatResponse.json();
        errorText = JSON.stringify(errorJson, null, 2);
      } catch (e) {
        errorText = await chatResponse.text();
      }

      console.error('❌ Chat failed');
      console.error('Status:', chatResponse.status);
      console.error('Response:', errorText);

      return res.status(chatResponse.status).json({
        error: 'Chat failed',
        message: `AI処理に失敗しました: ${chatResponse.status}`,
        details: errorJson || errorText
      });
    }

    const chatData = await chatResponse.json();
    console.log('📨 Chat response received');
    console.log('🔍 Full chatData:', JSON.stringify(chatData, null, 2));

    // レスポンスを解析
    const responseText = chatData.answer || chatData.data || chatData.message || '';
    console.log('📝 Response text:', responseText);

    // カンマ区切り形式のデータを解析（例: "8,RB\n1,BB"）
    const results = [];
    const lines = responseText.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // カンマ区切りのパターンにマッチ（例: "8,RB" または "8, RB"）
      const match = trimmed.match(/^(\d+)\s*,\s*(BB|RB)$/i);
      if (match) {
        const game = parseInt(match[1]);
        const type = match[2].toUpperCase();

        if (game > 0 && (type === 'BB' || type === 'RB')) {
          results.push({
            game: game,
            type: type
          });
        }
      }
    }

    console.log('✅ Analysis completed:', results.length, 'records parsed');

    if (results.length > 0) {
      return res.status(200).json({
        results: results,
        message: '画像解析が完了しました'
      });
    } else {
      console.error('❌ No valid data found');
      return res.status(200).json({
        results: [],
        message: 'AIの応答からデータを抽出できませんでした',
        rawResponse: responseText
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