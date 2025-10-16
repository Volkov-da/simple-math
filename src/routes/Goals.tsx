import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Target, Trophy, Calendar, Zap, Award, Star, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';
import { AnimatedCounter, StatCard, ProgressBar } from '../components/AnimatedCounter';
import { CircularProgress } from '../components/ProgressRing';
import { fadeIn, slideUp, scaleIn, bounceIn } from '../utils/animations';

interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  type: 'daily' | 'weekly' | 'monthly' | 'personal';
  category: 'accuracy' | 'speed' | 'sessions' | 'streak';
  icon: string;
  color: string;
  completed: boolean;
  deadline?: string;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: string;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
}

export default function Goals() {
  const { playSound } = useSound();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'goals' | 'challenges'>('goals');

  useEffect(() => {
    const loadGoals = () => {
      try {
        // Load goals from localStorage
        const savedGoals = JSON.parse(localStorage.getItem('goals') || '[]');
        const savedChallenges = JSON.parse(localStorage.getItem('dailyChallenges') || '[]');
        
        // If no goals exist, create default ones
        if (savedGoals.length === 0) {
          const defaultGoals: Goal[] = [
            {
              id: 'accuracy-80',
              title: 'Accuracy Master',
              description: 'Achieve 80% accuracy in a session',
              target: 80,
              current: 0,
              type: 'personal',
              category: 'accuracy',
              icon: '🎯',
              color: 'text-green-600',
              completed: false
            },
            {
              id: 'speed-3s',
              title: 'Speed Demon',
              description: 'Average under 3 seconds per problem',
              target: 3000,
              current: 0,
              type: 'personal',
              category: 'speed',
              icon: '⚡',
              color: 'text-blue-600',
              completed: false
            },
            {
              id: 'sessions-7',
              title: 'Weekly Warrior',
              description: 'Complete 7 practice sessions this week',
              target: 7,
              current: 0,
              type: 'weekly',
              category: 'sessions',
              icon: '📅',
              color: 'text-purple-600',
              completed: false
            },
            {
              id: 'streak-10',
              title: 'Streak Master',
              description: 'Get a streak of 10 correct answers',
              target: 10,
              current: 0,
              type: 'personal',
              category: 'streak',
              icon: '🔥',
              color: 'text-orange-600',
              completed: false
            }
          ];
          setGoals(defaultGoals);
          localStorage.setItem('goals', JSON.stringify(defaultGoals));
        } else {
          setGoals(savedGoals);
        }

        // Generate daily challenges if none exist or if it's a new day
        const today = new Date().toDateString();
        const lastChallengeDate = localStorage.getItem('lastChallengeDate');
        
        if (lastChallengeDate !== today || savedChallenges.length === 0) {
          const challenges: DailyChallenge[] = [
            {
              id: 'daily-accuracy',
              title: 'Perfect Day',
              description: 'Achieve 90% accuracy in one session',
              target: 90,
              current: 0,
              reward: '🏆',
              difficulty: 'medium',
              completed: false
            },
            {
              id: 'daily-speed',
              title: 'Lightning Fast',
              description: 'Complete 20 problems in under 2 minutes',
              target: 20,
              current: 0,
              reward: '⚡',
              difficulty: 'hard',
              completed: false
            },
            {
              id: 'daily-streak',
              title: 'Hot Streak',
              description: 'Get a streak of 5 correct answers',
              target: 5,
              current: 0,
              reward: '🔥',
              difficulty: 'easy',
              completed: false
            }
          ];
          setDailyChallenges(challenges);
          localStorage.setItem('dailyChallenges', JSON.stringify(challenges));
          localStorage.setItem('lastChallengeDate', today);
        } else {
          setDailyChallenges(savedChallenges);
        }

        // Update progress based on recent sessions
        updateProgress();
      } catch (error) {
        console.error('Error loading goals:', error);
      } finally {
        setLoading(false);
      }
    };

    const updateProgress = () => {
      try {
        const sessions = JSON.parse(localStorage.getItem('summaries') || '[]');
        const today = new Date().toDateString();
        const thisWeek = new Date();
        thisWeek.setDate(thisWeek.getDate() - 7);

        // Update goals progress
        setGoals(prevGoals => {
          const updatedGoals = prevGoals.map(goal => {
            let current = 0;
            let completed = false;

            switch (goal.category) {
              case 'accuracy':
                const recentSessions = sessions.filter((s: any) => 
                  new Date(s.startedAt).toDateString() === today
                );
                if (recentSessions.length > 0) {
                  const maxAccuracy = Math.max(...recentSessions.map((s: any) => s.totals.accuracyPct));
                  current = maxAccuracy;
                  completed = maxAccuracy >= goal.target;
                }
                break;
              case 'speed':
                const speedSessions = sessions.filter((s: any) => 
                  new Date(s.startedAt).toDateString() === today
                );
                if (speedSessions.length > 0) {
                  const minTime = Math.min(...speedSessions.map((s: any) => s.totals.avgTimeMs));
                  current = minTime;
                  completed = minTime <= goal.target;
                }
                break;
              case 'sessions':
                const weekSessions = sessions.filter((s: any) => 
                  new Date(s.startedAt) >= thisWeek
                );
                current = weekSessions.length;
                completed = weekSessions.length >= goal.target;
                break;
              case 'streak':
                const streakSessions = sessions.filter((s: any) => 
                  new Date(s.startedAt).toDateString() === today
                );
                if (streakSessions.length > 0) {
                  const maxStreak = Math.max(...streakSessions.map((s: any) => s.totals.maxStreak));
                  current = maxStreak;
                  completed = maxStreak >= goal.target;
                }
                break;
            }

            return { ...goal, current, completed };
          });

          localStorage.setItem('goals', JSON.stringify(updatedGoals));
          return updatedGoals;
        });

        // Update daily challenges progress
        setDailyChallenges(prevChallenges => {
          const updatedChallenges = prevChallenges.map(challenge => {
            let current = 0;
            let completed = false;

            const todaySessions = sessions.filter((s: any) => 
              new Date(s.startedAt).toDateString() === today
            );

            if (todaySessions.length > 0) {
              switch (challenge.id) {
                case 'daily-accuracy':
                  const maxAccuracy = Math.max(...todaySessions.map((s: any) => s.totals.accuracyPct));
                  current = maxAccuracy;
                  completed = maxAccuracy >= challenge.target;
                  break;
                case 'daily-speed':
                  const totalProblems = todaySessions.reduce((sum: number, s: any) => sum + s.totals.attempted, 0);
                  current = totalProblems;
                  completed = totalProblems >= challenge.target;
                  break;
                case 'daily-streak':
                  const maxStreak = Math.max(...todaySessions.map((s: any) => s.totals.maxStreak));
                  current = maxStreak;
                  completed = maxStreak >= challenge.target;
                  break;
              }
            }

            return { ...challenge, current, completed };
          });

          localStorage.setItem('dailyChallenges', JSON.stringify(updatedChallenges));
          return updatedChallenges;
        });
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    };

    loadGoals();
  }, []);

  const completeGoal = async (goalId: string) => {
    await playSound('victory');
    setGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, completed: true } : goal
    ));
  };

  const completeChallenge = async (challengeId: string) => {
    await playSound('victory');
    setDailyChallenges(prev => prev.map(challenge => 
      challenge.id === challengeId ? { ...challenge, completed: true } : challenge
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading your goals...</div>
        </motion.div>
      </div>
    );
  }

  const completedGoals = goals.filter(g => g.completed).length;
  const completedChallenges = dailyChallenges.filter(c => c.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="flex items-center gap-4 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/"
            className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Goals & Challenges</h1>
            <p className="text-gray-600">Track your progress and complete daily challenges</p>
          </div>
        </motion.div>

        {/* Progress Overview */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatCard
            title="Goals Completed"
            value={completedGoals}
            icon={<Trophy className="text-yellow-500" size={20} />}
            color="text-yellow-600"
            animated={true}
          />
          <StatCard
            title="Daily Challenges"
            value={completedChallenges}
            icon={<Star className="text-purple-500" size={20} />}
            color="text-purple-600"
            animated={true}
          />
          <StatCard
            title="Total Goals"
            value={goals.length}
            icon={<Target className="text-blue-500" size={20} />}
            color="text-blue-600"
            animated={true}
          />
          <StatCard
            title="Today's Progress"
            value={Math.round(((completedGoals + completedChallenges) / (goals.length + dailyChallenges.length)) * 100)}
            suffix="%"
            icon={<TrendingUp className="text-green-500" size={20} />}
            color="text-green-600"
            animated={true}
          />
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          className="flex gap-2 mb-8 bg-white rounded-xl p-2 shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'goals'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Target size={20} />
            Personal Goals
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'challenges'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Star size={20} />
            Daily Challenges
          </button>
        </motion.div>

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {goals.map((goal, index) => (
              <motion.div
                key={goal.id}
                className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all duration-300 ${
                  goal.completed 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{goal.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                      <p className="text-gray-600">{goal.description}</p>
                    </div>
                  </div>
                  {goal.completed && (
                    <motion.div
                      className="text-green-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, type: "spring" }}
                    >
                      <CheckCircle size={24} />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-3">
                  <ProgressBar
                    value={goal.current}
                    max={goal.target}
                    label={`${goal.current}/${goal.target} ${goal.category === 'accuracy' ? '%' : goal.category === 'speed' ? 'ms' : ''}`}
                    color={goal.completed ? 'bg-green-500' : 'bg-blue-500'}
                    animated={true}
                  />
                  
                  {goal.category === 'accuracy' && (
                    <div className="flex items-center gap-4">
                      <CircularProgress
                        value={goal.current}
                        max={goal.target}
                        size={60}
                        color={goal.completed ? '#22c55e' : '#3b82f6'}
                        showPercentage={true}
                      />
                      <div className="text-sm text-gray-600">
                        {goal.completed ? '🎉 Goal achieved!' : 'Keep practicing to reach your target!'}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {dailyChallenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all duration-300 ${
                  challenge.completed 
                    ? 'border-purple-200 bg-purple-50' 
                    : 'border-gray-200'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{challenge.reward}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{challenge.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          challenge.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {challenge.difficulty}
                        </span>
                      </div>
                      <p className="text-gray-600">{challenge.description}</p>
                    </div>
                  </div>
                  {challenge.completed && (
                    <motion.div
                      className="text-purple-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, type: "spring" }}
                    >
                      <CheckCircle size={24} />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-3">
                  <ProgressBar
                    value={challenge.current}
                    max={challenge.target}
                    label={`${challenge.current}/${challenge.target}`}
                    color={challenge.completed ? 'bg-purple-500' : 'bg-blue-500'}
                    animated={true}
                  />
                  
                  <div className="text-sm text-gray-600">
                    {challenge.completed ? '🎉 Challenge completed! Great job!' : 'Complete this challenge to earn your reward!'}
                  </div>
                </div>
              </motion.div>
            ))}

            {dailyChallenges.length === 0 && (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Challenges Today</h3>
                <p className="text-gray-600">Check back tomorrow for new daily challenges!</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
