import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Brain, Trophy } from 'lucide-react';

interface WelcomeProps {
  onStart: () => void;
}

export default function Welcome({ onStart }: WelcomeProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 text-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <header className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400">
            Olympia Quiz
          </h1>
          <p className="text-xl md:text-2xl text-indigo-200">Thử thách trí tuệ của bạn!</p>
        </header>

        <Card className="bg-white/10 backdrop-blur-md border-none text-white p-8 shadow-xl">
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-bold">Hướng dẫn</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="h-8 w-8" />
                </div>
                <h3 className="font-medium mb-2">Trả lời bằng giọng nói</h3>
                <p className="text-sm text-indigo-200">Nhấn nút và nói câu trả lời của bạn</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8" />
                </div>
                <h3 className="font-medium mb-2">AI đánh giá</h3>
                <p className="text-sm text-indigo-200">Hệ thống AI sẽ đánh giá câu trả lời của bạn</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8" />
                </div>
                <h3 className="font-medium mb-2">Nhận điểm số</h3>
                <p className="text-sm text-indigo-200">Xem điểm và so sánh với đáp án đúng</p>
              </div>
            </div>
            
            <Button 
              size="lg" 
              className="mt-8 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={onStart}
            >
              Bắt đầu thử thách
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
