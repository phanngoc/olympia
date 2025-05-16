// filepath: /Users/ngocp/Documents/projects/olympia/frontend/store/quizStore.ts
import { create } from 'zustand';
import { createStore } from 'zustand/vanilla';

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

// Create a store creator function to avoid SSR issues with Next.js
const createQuizStore = (initialState = {}) => {
  return createStore<QuizStore>()((set) => ({
    totalQuestions: 10,
    currentQuestionNumber: 1,
    quizHistory: [],
    correctAnswers: 0,
    averageScore: 0,
    
    incrementQuestion: () => set((state) => ({ 
      currentQuestionNumber: state.currentQuestionNumber + 1 
    })),
    
    addQuizResult: (item: QuizItem) => set((state) => {
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
    
    ...initialState,
  }));
};

// Initialize store on the client side only
let store: ReturnType<typeof createQuizStore> | undefined;

// This is to ensure we don't instantiate the store on the server side
export const initializeStore = (preloadedState = {}) => {
  let _store = store ?? createQuizStore(preloadedState);

  // After navigating to a page with an initial Zustand state, merge that state
  // with the current state in the store, and create a new store
  if (preloadedState && store) {
    _store = createQuizStore({
      ...store.getState(),
      ...preloadedState,
    });
    // Reset the current store
    store = undefined;
  }

  // For SSR, always create a new store
  if (typeof window === 'undefined') return _store;
  
  // Create the store once in the client
  if (!store) store = _store;

  return _store;
};

// Custom hook that uses the store
export const useQuizStore = create<QuizStore>((set) => {
  // Only initialize the store on the client side
  if (typeof window !== 'undefined') {
    const store = initializeStore();
    return store.getState();
  }
  
  // Return empty state for SSR
  return {
    totalQuestions: 10,
    currentQuestionNumber: 1,
    quizHistory: [],
    correctAnswers: 0,
    averageScore: 0,
    incrementQuestion: () => {},
    addQuizResult: () => {},
    resetQuiz: () => {},
  };
});
