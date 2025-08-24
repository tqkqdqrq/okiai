
import React, { useState, useCallback, useMemo } from 'react';
import type { GameRecord, RawRecord } from './types';
import { BonusType } from './types';
import { recalculateRecords } from './utils/calculator';
import { analyzeImageHistory } from './services/difyService';
import ImageProcessor from './components/ImageProcessor';
import HistoryTable from './components/HistoryTable';
import TextOutput from './components/TextOutput';
import AILoadingAnimation from './components/AILoadingAnimation';
import { PlusIcon, TrashIcon, XCircleIcon } from './components/icons';
import { useImageProcessingLimit } from './hooks/useImageProcessingLimit';

type GameMode = 'GOLD' | 'BLACK';
type MachineNumber = 1 | 2;

const createInitialRecords = (): GameRecord[] => {
    const initialRecords = [
        { id: Date.now() + Math.random(), gameCount: '', bonusType: BonusType.EMPTY, isSeparator: false },
        { id: Date.now() + Math.random(), gameCount: '', bonusType: BonusType.EMPTY, isSeparator: false },
        { id: Date.now() + Math.random(), gameCount: '', bonusType: BonusType.CURRENT, isSeparator: false },
    ];
    return recalculateRecords(initialRecords);
};

export default function App(): React.ReactNode {
    const [machine1Records, setMachine1Records] = useState<GameRecord[]>(createInitialRecords);
    const [machine2Records, setMachine2Records] = useState<GameRecord[]>(createInitialRecords);
    const [currentMachine, setCurrentMachine] = useState<MachineNumber>(1);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);
    const [gameMode, setGameMode] = useState<GameMode>('GOLD');
    const [showNumpad, setShowNumpad] = useState<boolean>(false);
    
    const { 
        isLimitReached, 
        incrementUsage, 
        getRemainingTime, 
        getRemainingUses 
    } = useImageProcessingLimit();

    // 現在の台のレコードを取得
    const currentRecords = useMemo(() => 
        currentMachine === 1 ? machine1Records : machine2Records, 
        [currentMachine, machine1Records, machine2Records]
    );
    
    const processedRecords = useMemo(() => 
        recalculateRecords(currentRecords, gameMode), 
        [currentRecords, gameMode]
    );

    const handleImageProcess = useCallback(async (file: File, mode: 'overwrite' | 'append') => {
        if (isLimitReached) {
            setError(`使用制限に達しました。あと${getRemainingTime()}分後にリセットされます。`);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        try {
            const newRawRecords = await analyzeImageHistory(file);
            incrementUsage(); // 使用回数をインクリメント
            if (newRawRecords.length === 0) {
              setError("AI could not detect any game data. Please try a clearer image.");
              return;
            }

            const setCurrentMachineRecords = currentMachine === 1 ? setMachine1Records : setMachine2Records;
            
            setCurrentMachineRecords(prevRecords => {
                const newGameRecords: GameRecord[] = newRawRecords.map((r, i) => ({
                    id: Date.now() + Math.random() + i,
                    gameCount: String(r.game),
                    bonusType: r.type,
                    isSeparator: false,
                }));

                if (mode === 'overwrite') {
                    return [...newGameRecords, { id: Date.now() + Math.random(), gameCount: '', bonusType: BonusType.CURRENT, isSeparator: false }];
                } else {
                    const currentIdx = prevRecords.findIndex(r => r.bonusType === BonusType.CURRENT);
                    if (currentIdx !== -1) {
                        const recordsCopy = [...prevRecords];
                        recordsCopy.splice(currentIdx, 0, ...newGameRecords);
                        return recordsCopy;
                    }
                    return [...prevRecords, ...newGameRecords];
                }
            });
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "An unknown error occurred during image processing.");
        } finally {
            setIsLoading(false);
        }
    }, [isLimitReached, incrementUsage, getRemainingTime]);

    const addRecord = useCallback((position: 'top' | 'bottom') => {
        const setCurrentMachineRecords = currentMachine === 1 ? setMachine1Records : setMachine2Records;
        setCurrentMachineRecords(prev => {
            const newRecord: GameRecord = { id: Date.now() + Math.random(), gameCount: '', bonusType: BonusType.EMPTY, isSeparator: false };
            return position === 'top' ? [newRecord, ...prev] : [...prev, newRecord];
        });
    }, [currentMachine]);

    const updateRecord = useCallback((id: number, updatedFields: Partial<Omit<GameRecord, 'id'>>) => {
        const setCurrentMachineRecords = currentMachine === 1 ? setMachine1Records : setMachine2Records;
        setCurrentMachineRecords(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
    }, [currentMachine]);
    
    const deleteRecord = useCallback((id: number) => {
        const setCurrentMachineRecords = currentMachine === 1 ? setMachine1Records : setMachine2Records;
        setCurrentMachineRecords(prev => prev.filter(r => r.id !== id));
    }, [currentMachine]);

    const clearAllRecords = useCallback(() => {
        if(isDeleteMode) setIsDeleteMode(false);
        const setCurrentMachineRecords = currentMachine === 1 ? setMachine1Records : setMachine2Records;
        setCurrentMachineRecords(() => createInitialRecords());
    }, [isDeleteMode, currentMachine]);

    const toggleDeleteMode = useCallback(() => {
        setIsDeleteMode(prev => !prev);
    }, []);

    const swapRecords = useCallback(() => {
        const setCurrentMachineRecords = currentMachine === 1 ? setMachine1Records : setMachine2Records;
        setCurrentMachineRecords(prev => {
            // すべてのレコードを上下反転（現在位置のレコードも含む）
            return [...prev].reverse();
        });
    }, [currentMachine]);

    const switchGameMode = useCallback((mode: GameMode) => {
        setGameMode(mode);
    }, []);

    const reorderRecords = useCallback((newRecords: GameRecord[]) => {
        const setCurrentMachineRecords = currentMachine === 1 ? setMachine1Records : setMachine2Records;
        setCurrentMachineRecords(newRecords);
    }, [currentMachine]);

    const switchMachine = useCallback((machine: MachineNumber) => {
        setCurrentMachine(machine);
        setIsDeleteMode(false); // 台切替時は削除モードを解除
    }, []);

    return (
        <div className={`container max-w-2xl mx-auto p-4 font-sans ${gameMode === 'BLACK' ? 'bg-gray-900 text-white' : 'text-gray-800'}`}>
            <header className="text-center mb-6">
                {/* ナビゲーションリンク */}
                <div className="mb-4 flex justify-center space-x-4">
                    <a 
                        href="https://suroschool.jp/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`text-sm font-medium transition-colors duration-200 hover:underline ${
                            gameMode === 'BLACK' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                        }`}
                    >
                        たかどらのスロ塾
                    </a>
                    <span className={`text-sm ${gameMode === 'BLACK' ? 'text-gray-500' : 'text-gray-400'}`}>|</span>
                    <a 
                        href="https://suroschool.jp/toollist.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`text-sm font-medium transition-colors duration-200 hover:underline ${
                            gameMode === 'BLACK' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                        }`}
                    >
                        スロ塾ツール一覧
                    </a>
                </div>
                
                <h1 className={`text-3xl font-bold ${gameMode === 'BLACK' ? 'text-red-400' : 'text-gold'}`}>
                    有利区間計算ツール
                </h1>
                
                {/* モード切替 */}
                <div className="mt-4 flex justify-center space-x-2">
                    <button
                        onClick={() => switchGameMode('GOLD')}
                        className={`px-4 py-2 rounded font-semibold transition duration-200 ${
                            gameMode === 'GOLD' 
                                ? 'bg-yellow-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        GOLDモード
                    </button>
                    <button
                        onClick={() => switchGameMode('BLACK')}
                        className={`px-4 py-2 rounded font-semibold transition duration-200 ${
                            gameMode === 'BLACK' 
                                ? 'bg-red-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        BLACK&GSモード
                    </button>
                </div>
            </header>

            <main>
                <ImageProcessor 
                    onProcess={handleImageProcess} 
                    isLoading={isLoading} 
                    error={error} 
                    setError={setError} 
                    gameMode={gameMode}
                    isLimitReached={isLimitReached}
                    remainingUses={getRemainingUses()}
                    remainingTime={getRemainingTime()}
                />
                
                <div className={`${gameMode === 'BLACK' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 mt-6`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className={`text-xl font-bold ${gameMode === 'BLACK' ? 'text-white' : 'text-gray-700'}`}>履歴データ</h2>
                        
                        {/* 台切替ボタン */}
                        <div className="flex space-x-1">
                            <button
                                onClick={() => switchMachine(1)}
                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                    currentMachine === 1 
                                        ? (gameMode === 'BLACK' ? 'bg-red-600 text-white shadow-lg' : 'bg-gold text-white shadow-lg')
                                        : (gameMode === 'BLACK' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
                                }`}
                            >
                                1台目
                            </button>
                            <button
                                onClick={() => switchMachine(2)}
                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                    currentMachine === 2 
                                        ? (gameMode === 'BLACK' ? 'bg-red-600 text-white shadow-lg' : 'bg-gold text-white shadow-lg')
                                        : (gameMode === 'BLACK' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
                                }`}
                            >
                                2台目
                            </button>
                        </div>
                    </div>
                    <div className="flex space-x-2 mb-4">
                        <button onClick={() => addRecord('top')} className={`flex-1 ${gameMode === 'BLACK' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center`}>
                           <div className="flex items-center gap-1">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14l5-5 5 5" />
                             </svg>
                             <PlusIcon className="w-4 h-4" />
                           </div>
                        </button>
                        <button onClick={swapRecords} className={`flex-1 ${gameMode === 'BLACK' ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2`}>
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                           <span>上下入替</span>
                        </button>
                         <button onClick={clearAllRecords} className={`flex-1 ${gameMode === 'BLACK' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2`}>
                           <XCircleIcon className="w-5 h-5" /> <span>クリア</span>
                        </button>
                    </div>

                    <HistoryTable 
                        records={processedRecords}
                        isDeleteMode={isDeleteMode}
                        onUpdate={updateRecord}
                        onDelete={deleteRecord}
                        onReorder={reorderRecords}
                        gameMode={gameMode}
                        onNumpadToggle={setShowNumpad}
                    />

                    <div className="flex space-x-2 mt-4">
                        <button onClick={() => addRecord('bottom')} className={`flex-1 ${gameMode === 'BLACK' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center`}>
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5 5 5-5" />
                              </svg>
                              <PlusIcon className="w-4 h-4" />
                            </div>
                        </button>
                        <button 
                            onClick={toggleDeleteMode} 
                            className={`flex-1 font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2 ${isDeleteMode ? (gameMode === 'BLACK' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-yellow-400 hover:bg-yellow-500 text-black') : 'bg-red-500 hover:bg-red-600 text-white'}`}
                        >
                            <TrashIcon className="w-5 h-5" /> <span>{isDeleteMode ? '完了' : '選択削除'}</span>
                        </button>
                    </div>

                    <TextOutput records={processedRecords} gameMode={gameMode} onReorder={reorderRecords} />
                </div>
                
                {/* テンキー表示時のスクロール余白 */}
                {showNumpad && <div className="h-80 sm:h-96" />}
            </main>

            <footer className={`text-center mt-8 text-sm ${gameMode === 'BLACK' ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>Favorable Zone Calculator</p>
            </footer>
            
            {/* AIローディングアニメーション */}
            {isLoading && <AILoadingAnimation gameMode={gameMode} />}
        </div>
    );
}
