import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Zap, Activity, Battery, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNeural } from '../lib/NeuralContext';

export const ComputeDashboard: React.FC<{ t: any }> = ({ t }) => {
  const { intelligence, energy, maxEnergy, loadFactor, status, difficulty, startTraining, restoreEnergy } = useNeural();

  const energyPercent = (energy / maxEnergy) * 100;

  const modes = [
    { name: 'Low', load: 0.2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { name: 'Balanced', load: 0.5, color: 'text-emerald-green', bg: 'bg-emerald-green/10' },
    { name: 'Neural Force', load: 0.9, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="px-4 pt-6 space-y-6 max-w-md mx-auto">
      {/* Header Status */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">
            Neural <span className="text-emerald-green">Compute</span>
          </h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'TRAINING' ? 'bg-emerald-green shadow-[0_0_8px_rgba(0,255,136,0.8)]' : (status === 'COOLING' ? 'bg-red-500' : 'bg-white/20')}`} />
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              Status: {status}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-white/30 font-mono uppercase">Difficulty</div>
          <div className="text-white font-mono font-bold tracking-tighter">{difficulty.toFixed(3)}x</div>
        </div>
      </div>

      {/* Main Intelligence Display */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-6 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Cpu className="w-24 h-24 text-emerald-green" />
        </div>
        
        <div className="relative z-10">
          <span className="text-[10px] font-mono text-emerald-green uppercase tracking-[0.3em] block mb-2">Network Intelligence</span>
          <div className="text-4xl font-black text-white tracking-tighter flex items-center space-x-2">
            <span>{intelligence.toFixed(6)}</span>
            <span className="text-lg text-emerald-green/60">PBN</span>
          </div>
          <p className="text-white/40 text-[10px] mt-4 font-mono uppercase leading-relaxed">
            Allocated mobile compute resources to global neural backbone.
          </p>
        </div>
      </motion.div>

      {/* Energy & Load Section */}
      <div className="grid grid-cols-1 gap-4">
        {/* Energy Bar */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Battery className={`w-4 h-4 ${energy < 500 ? 'text-red-500 animate-pulse' : 'text-emerald-green'}`} />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Core Energy</span>
            </div>
            <span className="text-xs font-mono text-white/60">{Math.round(energy)} / {maxEnergy}</span>
          </div>
          
          <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex p-0.5 border border-white/5">
            <motion.div 
              initial={false}
              animate={{ width: `${energyPercent}%` }}
              className={`h-full rounded-full ${energyPercent < 20 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-emerald-green shadow-[0_0_15px_rgba(0,255,136,0.3)]'}`}
            />
          </div>

          {status === 'COOLING' && (
            <div className="flex items-center space-x-2 text-red-500 text-[10px] uppercase font-bold justify-center bg-red-500/5 py-2 rounded-lg border border-red-500/10">
              <AlertTriangle className="w-3 h-3" />
              <span>Thermal limit reached. Training paused.</span>
            </div>
          )}
        </div>

        {/* Load Selection */}
        <div className="grid grid-cols-3 gap-3">
          {modes.map((mode) => (
            <button
              key={mode.name}
              disabled={status === 'COOLING'}
              onClick={() => startTraining(mode.name as any)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 ${
                loadFactor === mode.load && status === 'TRAINING'
                  ? 'border-emerald-green bg-emerald-green/5 shadow-[0_0_20px_rgba(0,255,136,0.1)]'
                  : 'border-white/5 bg-[#0c0c0c] disabled:opacity-50'
              }`}
            >
              <div className={`text-[10px] font-black uppercase mb-1 ${mode.color}`}>{mode.name}</div>
              <div className="text-[9px] text-white/40 font-mono">{(mode.load * 100)}% Load</div>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button 
          onClick={restoreEnergy}
          className="w-full bg-gold/10 border border-gold/20 py-4 rounded-xl flex items-center justify-center space-x-3 group active:scale-95 transition-all"
        >
          <RefreshCw className="w-5 h-5 text-gold group-active:rotate-180 transition-transform duration-500" />
          <div className="text-left">
            <div className="text-xs font-bold text-white uppercase tracking-widest leading-none">Instant Restoration</div>
            <div className="text-[10px] text-gold/60 font-mono mt-1">Cost: 0.500 PBN</div>
          </div>
        </button>

        <div className="bg-[#0c0c0c] border border-white/5 p-4 rounded-2xl font-mono text-[9px] text-white/30 space-y-1">
          <div className="flex justify-between items-center">
            <span className="flex items-center space-x-1"><Activity className="w-3 h-3 text-emerald-green" /> <span>SYNC_LOG</span></span>
            <span className="text-emerald-green">ONLINE</span>
          </div>
          <div className="opacity-60 truncate">Initializing spectral gradients... [OK]</div>
          <div className="opacity-60 truncate">Propagating back-tensors... [OK]</div>
          <div className="opacity-60 truncate">Synchronized {Math.floor(intelligence * 100000)} gradients.</div>
        </div>
      </div>
    </div>
  );
};
