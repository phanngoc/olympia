import { create } from 'zustand';

interface Question {
  id: number;
  question: string;
  answer: string;
}

interface QuizItem {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  score: number;
}

interface QuizStore {
  totalQuestions: number;
  currentQuestionNumber: number;
  quizHistory: QuizItem[];
  correctAnswers: number;
  averageScore: number;
  
  incrementQuestion: () => void;
  addQuizResult: (item: QuizItem) => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizStore>((set) => ({
  totalQuestions: 10,
  currentQuestionNumber: 1,
  quizHistory: [],
  correctAnswers: 0,
  averageScore: 0,
  
  incrementQuestion: () => set((state) => ({ 
    currentQuestionNumber: state.currentQuestionNumber + 1 
  })),
  
  addQuizResult: (item) => set((state) => {
    const newHistory = [...state.quizHistory, item];
    const newCorrectAnswers = item.score >= 70 
      ? state.correctAnswers + 1 
      : state.correctAnswers;
    
    const totalScore = newHistory.reduce((sum, item) => sum + item.score, 0);
    const newAverageScore = Math.round(totalScore / newHistory.length);
    
    return {
      quizHistory: newHistory,
      correctAnswers: newCorrectAnswers,
      averageScore: newAverageScore,
    };
  }),
  
  resetQuiz: () => set({
    currentQuestionNumber: 1,
    quizHistory: [],
    correctAnswers: 0,
    averageScore: 0,
  }),
}));
