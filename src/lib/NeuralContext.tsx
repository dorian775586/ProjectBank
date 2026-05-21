import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

interface NeuralState {
  intelligence: number;
  energy: number;
  maxEnergy: number;
  loadFactor: number; // 0.2, 0.5, 0.9
  status: 'IDLE' | 'TRAINING' | 'COOLING';
  difficulty: number;
  lastUpdate: number;
}

interface NeuralContextType extends NeuralState {
  startTraining: (mode: 'Low' | 'Balanced' | 'Neural Force') => void;
  restoreEnergy: () => void;
  setIntelligence: (val: number) => void;
}

const NeuralContext = createContext<NeuralContextType | undefined>(undefined);

export const NeuralProvider: React.FC<{ children: React.ReactNode; userId: string | null }> = ({ children, userId }) => {
  const [state, setState] = useState<NeuralState>({
    intelligence: 0,
    energy: 3600,
    maxEnergy: 3600,
    loadFactor: 0,
    status: 'IDLE',
    difficulty: 1.0,
    lastUpdate: Date.now(),
  });

  // Load initial intelligence from Supabase (mapped to coins for now)
  useEffect(() => {
    if (userId) {
      const loadProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', userId)
          .maybeSingle();
        if (data) {
          setState(prev => ({ ...prev, intelligence: data.coins || 0 }));
        }
      };
      loadProfile();
    }
  }, [userId]);

  const startTraining = (mode: 'Low' | 'Balanced' | 'Neural Force') => {
    const loads = { 'Low': 0.2, 'Balanced': 0.5, 'Neural Force': 0.9 };
    if (state.energy <= 0) return;
    setState(prev => ({
      ...prev,
      loadFactor: loads[mode],
      status: 'TRAINING',
      lastUpdate: Date.now()
    }));
  };

  const restoreEnergy = async () => {
    if (state.intelligence < 0.5) return;
    
    const newBalance = state.intelligence - 0.5;
    setState(prev => ({
      ...prev,
      energy: prev.maxEnergy,
      intelligence: newBalance,
      status: prev.energy <= 0 ? 'IDLE' : prev.status
    }));

    if (userId) {
      await supabase.from('profiles').update({ coins: newBalance }).eq('id', userId);
    }
  };

  const setIntelligence = (val: number) => {
    setState(prev => ({ ...prev, intelligence: val }));
  };

  // Main loop for computation and energy
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => {
        const now = Date.now();
        const delta = (now - prev.lastUpdate) / 1000;
        let { energy, intelligence, status, loadFactor, difficulty } = prev;

        // Energy logic
        if (status === 'TRAINING') {
          const drainRate = loadFactor === 0.9 ? 1 : (loadFactor === 0.5 ? 0.5 : 0.1);
          energy = Math.max(0, energy - drainRate * delta);
          
          if (energy <= 0) {
            status = 'COOLING';
          } else {
            // Formula: reward_per_sec = (load_factor * base_rate) / difficulty
            const baseRate = 0.0001;
            const reward = (loadFactor * baseRate * delta) / difficulty;
            intelligence += reward;
            
            // Subtle difficulty drift
            difficulty = Math.min(2.0, difficulty + 0.00001 * delta);
          }
        } else {
          // Passive recovery
          energy = Math.min(prev.maxEnergy, energy + 1 * delta);
          if (status === 'COOLING' && energy >= prev.maxEnergy * 0.2) {
            status = 'IDLE';
          }
        }

        return {
          ...prev,
          energy,
          intelligence,
          status,
          difficulty,
          lastUpdate: now
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sync balance to Supabase periodically
  useEffect(() => {
    if (userId && state.intelligence > 0) {
      const sync = async () => {
        await supabase.from('profiles').update({ coins: state.intelligence }).eq('id', userId);
      };
      const syncInterval = setInterval(sync, 10000); // Every 10 sec
      return () => clearInterval(syncInterval);
    }
  }, [userId, state.intelligence]);

  return (
    <NeuralContext.Provider value={{ ...state, startTraining, restoreEnergy, setIntelligence }}>
      {children}
    </NeuralContext.Provider>
  );
};

export const useNeural = () => {
  const context = useContext(NeuralContext);
  if (!context) throw new Error('useNeural must be used within NeuralProvider');
  return context;
};
