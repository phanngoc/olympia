import React, { useEffect } from 'react';
import { useQuizStore } from '@/store/quizStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card-extras';
import { Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResultsProps {
  onStartOver: () => void;
}

export default function Results({ onStartOver }: ResultsProps) {
  const { quizHistory, correctAnswers, averageScore, totalQuestions, resetQuiz } = useQuizStore();

  useEffect(() => {
    // Trigger confetti if the user did well
    if (averageScore >= 70) {
      triggerConfetti();
    }
  }, [averageScore]);

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const handleStartOver = () => {
    resetQuiz();
    onStartOver();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 text-white p-6">
      <div className="container mx-auto max-w-3xl">
        <Card className="bg-white/10 backdrop-blur-md border-none text-white overflow-hidden">
          <div className="text-center p-8 border-b border-indigo-700 bg-indigo-800/50">
            <div className="inline-flex rounded-full bg-indigo-100 p-4 mb-4">
              <Trophy className="h-12 w-12 text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Thành tích của bạn</h1>
            <p className="text-indigo-200">Bạn đã hoàn thành phiên thi đấu!</p>
          </div>
          
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <p className="text-sm text-indigo-200 mb-1">Tổng số câu hỏi</p>
                <p className="text-3xl font-bold text-white">{totalQuestions}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <p className="text-sm text-indigo-200 mb-1">Số câu đúng</p>
                <p className="text-3xl font-bold text-green-400">{correctAnswers}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <p className="text-sm text-indigo-200 mb-1">Điểm trung bình</p>
                <p className="text-3xl font-bold text-amber-300">{averageScore}/100</p>
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-4">Kết quả chi tiết</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {quizHistory.map((item, index) => (
                <div key={index} className="bg-white/5 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.question}</h3>
                      <p className="text-sm text-indigo-200 mt-1">Câu trả lời của bạn: {item.userAnswer}</p>
                    </div>
                    <Badge className={item.score >= 70 ? 'bg-green-600' : 'bg-red-600'}>
                      {item.score}/100
                    </Badge>
                  </div>
                  <Separator className="my-3 bg-white/10" />
                  <p className="text-sm text-amber-300">Đáp án đúng: <span className="text-white">{item.correctAnswer}</span></p>
                </div>
              ))}
            </div>
          </CardContent>
          
          <CardFooter className="p-6 bg-indigo-800/30 border-t border-indigo-700 flex justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-8"
              onClick={handleStartOver}
            >
              Bắt đầu lại
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
