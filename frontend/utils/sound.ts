// Sound utility for quiz app
export const playSound = (type: 'correct' | 'incorrect' | 'recording' | 'complete') => {
  // Map of sound types to their paths
  // These files would need to be added to the public folder
  const sounds = {
    correct: '/sounds/correct.mp3',
    incorrect: '/sounds/incorrect.mp3',
    recording: '/sounds/recording.mp3',
    complete: '/sounds/complete.mp3',
  };
  
  // Create and play audio
  try {
    const audio = new Audio(sounds[type]);
    audio.play().catch(e => console.error('Error playing sound:', e));
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};
