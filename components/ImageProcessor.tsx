
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadIcon, SparklesIcon, PlusCircleIcon, AlertTriangleIcon, LoadingSpinnerIcon } from './icons';

// Cropper.jsの型定義
declare global {
  interface Window {
    Cropper: any;
  }
}

interface ImageProcessorProps {
  onProcess: (file: File, mode: 'overwrite' | 'append') => void;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  gameMode?: 'GOLD' | 'BLACK';
  isLimitReached?: boolean;
  remainingUses?: number;
  remainingTime?: number;
}

const ImageProcessor: React.FC<ImageProcessorProps> = ({ 
  onProcess, 
  isLoading, 
  error, 
  setError, 
  gameMode = 'GOLD',
  isLimitReached = false,
  remainingUses = 3,
  remainingTime = 0 
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropperModal, setShowCropperModal] = useState<boolean>(false);
  const [croppedImageData, setCroppedImageData] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isCompareViewActive, setIsCompareViewActive] = useState<boolean>(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageForCroppingRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<any>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if(file.size > 4 * 1024 * 1024) {
          setError("画像サイズは4MBまでです。");
          return;
      }
      setError(null);
      setSelectedFile(file);
      
      // まず画像プレビューを設定
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const imageDataUrl = e.target.result as string;
          setImagePreview(imageDataUrl); // プレビューを即座に設定
          
          // モーダルを表示して画像を設定
          setCropperImageSrc(imageDataUrl);
          setShowCropperModal(true);
          console.log('Setting cropper image src:', imageDataUrl.substring(0, 50) + '...');
        }
      };
      reader.readAsDataURL(file);
    }
  }, [setError]);

  // Cropper.jsの初期化をuseEffectで管理
  useEffect(() => {
    if (showCropperModal && cropperImageSrc && imageForCroppingRef.current) {
      // 既存のCropperがあれば破棄
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
      
      const imgElement = imageForCroppingRef.current;
      imgElement.src = cropperImageSrc;
      
      const initCropper = () => {
        console.log('Initializing Cropper.js...');
        
        if (window.Cropper && imgElement) {
          try {
            cropperRef.current = new window.Cropper(imgElement, {
              aspectRatio: NaN,
              viewMode: 1,
              autoCropArea: 0.8,
              responsive: true,
              background: false,
              modal: true,
              guides: true,
              highlight: true,
              center: true,
              movable: true,
              rotatable: false,
              scalable: true,
              zoomable: true,
              zoomOnTouch: true,
              zoomOnWheel: true,
              cropBoxMovable: true,
              cropBoxResizable: true,
              toggleDragModeOnDblclick: false,
              dragMode: 'crop',
              checkCrossOrigin: false,
              checkOrientation: false,
              restore: false,
              ready: function() {
                console.log('Cropper ready for interaction');
                setStatus('切り取り範囲を選択して「切り取り実行」ボタンを押してください。');
              }
            });
          } catch (error) {
            console.error('Cropper initialization error:', error);
            setStatus('切り取り機能の初期化に失敗しました。');
          }
        } else {
          console.error('Cropper library not available');
          setStatus('切り取り機能が利用できません。');
        }
      };
      
      // 画像の読み込み完了を待つ
      if (imgElement.complete) {
        initCropper();
      } else {
        imgElement.onload = initCropper;
        imgElement.onerror = () => {
          console.error('Failed to load image');
          setStatus('画像の読み込みに失敗しました。');
        };
      }
    }
    
    // クリーンアップ
    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [showCropperModal, cropperImageSrc]);

  const handleCrop = useCallback(() => {
    if (cropperRef.current) {
      const croppedCanvas = cropperRef.current.getCroppedCanvas();
      const croppedDataUrl = croppedCanvas.toDataURL('image/png');
      
      setCroppedImageData(croppedDataUrl);
      setImagePreview(croppedDataUrl);
      setStatus('画像が切り取られました。分析を開始できます。');
      
      // Cropper.jsを破棄してモーダルを閉じる
      cropperRef.current.destroy();
      cropperRef.current = null;
      setShowCropperModal(false);
      
      // 切り取られた画像をFileオブジェクトに変換
      croppedCanvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const croppedFile = new File([blob], `cropped_${selectedFile?.name || 'image.png'}`, {
            type: 'image/png'
          });
          setSelectedFile(croppedFile);
        }
      }, 'image/png');
    }
  }, [selectedFile]);

  const handleCancelCrop = useCallback(() => {
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }
    setShowCropperModal(false);
    setStatus('切り取りがキャンセルされました。元の画像を使用します。');
    // 注意: プレビュー画像とファイルはそのまま保持
  }, []);

  const handleProcess = (mode: 'overwrite' | 'append') => {
    if (selectedFile) {
      onProcess(selectedFile, mode);
    }
  };

  const toggleCompareView = useCallback(() => {
    if (!imagePreview) {
      alert('見比べるには、まず履歴画像を選択してください。');
      return;
    }
    setIsCompareViewActive(prev => !prev);
  }, [imagePreview]);

  const clearImage = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setImagePreview(null);
    setCroppedImageData(null);
    setSelectedFile(null);
    setStatus('');
    setIsCompareViewActive(false);
  }, []);

  const triggerFileSelect = () => {
      fileInputRef.current?.click();
  };

  return (
    <div className={`${gameMode === 'BLACK' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
      <div className="mb-4">
        <h2 className={`text-xl font-bold mb-2 ${gameMode === 'BLACK' ? 'text-white' : 'text-gray-700'}`}>
          <SparklesIcon className={`w-6 h-6 inline-block mr-2 ${gameMode === 'BLACK' ? 'text-red-400' : 'text-gold'}`} />
          履歴画像から自動入力
        </h2>
        
        {/* 使用制限表示 */}
        <div className={`text-sm ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-600'}`}>
          残り使用回数: {remainingUses}/3回 
          {isLimitReached && (
            <span className="text-red-500 font-semibold ml-2">
              (制限中 - あと{remainingTime}分)
            </span>
          )}
        </div>
        
        {/* メンバーシップ広告 */}
        {isLimitReached && (
          <div className={`mt-3 p-3 rounded-lg border-2 ${gameMode === 'BLACK' ? 'bg-gradient-to-r from-purple-900 to-indigo-900 border-purple-600 text-white' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-gray-800'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">🚀 無制限で使いたい方へ</p>
                <p className="text-xs opacity-80">メンバーシップ登録で制限解除！</p>
              </div>
              <a 
                href="https://note.com/kingtqkq/n/ncaa7cb09de5e" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`px-3 py-1 rounded-md font-semibold text-xs transition-all duration-200 ${
                  gameMode === 'BLACK' 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                詳細を見る
              </a>
            </div>
          </div>
        )}
      </div>
      <input
        type="file"
        id="imageInput"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {!imagePreview && (
         <button onClick={triggerFileSelect} className={`w-full border-2 border-dashed ${gameMode === 'BLACK' ? 'border-gray-600 hover:border-red-400 hover:text-red-400' : 'border-gray-300 hover:border-gold hover:text-gold'} rounded-lg p-8 text-center transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${gameMode === 'BLACK' ? 'focus:ring-red-400' : 'focus:ring-gold'}`}>
            <UploadIcon className={`w-12 h-12 mx-auto ${gameMode === 'BLACK' ? 'text-gray-500' : 'text-gray-400'}`}/>
            <span className={`mt-2 block font-semibold ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-600'}`}>履歴画像を選択</span>
            <span className={`mt-1 block text-sm ${gameMode === 'BLACK' ? 'text-gray-400' : 'text-gray-500'}`}>PNG, JPG, GIF up to 4MB</span>
        </button>
      )}

      {imagePreview && (
        <div className="mt-4">
            <p className={`text-sm font-semibold ${gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
              {croppedImageData ? '切り取り後のプレビュー:' : '画像プレビュー:'}
            </p>
            <div className={`flex justify-center border ${gameMode === 'BLACK' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} rounded-lg p-2`}>
                <img 
                  src={imagePreview} 
                  alt="画像プレビュー" 
                  className={`max-h-60 object-contain rounded ${isCompareViewActive ? 'fixed top-4 right-4 z-40 bg-white border shadow-lg max-w-xs' : ''}`}
                />
            </div>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={toggleCompareView}
                className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded transition duration-200"
              >
                {isCompareViewActive ? '見比べ終了' : '表と見比べ'}
              </button>
              <button
                onClick={clearImage}
                className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded transition duration-200"
              >
                画像をクリア
              </button>
            </div>
        </div>
      )}

      {status && (
        <div className={`mt-4 p-3 ${gameMode === 'BLACK' ? 'bg-blue-900 border-blue-600 text-blue-200' : 'bg-blue-100 border-blue-400 text-blue-700'} border rounded-lg`}>
          <span>{status}</span>
        </div>
      )}

      {/* Cropper.jsモーダル */}
      {showCropperModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="mb-3">
              <h3 className="text-lg font-semibold mb-2">画像の切り取り</h3>
              <p className="text-sm text-gray-600">
                マウスドラッグで切り取り範囲を選択してください。角をドラッグしてサイズ調整、中央をドラッグして移動できます。
              </p>
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-semibold flex items-center">
                  <span className="text-lg mr-2">💡</span>
                  ヒント: AI認識精度を上げるコツ
                </p>
                <ul className="mt-1 text-xs text-blue-700 space-y-1">
                  <li>• ヘッダー部分（G数、種別、時間）を含めると認識精度が大幅に向上します</li>
                  <li>• 枚数カウントがある場合は、その部分を除外するかヘッダーも含めて切り取ってください</li>
                  <li>• 文字がはっきり読める部分を選択してください</li>
                </ul>
              </div>
            </div>
            <div className="flex-1 mb-4 overflow-hidden" style={{minHeight: '400px', maxHeight: '60vh'}}>
              <img 
                ref={imageForCroppingRef}
                src={cropperImageSrc || undefined}
                alt="切り取り対象画像"
                className="block w-full h-auto"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelCrop}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition duration-200"
              >
                キャンセル
              </button>
              <button
                onClick={handleCrop}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-200"
              >
                切り取り実行
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedFile && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => handleProcess('overwrite')}
            disabled={isLoading || isLimitReached}
            className={`w-full flex justify-center items-center space-x-2 font-bold py-2 px-4 rounded-lg transition duration-200 ${
              isLimitReached 
                ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                : 'bg-gold hover:bg-yellow-600 text-white disabled:bg-yellow-300 disabled:cursor-wait'
            }`}
          >
            {isLoading ? <LoadingSpinnerIcon /> : <SparklesIcon className="w-5 h-5"/>}
            <span>{isLimitReached ? '制限中' : '表をクリアして追加'}</span>
          </button>
          <button
            onClick={() => handleProcess('append')}
            disabled={isLoading || isLimitReached}
            className={`w-full flex justify-center items-center space-x-2 font-bold py-2 px-4 rounded-lg transition duration-200 ${
              isLimitReached 
                ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                : 'bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-400 disabled:cursor-wait'
            }`}
          >
            {isLoading ? <LoadingSpinnerIcon /> : <PlusCircleIcon className="w-5 h-5"/>}
            <span>{isLimitReached ? '制限中' : '表の下に追加'}</span>
          </button>
        </div>
      )}

      {error && (
        <div className={`mt-4 p-3 ${gameMode === 'BLACK' ? 'bg-red-900 border-red-600 text-red-200' : 'bg-red-100 border-red-400 text-red-700'} border rounded-lg flex items-center`}>
            <AlertTriangleIcon className="w-5 h-5 mr-2"/>
            <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageProcessor;
