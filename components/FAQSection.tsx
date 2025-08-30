import React, { useState } from 'react';

type GameMode = 'GOLD' | 'BLACK';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQSectionProps {
    gameMode: GameMode;
}

const faqData: FAQItem[] = [
    {
        question: "有利区間とは何ですか？",
        answer: "有利区間とは、パチスロにおいてATやCZなどの出玉性能が向上する区間のことです。2017年の規則改正により、有利区間は最大1500ゲームまでと定められており、この区間を正確に把握することで効率的な立ち回りが可能になります。"
    },
    {
        question: "有利区間の計算方法を教えてください",
        answer: "有利区間は通常、ボーナス終了後から開始され、次のボーナス当選まで、または1500ゲームに到達するまで継続します。当ツールでは、ボーナス履歴を基に自動的に有利区間の範囲を計算し、残りゲーム数を表示します。"
    },
    {
        question: "AI画像認識機能の使い方を教えてください",
        answer: "スマホでゲーム履歴画面のスクリーンショットを撮影し、「画像をアップロード」ボタンから画像を選択してください。AIが自動的にゲーム数とボーナス種別を読み取り、データとして入力します。画像は鮮明で、ゲーム数とボーナス情報がはっきり見える状態で撮影してください。"
    },
    {
        question: "どのような機種に対応していますか？",
        answer: "基本的にほぼすべてのパチスロ機種の有利区間計算に対応しています。GOLDモードは一般的な機種用で、BLACK&GSモードはゴールデンサミー系列の機種に最適化されています。機種に応じてモードを切り替えてご利用ください。"
    },
    {
        question: "データは保存されますか？",
        answer: "入力されたデータはお使いのブラウザ内にのみ保存され、外部のサーバーには送信されません。ページを閉じると一部のデータは消失する場合があります。重要なデータは別途記録を残すことをお勧めします。"
    },
    {
        question: "2台同時に管理できますか？",
        answer: "はい、「1台目」「2台目」のタブを切り替えることで、最大2台の台データを同時に管理できます。各台のデータは独立して保存され、計算結果も個別に表示されます。"
    },
    {
        question: "計算結果が正確でない場合はどうすればよいですか？",
        answer: "計算結果に疑問がある場合は、入力データを再確認してください。特にボーナス種別（BIG/REG/CZ等）が正しく設定されているか、ゲーム数に入力ミスがないかをチェックしてください。必要に応じて手動でデータを修正できます。"
    },
    {
        question: "使用回数に制限はありますか？",
        answer: "AI画像認識機能には1時間あたりの使用制限があります。制限に達した場合は、時間をおいて再度お試しいただくか、手動でのデータ入力をご利用ください。基本的な計算機能に制限はありません。"
    }
];

export default function FAQSection({ gameMode }: FAQSectionProps): React.ReactNode {
    const [isExpanded, setIsExpanded] = useState(false);
    const [openItems, setOpenItems] = useState<Set<number>>(new Set());

    const toggleSection = () => {
        setIsExpanded(!isExpanded);
        if (!isExpanded) {
            setOpenItems(new Set());
        }
    };

    const toggleItem = (index: number) => {
        const newOpenItems = new Set(openItems);
        if (newOpenItems.has(index)) {
            newOpenItems.delete(index);
        } else {
            newOpenItems.add(index);
        }
        setOpenItems(newOpenItems);
    };

    const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
        <svg 
            className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );

    return (
        <section className={`mt-8 ${gameMode === 'BLACK' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden`}>
            <button
                onClick={toggleSection}
                className={`w-full px-6 py-4 text-left transition-colors duration-200 flex items-center justify-between ${
                    gameMode === 'BLACK' 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                }`}
            >
                <h2 className="text-lg font-bold">よくある質問（FAQ）</h2>
                <ChevronIcon isOpen={isExpanded} />
            </button>
            
            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 py-4 space-y-3">
                    {faqData.map((item, index) => (
                        <div key={index} className={`border-b ${gameMode === 'BLACK' ? 'border-gray-600' : 'border-gray-200'} last:border-b-0 pb-3 last:pb-0`}>
                            <button
                                onClick={() => toggleItem(index)}
                                className={`w-full text-left py-2 flex items-center justify-between transition-colors duration-200 ${
                                    gameMode === 'BLACK' 
                                        ? 'text-gray-200 hover:text-white' 
                                        : 'text-gray-700 hover:text-gray-900'
                                }`}
                            >
                                <h3 className="font-medium pr-2">{item.question}</h3>
                                <ChevronIcon isOpen={openItems.has(index)} />
                            </button>
                            
                            <div className={`transition-all duration-200 ease-in-out overflow-hidden ${
                                openItems.has(index) ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
                            }`}>
                                <p className={`text-sm leading-relaxed ${
                                    gameMode === 'BLACK' ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                    {item.answer}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}