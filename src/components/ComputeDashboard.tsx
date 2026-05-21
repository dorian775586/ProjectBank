import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Zap, Activity, Battery, RefreshCw, AlertTriangle, ShieldCheck, Globe, History } from 'lucide-react';
import { useNeural } from '../lib/NeuralContext';

export const ComputeDashboard: React.FC<{ t: any }> = ({ t }) => {
  const { intelligence, energy, maxEnergy, loadFactor, status, difficulty, startTraining, stopTraining, restoreEnergy } = useNeural();

  const energyPercent = (energy / maxEnergy) * 100;

  const modes = [
    { name: 'Low', load: 0.2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { name: 'Balanced', load: 0.5, color: 'text-emerald-green', bg: 'bg-emerald-green/10' },
    { name: 'Neural Force', load: 0.9, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="px-5 pt-8 pb-32 space-y-8 max-w-md mx-auto font-mono text-white selection:bg-emerald-green selection:text-black">
      {/* Header Profile */}
      <section className="space-y-4">
        <h3 className="text-[10px] text-white/40 uppercase tracking-[2px] font-bold">Neural Profile</h3>
        
        <div className="flex justify-between items-end border-b border-white/5 pb-4">
          <span className="text-sm text-white/60">Intelligence</span>
          <div className="text-2xl font-bold tracking-tighter flex items-center space-x-2">
            <span>{intelligence.toFixed(intelligence > 10 ? 2 : 6)}</span>
            <span className="text-xs text-emerald-green">PBN</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-[10px] uppercase font-bold">
            <span className="text-white/60">Core Capacity</span>
            <span className="text-emerald-green">{Math.round(energy)} / {maxEnergy}</span>
          </div>
          <div className="h-4 w-full bg-white/5 rounded-sm overflow-hidden flex border border-white/10 p-0.5">
            <motion.div 
              initial={false}
              animate={{ width: `${energyPercent}%` }}
              className={`h-full rounded-[1px] transition-colors ${
                energyPercent < 20 ? 'bg-red-500' : 'bg-emerald-green'
              }`}
            />
          </div>
        </div>
      </section>

      {/* Network Information */}
      <section className="space-y-4">
        <h3 className="text-[10px] text-white/40 uppercase tracking-[2px] font-bold">Network Information</h3>
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase mb-1">Difficulty</span>
            <span className="font-bold">{difficulty.toFixed(3)}x</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase mb-1">Compute Load</span>
            <span className="font-bold">{(loadFactor * 100).toFixed(0)}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase mb-1">Epoch</span>
            <span className="font-bold">#4,281</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase mb-1">Gradients</span>
            <span className="font-bold text-emerald-green">{(intelligence * 1000).toFixed(0)}k</span>
          </div>
        </div>
      </section>

      {/* Computing Control */}
      <section className="space-y-4">
        <h3 className="text-[10px] text-white/40 uppercase tracking-[2px] font-bold">Compute Control</h3>
        <div className="bg-white/5 border border-white/10 p-5 rounded-lg space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-white/30 uppercase mb-1">Engine Status</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${status === 'TRAINING' ? 'bg-emerald-green animate-pulse' : 'bg-white/20'}`} />
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  status === 'TRAINING' ? 'bg-emerald-green/20 text-emerald-green' : 'bg-white/10 text-white/60'
                }`}>
                  {status}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-white/30 uppercase mb-1">Computation</span>
              <span className="text-xs font-bold">{status === 'TRAINING' ? 'ACTIVE' : 'IDLE'}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {modes.map((mode) => (
              <button
                key={mode.name}
                disabled={status === 'COOLING'}
                onClick={() => startTraining(mode.name as any)}
                className={`text-[9px] uppercase font-bold py-2 border transition-all ${
                  loadFactor === mode.load && status === 'TRAINING'
                    ? 'border-emerald-green text-emerald-green bg-emerald-green/5'
                    : 'border-white/10 text-white/40 hover:border-white/30'
                }`}
              >
                {mode.name}
              </button>
            ))}
          </div>

          <button 
            onClick={() => status === 'TRAINING' ? stopTraining() : startTraining('Balanced')}
            className={`w-full py-4 rounded-md font-black uppercase tracking-[2px] transition-all flex items-center justify-center space-x-2 ${
              status === 'TRAINING' 
                ? 'bg-red-500/20 border border-red-500/30 text-red-500' 
                : 'bg-emerald-green text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(0,255,136,0.2)]'
            }`}
          >
            <Zap className={`w-4 h-4 ${status === 'TRAINING' ? 'hidden' : ''}`} />
            <span>{status === 'TRAINING' ? 'Execute: STOP' : 'Execute: START COMPUTATION'}</span>
          </button>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="space-y-4">
        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-white/40 tracking-widest">
          <span>Recent Computations</span>
          <History className="w-3 h-3" />
        </div>
        <div className="space-y-2">
          <BlockItem 
            id="#4281" 
            reward="0.00042" 
            status="Verified" 
            user="NODE_01"
            color="bg-emerald-green/20 text-emerald-green"
          />
          <BlockItem 
            id="#4280" 
            reward="0.05120" 
            status="Mined" 
            user="LOCAL_CPU"
            color="bg-blue-500/20 text-blue-400"
          />
          <BlockItem 
            id="#4279" 
            reward="0" 
            status="Stale" 
            user="NODE_02"
            color="bg-white/10 text-white/30"
          />
        </div>
      </section>

      {/* Maintenance */}
      <button 
        onClick={restoreEnergy}
        className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded hover:bg-white/10 transition-colors group"
      >
        <div className="flex items-center space-x-3 text-white/60">
          <ShieldCheck className="w-5 h-5 text-gold" />
          <span className="text-xs uppercase font-bold font-mono">Maintenance Restoration</span>
        </div>
        <span className="text-[10px] text-white/30 font-mono">-0.500 PBN</span>
      </button>
    </div>
  );
};

const BlockItem = ({ id, reward, status, user, color }: any) => (
  <div className="group space-y-1">
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <span className="text-[10px] font-bold text-white/80">Block {id}</span>
        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase ${color}`}>
          {status} {'->'} {reward}
        </span>
      </div>
      <span className="text-[9px] text-white/20">04:{Math.floor(Math.random() * 59)}</span>
    </div>
    <div className="flex items-center space-x-2 text-[9px] text-white/30 border-l border-white/10 pl-3 ml-2">
      <div className="w-1.5 h-[1px] bg-white/10" />
      <span>Created by {user}</span>
    </div>
  </div>
);
