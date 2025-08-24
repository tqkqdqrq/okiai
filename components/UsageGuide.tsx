import React from 'react';
import { XCircleIcon } from './icons';

interface UsageGuideProps {
  isOpen: boolean;
  onClose: () => void;
  gameMode: 'GOLD' | 'BLACK';
}

const UsageGuide: React.FC<UsageGuideProps> = ({ isOpen, onClose, gameMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className={`${gameMode === 'BLACK' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        <div className={`sticky top-0 ${gameMode === 'BLACK' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4 flex justify-between items-center`}>
          <h2 className="text-xl font-bold">
            📖 使い方ガイド - AI画像認識の精度を上げるコツ
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              gameMode === 'BLACK' 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 重要なポイント */}
          <div className={`${gameMode === 'BLACK' ? 'bg-red-900 border-red-700' : 'bg-yellow-50 border-yellow-400'} border-2 rounded-lg p-4`}>
            <h3 className={`text-lg font-bold mb-3 ${gameMode === 'BLACK' ? 'text-red-300' : 'text-yellow-800'}`}>
              ⚡ 最重要ポイント
            </h3>
            <p className={`${gameMode === 'BLACK' ? 'text-red-200' : 'text-yellow-700'} font-semibold`}>
              ヘッダー部分（G数、種別、時間）を含めて切り取ることで、AIの認識精度が大幅に向上します！
            </p>
          </div>

          {/* 推奨される切り取り方法 */}
          <div>
            <h3 className={`text-lg font-bold mb-3 ${gameMode === 'BLACK' ? 'text-white' : 'text-gray-800'}`}>
              ✅ 推奨される切り取り方法
            </h3>
            <div className={`${gameMode === 'BLACK' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 space-y-3`}>
              <div className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <p className="font-semibold">ヘッダー情報を含める</p>
                  <p className={`text-sm ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-600'}`}>
                    画面上部の「G数」「種別」「時間」の表示部分を必ず含めてください
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <p className="font-semibold">履歴全体を含める</p>
                  <p className={`text-sm ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-600'}`}>
                    認識したい履歴データが全て画面内に収まるように切り取ってください
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 注意点 */}
          <div>
            <h3 className={`text-lg font-bold mb-3 ${gameMode === 'BLACK' ? 'text-white' : 'text-gray-800'}`}>
              ⚠️ 注意すべきポイント
            </h3>
            <div className={`${gameMode === 'BLACK' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 space-y-3`}>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-500 text-xl">！</span>
                <div>
                  <p className="font-semibold">枚数カウントがある場合</p>
                  <p className={`text-sm ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-600'}`}>
                    ボーナスの枚数カウント表示がある場合は、その部分を除外するか、ヘッダー部分も含めて切り取ってください。
                    AIがG数と枚数を混同することを防げます。
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-500 text-xl">！</span>
                <div>
                  <p className="font-semibold">画像の鮮明さ</p>
                  <p className={`text-sm ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-600'}`}>
                    文字がはっきり読める鮮明な画像を使用してください
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* なぜヘッダーが重要か */}
          <div>
            <h3 className={`text-lg font-bold mb-3 ${gameMode === 'BLACK' ? 'text-white' : 'text-gray-800'}`}>
              💡 なぜヘッダー情報が重要？
            </h3>
            <div className={`${gameMode === 'BLACK' ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
              <p className={`${gameMode === 'BLACK' ? 'text-blue-200' : 'text-blue-800'}`}>
                ヘッダーに表示される「G数」という文字があることで、AIは数値がゲーム数なのか枚数なのかを正確に判別できます。
                これにより、誤認識を大幅に減らすことができます。
              </p>
            </div>
          </div>

          {/* 切り取り例 */}
          <div>
            <h3 className={`text-lg font-bold mb-3 ${gameMode === 'BLACK' ? 'text-white' : 'text-gray-800'}`}>
              📸 実際の切り取り例
            </h3>
            
            {/* 良い例 */}
            <div className={`${gameMode === 'BLACK' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 mb-4`}>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-green-500 text-xl">✅</span>
                <span className="font-semibold text-green-600">良い例 - ヘッダーを含めた切り取り</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm font-semibold mb-2 ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-700'}`}>
                    例1: ヘッダーと履歴を含む
                  </p>
                  <img 
                    src="https://suroschool.jp/wp-content/uploads/2025/08/スクリーンショット-2025-08-25-081041.png"
                    alt="良い切り取り例1"
                    className="w-full rounded border-2 border-green-400 shadow-lg"
                    style={{ maxHeight: '200px', objectFit: 'contain', backgroundColor: 'white' }}
                  />
                  <p className={`text-xs mt-2 ${gameMode === 'BLACK' ? 'text-gray-400' : 'text-gray-600'}`}>
                    ヘッダーの「G数」「種別」「時間」が含まれているため、AIが正確に認識できます
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-semibold mb-2 ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-700'}`}>
                    例2: 全体を含む切り取り
                  </p>
                  <img 
                    src="https://suroschool.jp/wp-content/uploads/2025/08/スクリーンショット-2025-08-25-080854.png"
                    alt="良い切り取り例2"
                    className="w-full rounded border-2 border-green-400 shadow-lg"
                    style={{ maxHeight: '200px', objectFit: 'contain', backgroundColor: 'white' }}
                  />
                  <p className={`text-xs mt-2 ${gameMode === 'BLACK' ? 'text-gray-400' : 'text-gray-600'}`}>
                    画面全体を含めることで、文脈情報が豊富になり認識精度が向上します
                  </p>
                </div>
              </div>
            </div>
            
            {/* 悪い例 */}
            <div className={`${gameMode === 'BLACK' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-red-500 text-xl">❌</span>
                <span className="font-semibold text-red-600">悪い例 - ヘッダーなしの切り取り</span>
              </div>
              <div className="flex flex-col items-center">
                <img 
                  src="https://suroschool.jp/wp-content/uploads/2025/08/スクリーンショット-2025-08-25-080958.png"
                  alt="悪い切り取り例"
                  className="w-full md:w-2/3 rounded border-2 border-red-400 shadow-lg"
                  style={{ maxHeight: '200px', objectFit: 'contain', backgroundColor: 'white' }}
                />
                <div className={`mt-3 p-3 ${gameMode === 'BLACK' ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg w-full`}>
                  <p className={`text-sm ${gameMode === 'BLACK' ? 'text-red-200' : 'text-red-700'} font-semibold mb-1`}>
                    なぜ認識できないか：
                  </p>
                  <ul className={`text-xs ${gameMode === 'BLACK' ? 'text-red-300' : 'text-red-600'} space-y-1`}>
                    <li>• ヘッダー（G数、種別、時間）が含まれていない</li>
                    <li>• AIが数値がゲーム数なのか枚数なのか判別できない</li>
                    <li>• 文脈情報が不足している</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 外部リンク */}
          <div className={`${gameMode === 'BLACK' ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border rounded-lg p-4`}>
            <p className={`mb-3 ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-700'}`}>
              さらに詳しい使い方や活用方法については、以下のリンクをご覧ください：
            </p>
            <a
              href="https://note.com/kingtqkq/n/n96127dfa1898"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                gameMode === 'BLACK'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <span>📚</span>
              <span>その他の使い方はこちら</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* クイックヒント */}
          <div className={`${gameMode === 'BLACK' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
            <h4 className={`font-semibold mb-2 ${gameMode === 'BLACK' ? 'text-gray-200' : 'text-gray-700'}`}>
              🚀 クイックヒント
            </h4>
            <ul className={`text-sm space-y-1 ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• 画像は4MBまでアップロード可能</li>
              <li>• PNG、JPG、GIF形式に対応</li>
              <li>• 切り取り後も再調整可能</li>
              <li>• 無料版は3回/15分の使用制限あり</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageGuide;