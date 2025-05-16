'use client';

import { useState, useEffect } from 'react';
import { useQuizStore } from '@/store/quizStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card-extras';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Mic, User2, ArrowRight, SkipForward, Loader, Clock } from 'lucide-react';
import { playSound } from '@/utils/sound';
import CountdownTimer from './CountdownTimer';

interface Question {
  id: number;
  question: string;
  answer: string;
}

interface QuizProps {
  onComplete: () => void;
}

export default function Quiz({ onComplete }: QuizProps) {
  const { currentQuestionNumber, totalQuestions, incrementQuestion, addQuizResult } = useQuizStore();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<{score: number, feedback: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Timer related states
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [resetTimer, setResetTimer] = useState(false);
  const TIMER_DURATION = 10; // 10 seconds for answering

  useEffect(() => {
    fetchRandomQuestion();
  }, []);

  const fetchRandomQuestion = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/random-question');
      const data = await response.json();
      setCurrentQuestion(data);
      setUserAnswer('');
      setResult(null);
      
      // Reset and start timer for the new question
      setResetTimer(prev => !prev); // Toggle to trigger reset effect
      setIsTimerRunning(true);
    } catch (error) {
      console.error('Error fetching question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      // Stop the timer when recording starts
      setIsTimerRunning(false);
      
      playSound('recording');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio_file', audioBlob);

        try {
          const response = await fetch('http://localhost:8000/transcribe', {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          setUserAnswer(data.transcription);
        } catch (error) {
          console.error('Error converting speech to text:', error);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Create a variable to track if the timer has been stopped
      let isRecordingStopped = false;

      // Set up a check for timer expiration
      const timerCheckInterval = setInterval(() => {
        if (!isTimerRunning && !isRecordingStopped) {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          isRecordingStopped = true;
          clearInterval(timerCheckInterval);
        }
      }, 500);

      // Normal recording stop after 5 seconds
      setTimeout(() => {
        if (!isRecordingStopped) {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          isRecordingStopped = true;
          clearInterval(timerCheckInterval);
        }
      }, 5000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const handleTimeout = () => {
    if (result || userAnswer) return; // Do nothing if already answered
    
    // Stop the timer
    setIsTimerRunning(false);
    
    playSound('incorrect');
    
    // Mark as incorrect automatically
    const timeoutResult = {
      score: 0,
      feedback: "Hết thời gian! Bạn chưa trả lời câu hỏi này kịp thời."
    };
    
    setResult(timeoutResult);
    
    // Add to quiz history with empty answer
    if (currentQuestion) {
      addQuizResult({
        question: currentQuestion.question,
        userAnswer: "Không trả lời kịp thời",
        correctAnswer: currentQuestion.answer,
        score: 0
      });
    }
  };

  const evaluateAnswer = async () => {
    // Stop the timer when evaluating
    setIsTimerRunning(false);
    
    if (!currentQuestion) return;

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          answer: userAnswer,
        }),
      });
      const data = await response.json();
      setResult(data);
      
      // Play sound based on score
      if (data.score >= 70) {
        playSound('correct');
      } else {
        playSound('incorrect');
      }
      
      // Add to quiz history
      if (data) {
        addQuizResult({
          question: currentQuestion.question,
          userAnswer: userAnswer,
          correctAnswer: currentQuestion.answer,
          score: data.score
        });
      }
      
    } catch (error) {
      console.error('Error evaluating answer:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNextQuestion = () => {
    incrementQuestion();
    
    // If we've reached the end of the quiz
    if (currentQuestionNumber >= totalQuestions) {
      playSound('complete');
      onComplete();
      return;
    }
    
    fetchRandomQuestion();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 text-white p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header with progress */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-amber-300">Olympia Quiz</h1>
          <div className="flex items-center space-x-4">
            <CountdownTimer 
              duration={TIMER_DURATION} 
              onTimeout={handleTimeout}
              isRunning={isTimerRunning}
              reset={resetTimer}
            />
            <div className="text-sm text-indigo-200">Câu hỏi {currentQuestionNumber}/{totalQuestions}</div>
            <Progress value={(currentQuestionNumber / totalQuestions) * 100} className="w-32 h-2" />
          </div>
        </div>
        
        {/* Question Card */}
        <Card className="bg-white/10 backdrop-blur-md border-none text-white overflow-hidden">
          <CardHeader className="bg-indigo-800/50 border-b border-indigo-700">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-amber-600/20 text-amber-300 border-amber-500">
                Câu hỏi
              </Badge>
              <CardTitle className="text-xl">{currentQuestion?.question || 'Đang tải câu hỏi...'}</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* Recording visual feedback */}
            <div className="flex flex-col items-center">
              {isRecording ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/30 rounded-full animate-ping"></div>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="h-24 w-24 rounded-full border-2 border-red-500 bg-red-500/20 text-red-500"
                    disabled
                  >
                    <Mic className="h-10 w-10 animate-pulse" />
                  </Button>
                  <div className="mt-4 text-center">
                    <div className="text-sm text-indigo-200">Đang ghi âm...</div>
                    <div className="flex mt-2 justify-center">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i} 
                          className="w-1.5 h-8 mx-0.5 rounded-full bg-indigo-400 opacity-75"
                          style={{animation: `soundbar 1s ease-in-out infinite ${i * 0.15}s`}}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Button 
                  size="lg" 
                  className="h-20 w-20 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-700/50 transition-all duration-200"
                  onClick={startRecording}
                  disabled={isLoading}
                >
                  <Mic className="h-8 w-8" />
                </Button>
              )}
              
              {!isRecording && !userAnswer && (
                <p className="text-center mt-4 text-indigo-200">Nhấn để bắt đầu ghi âm</p>
              )}
            </div>
            
            {/* User answer display */}
            {userAnswer && (
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center">
                  <User2 className="h-4 w-4 mr-2" />
                  Câu trả lời của bạn
                </h3>
                <p className="text-indigo-100">{userAnswer}</p>
                
                <div className="mt-4 flex justify-center">
                  <Button 
                    onClick={evaluateAnswer}
                    disabled={!userAnswer || isLoading}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Đang đánh giá
                      </>
                    ) : (
                      'Kiểm tra đáp án'
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Result display */}
            {result && (
              <div className={`mt-6 p-5 rounded-lg ${result.score >= 70 ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl">Kết quả</h3>
                  <Badge className={result.score >= 70 ? 'bg-green-600' : 'bg-red-600'}>
                    {result.score}/100 điểm
                  </Badge>
                </div>
                
                <Separator className="my-4 bg-white/10" />
                
                <div>
                  <h4 className="font-medium mb-1 text-amber-300">Nhận xét:</h4>
                  <p className="text-indigo-100">{result.feedback}</p>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium mb-1 text-amber-300">Đáp án đúng:</h4>
                  <p className="text-white bg-indigo-800/50 p-3 rounded-md">{currentQuestion?.answer}</p>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="p-6 bg-indigo-800/30 border-t border-indigo-700 flex justify-between">
            {/* Skip Button */}
            <Button 
              variant="ghost" 
              className="text-indigo-200 hover:text-white hover:bg-indigo-700/50"
              onClick={handleNextQuestion}
              disabled={isLoading}
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Bỏ qua
            </Button>
            
            {/* Next Question Button */}
            {result && (
              <Button 
                onClick={handleNextQuestion}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
              >
                Câu hỏi tiếp theo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
