import { doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User } from 'firebase/auth';

export interface UserSettings {
  ops: { [k: string]: boolean };
  digits: Record<string, number>;
  lengthSec: 30 | 60 | 120;
}

export interface SessionSummary {
  id: string;
  startedAt: string;
  endedAt: string;
  settings: {
    skills: string[];
    difficulty: string;
    lengthSec: 30 | 60 | 120;
    seed: string;
  };
  totals: {
    attempted: number;
    correct: number;
    accuracyPct: number;
    avgTimeMs: number;
  };
  perSkill: any;
}

export class DataSyncService {
  private static instance: DataSyncService;
  
  static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  // Sync user settings to Firestore
  async syncUserSettings(user: User, settings: UserSettings): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        settings,
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Error syncing user settings:', error);
      throw error;
    }
  }

  // Get user settings from Firestore
  async getUserSettings(user: User): Promise<UserSettings | null> {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        return userData.settings || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }

  // Save session summary to Firestore
  async saveSessionSummary(user: User, summary: SessionSummary): Promise<void> {
    try {
      const sessionRef = doc(db, 'users', user.uid, 'sessions', summary.id);
      await setDoc(sessionRef, {
        ...summary,
        userId: user.uid,
        savedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving session summary:', error);
      throw error;
    }
  }

  // Get user's session history from Firestore
  async getUserSessions(user: User, limitCount: number = 10): Promise<SessionSummary[]> {
    try {
      const sessionsRef = collection(db, 'users', user.uid, 'sessions');
      const q = query(sessionsRef, orderBy('startedAt', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as SessionSummary);
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  // Sync local data to Firestore when user logs in
  async syncLocalDataToFirestore(user: User): Promise<void> {
    try {
      // Sync settings
      const localSettings = localStorage.getItem('lastSettings');
      if (localSettings) {
        const settings = JSON.parse(localSettings);
        await this.syncUserSettings(user, settings);
      }

      // Sync recent sessions
      const localSummaries = localStorage.getItem('summaries');
      if (localSummaries) {
        const summaries = JSON.parse(localSummaries);
        for (const summary of summaries.slice(0, 5)) { // Sync last 5 sessions
          await this.saveSessionSummary(user, summary);
        }
      }
    } catch (error) {
      console.error('Error syncing local data to Firestore:', error);
    }
  }

  // Load user data from Firestore to localStorage
  async loadUserDataToLocal(user: User): Promise<void> {
    try {
      // Load settings
      const settings = await this.getUserSettings(user);
      if (settings) {
        localStorage.setItem('ops', JSON.stringify(settings.ops));
        localStorage.setItem('digits', JSON.stringify(settings.digits));
        localStorage.setItem('lengthSec', String(settings.lengthSec));
        localStorage.setItem('lastSettings', JSON.stringify(settings));
      }

      // Load session history
      const sessions = await this.getUserSessions(user, 10);
      if (sessions.length > 0) {
        localStorage.setItem('summaries', JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error loading user data to local:', error);
    }
  }
}
