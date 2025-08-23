import React from 'react';

interface AILoadingAnimationProps {
  gameMode?: 'GOLD' | 'BLACK';
}

const AILoadingAnimation: React.FC<AILoadingAnimationProps> = ({ gameMode = 'GOLD' }) => {
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50`}>
      <div className={`${gameMode === 'BLACK' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4`}>
        {/* AIアイコンとローディングアニメーション */}
        <div className="text-center">
          <div className="relative mb-6">
            {/* 回転するリング */}
            <div className={`w-24 h-24 mx-auto border-4 ${gameMode === 'BLACK' ? 'border-red-500' : 'border-gold'} border-t-transparent rounded-full animate-spin`}></div>
            
            {/* 中央のAIアイコン */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-16 h-16 ${gameMode === 'BLACK' ? 'bg-red-600' : 'bg-gold'} rounded-full flex items-center justify-center animate-pulse`}>
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v-.07zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
            </div>
            
            {/* 外側のパルスリング */}
            <div className={`absolute inset-0 w-24 h-24 mx-auto border-2 ${gameMode === 'BLACK' ? 'border-red-400' : 'border-yellow-400'} rounded-full animate-ping opacity-30`}></div>
          </div>
          
          {/* AIステータステキスト */}
          <h3 className={`text-xl font-bold mb-3 ${gameMode === 'BLACK' ? 'text-white' : 'text-gray-800'}`}>
            AI分析中
          </h3>
          
          {/* アニメーションドット */}
          <div className="flex justify-center space-x-1 mb-4">
            <div className={`w-2 h-2 ${gameMode === 'BLACK' ? 'bg-red-400' : 'bg-gold'} rounded-full animate-bounce`} style={{animationDelay: '0ms'}}></div>
            <div className={`w-2 h-2 ${gameMode === 'BLACK' ? 'bg-red-400' : 'bg-gold'} rounded-full animate-bounce`} style={{animationDelay: '150ms'}}></div>
            <div className={`w-2 h-2 ${gameMode === 'BLACK' ? 'bg-red-400' : 'bg-gold'} rounded-full animate-bounce`} style={{animationDelay: '300ms'}}></div>
          </div>
          
          {/* プロセス説明 */}
          <div className={`text-sm ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-600'} space-y-2`}>
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 ${gameMode === 'BLACK' ? 'bg-green-400' : 'bg-green-500'} rounded-full animate-pulse`}></div>
              <span>画像を解析中...</span>
            </div>
            <div className="flex items-center justify-center space-x-2 opacity-80">
              <div className={`w-2 h-2 ${gameMode === 'BLACK' ? 'bg-blue-400' : 'bg-blue-500'} rounded-full animate-pulse`}></div>
              <span>ゲーム回数を認識中...</span>
            </div>
            <div className="flex items-center justify-center space-x-2 opacity-60">
              <div className={`w-2 h-2 ${gameMode === 'BLACK' ? 'bg-purple-400' : 'bg-purple-500'} rounded-full animate-pulse`}></div>
              <span>ボーナス種別を判定中...</span>
            </div>
          </div>
          
          {/* 進行バー */}
          <div className={`mt-6 w-full ${gameMode === 'BLACK' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
            <div className={`${gameMode === 'BLACK' ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'} h-2 rounded-full animate-pulse`} style={{width: '70%', animation: 'progress 2s ease-in-out infinite'}}>
            </div>
          </div>
          
          <style jsx>{`
            @keyframes progress {
              0%, 100% { width: 30%; }
              50% { width: 90%; }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default AILoadingAnimation;