import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Welcome from './Welcome';
import Quiz from './Quiz';
import Results from './Results';

enum QuizState {
  WELCOME,
  QUIZ,
  RESULTS
}

export default function QuizLayout() {
  const [quizState, setQuizState] = useState<QuizState>(QuizState.WELCOME);
  
  return (
    <AnimatePresence mode="wait">
      {quizState === QuizState.WELCOME && (
        <motion.div
          key="welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Welcome onStart={() => setQuizState(QuizState.QUIZ)} />
        </motion.div>
      )}
      
      {quizState === QuizState.QUIZ && (
        <motion.div
          key="quiz"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Quiz 
            onComplete={() => setQuizState(QuizState.RESULTS)} 
          />
        </motion.div>
      )}
      
      {quizState === QuizState.RESULTS && (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Results 
            onStartOver={() => {
              setQuizState(QuizState.WELCOME);
            }} 
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
