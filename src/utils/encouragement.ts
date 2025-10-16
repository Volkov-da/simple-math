export type EncouragementType = 'correct' | 'incorrect' | 'streak' | 'session_start' | 'session_end';

interface EncouragementContext {
  streak: number;
  accuracy: number;
  isFirstCorrect: boolean;
  isPersonalBest: boolean;
  sessionLength: number;
}

const correctMessages = [
  "Perfect!",
  "Excellent!",
  "Amazing!",
  "Great job!",
  "Well done!",
  "Fantastic!",
  "Outstanding!",
  "Brilliant!",
  "Superb!",
  "Terrific!",
  "Wonderful!",
  "Awesome!",
  "Incredible!",
  "Magnificent!",
  "Splendid!",
  "You've got it!",
  "Keep it up!",
  "You're on fire!",
  "That's the way!",
  "Nice work!",
];

const incorrectMessages = [
  "Not quite, but keep trying!",
  "Close! Try again!",
  "Almost there!",
  "Good effort!",
  "You'll get it next time!",
  "Keep practicing!",
  "Don't give up!",
  "You're learning!",
  "Every mistake is progress!",
  "Stay focused!",
  "You've got this!",
  "Keep going!",
  "Practice makes perfect!",
  "You're getting better!",
  "Don't worry, try again!",
];

const streakMessages = [
  "🔥 On fire!",
  "🔥 Streak!",
  "🔥 Amazing streak!",
  "🔥 You're unstoppable!",
  "🔥 Incredible streak!",
  "🔥 Keep it going!",
  "🔥 Unbelievable!",
  "🔥 Fantastic run!",
  "🔥 Outstanding!",
  "🔥 Phenomenal!",
];

const sessionStartMessages = [
  "Ready to practice?",
  "Let's do this!",
  "Time to shine!",
  "You've got this!",
  "Let's go!",
  "Ready, set, go!",
  "Show what you can do!",
  "Let's practice!",
  "Time to learn!",
  "Here we go!",
];

const sessionEndMessages = [
  "Great session!",
  "Well done!",
  "Excellent work!",
  "Amazing practice!",
  "Outstanding session!",
  "Fantastic job!",
  "You rocked it!",
  "Incredible work!",
  "Brilliant session!",
  "Superb practice!",
];

export function getEncouragementMessage(
  type: EncouragementType,
  context: Partial<EncouragementContext> = {}
): string {
  const { streak = 0, accuracy = 0, isFirstCorrect = false, isPersonalBest = false } = context;

  switch (type) {
    case 'correct':
      if (streak >= 5) {
        return getRandomMessage(streakMessages);
      }
      if (isFirstCorrect) {
        return "Great start!";
      }
      if (isPersonalBest) {
        return "🎉 New personal best!";
      }
      if (accuracy >= 90) {
        return getRandomMessage(correctMessages.filter(msg => 
          ["Perfect!", "Excellent!", "Outstanding!", "Brilliant!"].includes(msg)
        ));
      }
      return getRandomMessage(correctMessages);

    case 'incorrect':
      if (streak === 0 && accuracy < 50) {
        return "Don't worry, everyone starts somewhere!";
      }
      if (streak > 3) {
        return "Oops! But you were on a roll!";
      }
      return getRandomMessage(incorrectMessages);

    case 'streak':
      if (streak === 3) {
        return "🔥 Getting hot!";
      }
      if (streak === 5) {
        return "🔥 On fire!";
      }
      if (streak === 10) {
        return "🔥 Unstoppable!";
      }
      if (streak >= 15) {
        return "🔥 Legendary!";
      }
      return getRandomMessage(streakMessages);

    case 'session_start':
      return getRandomMessage(sessionStartMessages);

    case 'session_end':
      if (accuracy >= 90) {
        return "🎉 Outstanding performance!";
      }
      if (accuracy >= 80) {
        return "🎉 Great job!";
      }
      if (accuracy >= 70) {
        return "🎉 Good work!";
      }
      return getRandomMessage(sessionEndMessages);

    default:
      return "Keep going!";
  }
}

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getPerformanceRating(accuracy: number, avgTime: number): {
  rating: string;
  emoji: string;
  color: string;
} {
  if (accuracy >= 95 && avgTime <= 2000) {
    return { rating: "Master", emoji: "🏆", color: "text-yellow-500" };
  }
  if (accuracy >= 90 && avgTime <= 3000) {
    return { rating: "Expert", emoji: "🥇", color: "text-yellow-400" };
  }
  if (accuracy >= 80 && avgTime <= 4000) {
    return { rating: "Advanced", emoji: "🥈", color: "text-gray-400" };
  }
  if (accuracy >= 70) {
    return { rating: "Good", emoji: "🥉", color: "text-orange-500" };
  }
  if (accuracy >= 60) {
    return { rating: "Improving", emoji: "📈", color: "text-blue-500" };
  }
  return { rating: "Keep Practicing", emoji: "💪", color: "text-green-500" };
}

export function getSkillFeedback(skill: string, accuracy: number): string {
  const skillNames: Record<string, string> = {
    addition: "Addition",
    subtraction: "Subtraction", 
    multiplication: "Multiplication",
    division: "Division",
    percent: "Percentages"
  };

  const skillName = skillNames[skill] || skill;

  if (accuracy >= 90) {
    return `🌟 Excellent at ${skillName}!`;
  }
  if (accuracy >= 80) {
    return `👍 Great at ${skillName}!`;
  }
  if (accuracy >= 70) {
    return `📚 Good at ${skillName}!`;
  }
  if (accuracy >= 60) {
    return `📖 Keep practicing ${skillName}!`;
  }
  return `💪 Focus on ${skillName}!`;
}
