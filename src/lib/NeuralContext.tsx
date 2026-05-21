import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

interface NeuralBlock {
  id: string;
  reward: number;
  timestamp: string;
  mode: string;
}

interface NeuralState {
  intelligence: number;
  workAccumulated: number;
  blocks: NeuralBlock[];
  energy: number;
  maxEnergy: number;
  loadFactor: number;
  status: 'IDLE' | 'TRAINING' | 'COOLING';
  difficulty: number;
  lastUpdate: number;
  globalMined: number;
}

interface NeuralContextType extends NeuralState {
  startTraining: (mode: 'Low' | 'Balanced' | 'Neural Force') => void;
  stopTraining: () => void;
  restoreEnergy: () => void;
  setIntelligence: (val: number) => void;
  totalSupply: number;
}

const TOTAL_SUPPLY = 1000000000; // 1 Billion NXS

const NeuralContext = createContext<NeuralContextType | undefined>(undefined);

export const NeuralProvider: React.FC<{ children: React.ReactNode; userId: string | null }> = ({ children, userId }) => {
  const [state, setState] = useState<NeuralState>(() => {
    const savedEnergy = typeof window !== 'undefined' ? localStorage.getItem('neural_energy') : null;
    const savedLastUpdate = typeof window !== 'undefined' ? localStorage.getItem('neural_last_update') : null;
    const savedGlobalMined = typeof window !== 'undefined' ? localStorage.getItem('neural_global_mined') : null;

    let energy = savedEnergy ? parseFloat(savedEnergy) : 3600;
    const lastUpdate = savedLastUpdate ? parseInt(savedLastUpdate) : Date.now();
    const globalMined = savedGlobalMined ? parseFloat(savedGlobalMined) : 234500600; // Start at 234M (23%)

    // Offline Energy Recovery
    if (lastUpdate < Date.now()) {
      const deltaSeconds = (Date.now() - lastUpdate) / 1000;
      const recoveryRate = 1.0; // 3600 units in 60 minutes = 1 unit per second
      // User requested energy to recover even offline.
      energy = Math.min(3600, energy + recoveryRate * deltaSeconds);
    }

    return {
      intelligence: 0,
      workAccumulated: 0,
      blocks: [],
      energy: energy,
      maxEnergy: 3600,
      loadFactor: 0,
      status: 'IDLE',
      difficulty: 1.0,
      lastUpdate: Date.now(),
      globalMined: globalMined
    };
  });

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('neural_energy', state.energy.toString());
    localStorage.setItem('neural_last_update', state.lastUpdate.toString());
    localStorage.setItem('neural_global_mined', state.globalMined.toString());
  }, [state.energy, state.lastUpdate, state.globalMined]);

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

  const stopTraining = () => {
    setState(prev => ({
      ...prev,
      status: 'IDLE',
      loadFactor: 0,
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
      status: prev.energy <= 0 ? 'IDLE' : 'IDLE'
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
        let { energy, intelligence, status, loadFactor, difficulty, workAccumulated, blocks, globalMined } = prev;

        // Simulated Global Supply Growth (everyone mining)
        // We increment this locally between real DB syncs for visual smoothness
        const globalGrowthRate = 15.5; 
        globalMined += globalGrowthRate * delta;

        // Difficulty depends on % of total supply mined
        const minedPercentage = globalMined / TOTAL_SUPPLY;
        difficulty = 1.0 + (minedPercentage * 24.0); // Drastically increased difficulty scaling

        // Energy logic
        if (status === 'TRAINING') {
          // AGGRESSIVE DRAIN: 60/sec for Force, 30 for Balanced
          const drainRate = loadFactor === 0.9 ? 60 : (loadFactor === 0.5 ? 30 : 10);
          energy = Math.max(0, energy - drainRate * delta);
          
          if (energy <= 0) {
            status = 'COOLING';
          } else {
            const baseRate = 0.005; // Base work unit
            const workDone = (loadFactor * baseRate * delta) / difficulty;
            workAccumulated += workDone;
            
            // Block mining threshold
            const threshold = 0.002; 
            if (workAccumulated >= threshold) {
              const reward = workAccumulated;
              intelligence += reward;
              workAccumulated = 0;
              
              // Add to history
              const newBlock: NeuralBlock = {
                id: `#${Math.floor(Math.random() * 9000) + 1000}`,
                reward,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                mode: Object.keys({ 'Low': 0.2, 'Balanced': 0.5, 'Neural Force': 0.9 }).find(k => (({ 'Low': 0.2, 'Balanced': 0.5, 'Neural Force': 0.9 } as any)[k]) === loadFactor) || 'Compute'
              };
              blocks = [newBlock, ...blocks.slice(0, 9)];
            }
          }
        } else {
          // Passive recovery - 3600 units in 60 minutes = 1 unit per second
          energy = Math.min(prev.maxEnergy, energy + 1 * delta);
          if (status === 'COOLING' && energy >= prev.maxEnergy * 0.1) {
            status = 'IDLE';
          }
        }

        return {
          ...prev,
          energy,
          intelligence,
          status,
          difficulty,
          workAccumulated,
          blocks,
          globalMined,
          lastUpdate: now
        };
      });
    }, 500); // Faster tick for smoother drain

    return () => clearInterval(timer);
  }, []);

  // Sync Global Supply from Database every 10 seconds
  useEffect(() => {
    const fetchGlobalMined = async () => {
      try {
        const { data, error } = await supabase.rpc('get_total_mined');
        if (!error && data !== null) {
          setState(prev => ({ ...prev, globalMined: parseFloat(data) }));
        }
      } catch (err) {
        console.error("Global supply sync failed", err);
      }
    };

    fetchGlobalMined();
    const interval = setInterval(fetchGlobalMined, 10000);
    return () => clearInterval(interval);
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

  // Hardware Load Simulation: Actively burns CPU cycles based on loadFactor
  useEffect(() => {
    if (state.status !== 'TRAINING') return;

    let rafId: number;
    const load = state.loadFactor; // 0.2, 0.5, 0.9

    const loadWork = () => {
      const start = performance.now();
      // Target computation duration per frame (~16ms)
      // High load factor means we stay busy longer each frame
      const targetBusyMs = load * 14.5; 
      
      while (performance.now() - start < targetBusyMs) {
        // Intensive math to stress the physical processor
        Math.sqrt(Math.cos(Math.tan(Math.random() * Math.random())));
      }
      
      rafId = requestAnimationFrame(loadWork);
    };

    rafId = requestAnimationFrame(loadWork);
    return () => cancelAnimationFrame(rafId);
  }, [state.status, state.loadFactor]);

  return (
    <NeuralContext.Provider value={{ ...state, startTraining, stopTraining, restoreEnergy, setIntelligence, totalSupply: TOTAL_SUPPLY }}>
      {children}
    </NeuralContext.Provider>
  );
};

export const useNeural = () => {
  const context = useContext(NeuralContext);
  if (!context) throw new Error('useNeural must be used within NeuralProvider');
  return context;
};
