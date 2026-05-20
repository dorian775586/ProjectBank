/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  ShieldCheck, 
  Info, 
  User, 
  Zap, 
  Cpu, 
  ArrowUpRight, 
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language } from './translations';
import { supabase } from './lib/supabase';

// --- Constants & Types ---

type Tab = 'dashboard' | 'roadmap' | 'info' | 'profile';

interface RoadmapPhase {
  id: number;
  title: string;
  subtitle: string;
  status: 'Active' | 'Locked';
  items: string[];
}

const RoadmapItem = ({ phase, isFirst, isLast, t }: { phase: RoadmapPhase, isFirst: boolean, isLast: boolean, t: any }) => {
  const [isExpanded, setIsExpanded] = useState(phase.status === 'Active');
  const isActive = phase.status === 'Active';

  return (
    <div className="relative pl-10 pb-10 group">
      {/* Vertical Line */}
      {!isLast && (
        <div className={`absolute left-[15px] top-6 bottom-0 w-0.5 ${isActive ? 'bg-gradient-to-b from-emerald-green to-white/5' : 'bg-white/5'}`} />
      )}
      
      {/* Node Dot */}
      <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 z-10 flex items-center justify-center transition-all duration-500 ${
        isActive 
          ? 'bg-black border-emerald-green shadow-[0_0_15px_rgba(0,255,136,0.5)]' 
          : 'bg-black border-white/10'
      }`}>
        {isActive ? (
          <div className="w-2 h-2 bg-emerald-green rounded-full animate-pulse" />
        ) : (
          <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
        )}
      </div>

      {/* Card Content */}
      <motion.div 
        layout
        onClick={() => setIsExpanded(!isExpanded)}
        className={`bg-[#0c0c0c] border rounded-2xl p-5 cursor-pointer transition-all active:scale-[0.99] ${
          isActive ? 'border-emerald-green/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]' : 'border-white/5'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <span className={`font-mono text-[9px] uppercase tracking-[0.2em] mb-1 block ${isActive ? 'text-emerald-green' : 'text-white/30'}`}>
              {phase.status === 'Active' ? t('status_active') : t('status_locked')}
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">{phase.title}</h3>
            <p className="text-white/40 text-[10px] uppercase font-mono">{phase.subtitle}</p>
          </div>
          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            <Plus className={`w-4 h-4 ${isActive ? 'text-gold' : 'text-white/20'}`} />
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-5 mt-4 border-t border-white/5 space-y-3">
                {phase.items.map((item, i) => (
                    <div key={`phase-${phase.id}-item-${i}`} className="flex items-center space-x-3">
                      <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-green' : 'bg-white/20'}`} />
                      <span className="text-xs text-white/60 font-medium">{item}</span>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

interface Lender {
  id: string;
  name: string;
  amount: number;
  rate: number;
  term: string;
  isAI: boolean;
}

// --- Sub-components ---

const NavItem = ({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center space-y-1 transition-all flex-1 py-2 ${isActive ? 'text-emerald-green' : 'text-white/40'}`}
  >
    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
    <span className={`text-[10px] font-medium tracking-tight ${isActive ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
    {isActive && (
      <motion.div 
        layoutId="nav-indicator"
        className="absolute bottom-1 w-1 h-1 bg-emerald-green rounded-full shadow-[0_0_8px_rgba(0,255,136,0.8)]"
      />
    )}
  </button>
);

const PurchaseModal = ({ isOpen, onClose, onBuy, t }: { isOpen: boolean, onClose: () => void, onBuy: () => void, t: any }) => {
  const [amount, setAmount] = useState(100000);
  const cost = amount * 0.01;

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-[#0f0f0f] w-full max-w-md rounded-t-[32px] border-t border-white/10 p-6 pb-12 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
        
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-white mb-2">{t('refill_balance')}</h3>
          <p className="text-white/50 text-xs">{t('standard_rate')}</p>
        </div>

        <div className="space-y-8">
          <div className="bg-black/40 rounded-2xl p-6 border border-white/5">
            <div className="flex justify-between items-end mb-4">
              <span className="text-sm font-mono text-emerald-green">{t('amount')}</span>
              <span className="text-2xl font-bold text-white">{amount.toLocaleString()} <span className="text-xs text-white/40">$BANK</span></span>
            </div>
            
            <input 
              type="range" 
              min="1000" 
              max="1000000" 
              step="1000"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
            />
            
            <div className="flex justify-between mt-2 font-mono text-[10px] text-white/30 uppercase tracking-widest">
              <span>1K</span>
              <span>1M</span>
            </div>
          </div>

          <div className="flex justify-between items-center px-4">
            <span className="text-sm text-white/60">{t('total_cost')}</span>
            <span className="text-2xl font-bold text-emerald-green">${cost.toLocaleString()} <span className="text-xs text-white/40">USD</span></span>
          </div>

          <button 
            onClick={onBuy}
            className="w-full bg-gold py-4 rounded-xl text-black font-bold flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform"
          >
            <Wallet className="w-5 h-5 stroke-[2.5]" />
            <span>{t('buy_now')}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SystemTestModal = ({ lender, onClose, t }: { lender: Lender | null, onClose: () => void, t: any }) => {
  if (!lender) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
    >
      <motion.div 
        scale={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#111] border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center"
      >
        <div className="w-16 h-16 bg-emerald-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="text-emerald-green w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{t('system_test_title')}</h3>
        <p className="text-white/60 text-sm mb-8 leading-relaxed">
          Requesting {lender.amount.toLocaleString()} USD from <span className="text-emerald-green font-bold">{lender.name}</span>.
          <br /><br />
          {t('system_test_desc')}
        </p>
        <button 
          onClick={onClose}
          className="w-full bg-white/5 border border-white/10 py-3 rounded-xl text-white font-medium active:scale-[0.98] transition-transform"
        >
          {t('close_session')}
        </button>
      </motion.div>
    </motion.div>
  );
};

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [balance, setBalance] = useState(0);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
  const [userData, setUserData] = useState({ name: 'User', id: '00000' });
  const [lang, setLang] = useState<Language>('en');

  const t = (key: keyof typeof translations['en']) => translations[lang][key] || translations['en'][key];

  const ROADMAP: RoadmapPhase[] = useMemo(() => [
    {
      id: 1,
      title: `${lang === 'ru' ? 'Этап' : 'Phase'} 1: Genesis`,
      subtitle: lang === 'ru' ? "Зарождение и ядро инфраструктуры" : "Inception & Core Infrastructure",
      status: "Active",
      items: lang === 'ru' 
        ? ["Запуск WebApp", "Private Seed раунд @ 0.01 USD", "Развертывание хранилищ обеспечения", "Настройка экосистемы Telegram ботов"]
        : ["WebApp Launch", "Private Seed Round @ 0.01 USD", "Collateral Vaults Deployment", "Telegram Bot Ecosystem Setup"]
    },
    {
      id: 2,
      title: `${lang === 'ru' ? 'Этап' : 'Phase'} 2: Liquidity`,
      subtitle: lang === 'ru' ? "Глобальная интеграция и аудиты" : "Global Integration & Audits",
      status: "Locked",
      items: lang === 'ru'
        ? ["Интеграция API Binance и OKX", "Мгновенная выдача займов в USDT", "Аудит безопасности Tier-1", "Награды для поставщиков ликвидности"]
        : ["Binance & OKX API Integration", "Instant USDT Loan Issuance", "Tier-1 Security Audit", "Liquidity Provider Rewards"]
    },
    {
      id: 3,
      title: `${lang === 'ru' ? 'Этап' : 'Phase'} 3: Domination`,
      subtitle: lang === 'ru' ? "Листинг на биржах и потребительские финансы" : "Exchange Listings & Consumer Finance",
      status: "Locked",
      items: lang === 'ru'
        ? ["Листинг на CEX Tier-1", "Виртуальные и физические дебетовые карты", "Расширенная маржинальная поддержка", "Запуск Стейкинга v2.0"]
        : ["Tier-1 CEX Listing", "Virtual & Physical Debit Cards", "Advanced Margin Support", "Staking v2.0 Launch"]
    },
    {
      id: 4,
      title: `${lang === 'ru' ? 'Этап' : 'Phase'} 4: Global Banking`,
      subtitle: lang === 'ru' ? "Масштабирование и децентрализация" : "Scale & Decentralization",
      status: "Locked",
      items: lang === 'ru'
        ? ["Активация управления DAO", "Кроссчейн мосты (SOL/ETH/BASE)", "Шлюз для институционального кредитования", "Глобальные банковские лицензии"]
        : ["DAO Governance Activation", "Cross-chain Bridges (SOL/ETH/BASE)", "Institutional Lending Gateway", "Global Banking Licenses"]
    }
  ], [lang]);

  const LENDERS: Lender[] = useMemo(() => [
    { id: '1', name: lang === 'ru' ? 'Альфа Бот' : 'Alpha Bot', amount: 5000, rate: 4.5, term: lang === 'ru' ? '30 Дней' : '30 Days', isAI: true },
    { id: '2', name: 'Zion LP', amount: 12000, rate: 3.2, term: lang === 'ru' ? '90 Дней' : '90 Days', isAI: false },
    { id: '3', name: 'CyberNode', amount: 25000, rate: 5.8, term: lang === 'ru' ? '180 Дней' : '180 Days', isAI: true },
    { id: '4', name: 'GigaWallet', amount: 800, rate: 12.0, term: lang === 'ru' ? '14 Дней' : '14 Days', isAI: false },
    { id: '5', name: 'Nexus AI', amount: 50000, rate: 2.5, term: lang === 'ru' ? '365 Дней' : '365 Days', isAI: true },
    { id: '6', name: 'EvoLend', amount: 3500, rate: 6.5, term: lang === 'ru' ? '60 Дней' : '60 Days', isAI: true },
    { id: '7', name: 'PrimeCap', amount: 15000, rate: 4.0, term: lang === 'ru' ? '90 Дней' : '90 Days', isAI: false },
    { id: '8', name: lang === 'ru' ? 'Эфир Бот' : 'Aether Bot', amount: 1200, rate: 15.0, term: lang === 'ru' ? '7 Дней' : '7 Days', isAI: true },
    { id: '9', name: 'MetaVault', amount: 45000, rate: 3.8, term: lang === 'ru' ? '120 Дней' : '120 Days', isAI: false },
    { id: '10', name: lang === 'ru' ? 'БыстрыйЗайм' : 'SwiftLoan', amount: 2500, rate: 8.2, term: lang === 'ru' ? '30 Дней' : '30 Days', isAI: true },
    { id: '11', name: 'IronClad', amount: 30000, rate: 2.1, term: lang === 'ru' ? '1 Год' : '1 Year', isAI: false },
    { id: '12', name: 'BitStream', amount: 500, rate: 14.5, term: lang === 'ru' ? '5 Дней' : '5 Days', isAI: true },
    { id: '13', name: 'Nova Flow', amount: 18000, rate: 4.9, term: lang === 'ru' ? '90 Дней' : '90 Days', isAI: true },
    { id: '14', name: 'Orbit LP', amount: 9500, rate: 5.2, term: lang === 'ru' ? '60 Дней' : '60 Days', isAI: false },
    { id: '15', name: 'QuantumX', amount: 50000, rate: 3.0, term: lang === 'ru' ? '365 Дней' : '365 Days', isAI: true },
  ], [lang]);

  useEffect(() => {
    // Initialize Telegram Web App
    const tg = (window as any).Telegram?.WebApp;

    const syncUserWithSupabase = async (user: any) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .upsert({ 
            id: user.id.toString(), 
            name: user.first_name || 'User',
            coins: 0, // Initial balance
            updated_at: new Date().toISOString()
          })
          .select();

        if (error) {
          alert(`Supabase Sync Error: ${error.message}\nTable: profiles\nCode: ${error.code}`);
        } else {
          console.log('Supabase Sync Success:', data);
          // Show success alert only on first load as requested
          alert(`Supabase Status: Connected as ${user.first_name}. Success code: 200`);
        }
      } catch (err: any) {
        alert(`Supabase Exception: ${err.message}`);
      }
    };

    if (tg) {
      // 1. Core ready signal
      tg.ready();
      
      // 2. Hard expand & settings
      tg.expand();
      tg.isVerticalSwipesEnabled = false;
      
      // 3. Theme coordination
      tg.setHeaderColor('#000000');
      tg.setBackgroundColor('#000000');

      // 4. Robust expansion fallback
      const expandTimer = setTimeout(() => {
        if (!tg.isExpanded) {
          tg.expand();
        }
      }, 500);

      // Detect language
      if (tg.initDataUnsafe?.user?.language_code === 'ru') {
        setLang('ru');
      }

      // Detect user data & Sync
      if (tg.initDataUnsafe?.user) {
        const tgUser = tg.initDataUnsafe.user;
        setUserData({
          name: tgUser.first_name || 'User',
          id: tgUser.id.toString() || '00000'
        });
        
        // Trigger sync
        syncUserWithSupabase(tgUser);
      } else {
        alert("Debug: No Telegram User Data found. Check if running inside Telegram.");
      }

      return () => clearTimeout(expandTimer);
    }
  }, []);

  const handleBuy = () => {
    // Mock syncing process
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.showPopup) {
      tg.showPopup({
        title: t('syncing'),
        message: t('connect_wallet_alert'),
        buttons: [{ type: 'ok', text: 'OK' }]
      });
    } else {
      alert(t('connect_wallet_alert'));
    }
  };

  return (
    <div 
      id="app-container" 
      className="flex flex-col min-h-screen bg-black font-sans selection:bg-emerald-green selection:text-black pb-24"
      style={{ paddingTop: 'var(--tg-viewport-stable-height-offset, 30px)' }}
    >
      <header id="app-header" className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-green/20 border border-emerald-green/30 flex items-center justify-center">
            <User className="text-emerald-green w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-none">{userData.name}</h2>
            <span className="text-[10px] text-white/40 font-mono tracking-wider">#{userData.id}</span>
          </div>
        </div>
        
        <div className="flex items-center bg-[#111] rounded-full pl-3 pr-1 py-1 border border-white/5 shadow-inner">
          <span className="text-xs font-bold text-gold mr-2">{balance.toLocaleString()} $BANK</span>
          <button 
            onClick={() => setIsPurchaseOpen(true)}
            className="w-7 h-7 bg-gold rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-[0_0_15px_rgba(255,204,0,0.3)] hover:shadow-[0_0_20px_rgba(255,204,0,0.5)]"
          >
            <Plus className="text-black w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="px-4 pt-6 space-y-6"
            >
              <section id="welcome-hero" className="space-y-2">
                <div className="flex items-center space-x-2 text-emerald-green font-mono text-[10px] uppercase tracking-widest bg-emerald-green/5 w-fit px-2 py-0.5 rounded border border-emerald-green/10">
                  < Zap className="w-3 h-3" />
                  <span>{t('decentralized_liquidity')}</span>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
                  {t('welcome_title')} <br />
                  <span className="text-emerald-green">{t('welcome_subtitle')}</span>
                </h1>
                <p className="text-white/50 text-sm leading-relaxed">
                  {t('welcome_desc')}
                </p>
              </section>

              <div className="space-y-4">
                <h3 className="text-white font-bold flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-gold" />
                  <span>{t('available_liquidity')}</span>
                </h3>
                
                <div id="lenders-list" className="space-y-3">
                  {LENDERS.map((lender) => (
                    <motion.div 
                      key={`lender-card-${lender.id}`}
                      className="bg-[#0a0a0a] border border-white/5 p-4 rounded-2xl hover:border-emerald-green/20 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${lender.isAI ? 'bg-emerald-green/10 border border-emerald-green/20' : 'bg-white/5 border border-white/10'}`}>
                            {lender.isAI ? <Cpu className="text-emerald-green w-5 h-5" /> : <User className="text-white/40 w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-bold text-white">{lender.name}</h4>
                              {lender.isAI && <span className="text-[8px] bg-emerald-green text-black px-1 rounded font-black tracking-tighter">AI</span>}
                            </div>
                            <span className="text-[10px] text-white/40 font-mono italic">{lender.term}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-green font-bold text-lg leading-none">${lender.amount.toLocaleString()}</div>
                          <span className="text-[10px] text-white/30 font-medium">{t('max_limit')}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider">{t('annual_rate')}</span>
                          <span className="text-sm font-bold text-gold">{lender.rate}% <span className="text-[10px] font-normal opacity-50 italic">APY</span></span>
                        </div>
                        <button 
                          onClick={() => setSelectedLender(lender)}
                          className="bg-white/5 hover:bg-emerald-green hover:text-black py-2 px-6 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                        >
                          <span>{t('take_loan')}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'roadmap' && (
            <motion.div 
              key="roadmap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-6 pt-10 space-y-8"
            >
              <div className="space-y-2 mb-10">
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                  {t('roadmap').split(' ')[0]} <span className="text-gold">{t('roadmap').split(' ')[1] || 'MAP'}</span>
                </h1>
                <p className="text-white/40 text-xs font-medium max-w-[240px]">{t('roadmap_desc')}</p>
              </div>

              <div className="relative">
                {ROADMAP.map((phase) => (
                  <RoadmapItem 
                    key={`roadmap-phase-${phase.id}`} 
                    phase={phase} 
                    isFirst={phase.id === 1} 
                    isLast={phase.id === 4} 
                    t={t}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'info' && (
            <motion.div 
              key="info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-6 pt-10 space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto border border-gold/20 shadow-[0_0_30px_rgba(255,204,0,0.1)]">
                  <ShieldCheck className="text-gold w-10 h-10" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t('elite_security')}</h1>
                <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
                  {t('security_desc')}
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="mt-1 bg-emerald-green/10 p-2 rounded-lg"><Cpu className="text-emerald-green w-5 h-5" /></div>
                  <div>
                    <h3 className="text-white font-bold mb-1">{t('ai_scoring')}</h3>
                    <p className="text-white/40 text-xs leading-relaxed">{t('ai_desc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="mt-1 bg-emerald-green/10 p-2 rounded-lg"><Zap className="text-emerald-green w-5 h-5" /></div>
                  <div>
                    <h3 className="text-white font-bold mb-1">{t('instant_liquidity')}</h3>
                    <p className="text-white/40 text-xs leading-relaxed">{t('liquidity_desc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="mt-1 bg-emerald-green/10 p-2 rounded-lg"><ShieldCheck className="text-emerald-green w-5 h-5" /></div>
                  <div>
                    <h3 className="text-white font-bold mb-1">{t('blockchain_immutable')}</h3>
                    <p className="text-white/40 text-xs leading-relaxed">{t('blockchain_desc')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#111] p-6 rounded-3xl border border-gold/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gold" />
                <h4 className="text-gold font-bold text-sm mb-2 uppercase tracking-widest">{t('why_bank_title')}</h4>
                <p className="text-white/70 text-xs italic leading-loose">
                  {t('why_bank_quote')}
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 pt-10 space-y-8"
            >
              <div className="bg-[#111] rounded-3xl p-6 border border-white/5 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">{t('credit_rating')}</h3>
                  <span className="text-emerald-green font-mono font-bold">{t('rating_excellent')}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex space-x-0.5">
                    <div className="h-full bg-emerald-green w-[85%] rounded-l-full shadow-[0_0_15px_rgba(0,255,136,0.3)]" />
                    <div className="h-full bg-white/10 w-[15%] rounded-r-full" />
                  </div>
                  <div className="flex justify-between font-mono text-[9px] text-white/30 uppercase">
                    <span>{t('vulnerable')}</span>
                    <span>{t('superior')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/40 uppercase font-bold">{t('total_earnings')}</span>
                    <div className="text-xl font-bold text-white leading-none">$0.00</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/40 uppercase font-bold">{t('active_loans')}</span>
                    <div className="text-xl font-bold text-white leading-none">0</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white/40 px-2 uppercase tracking-widest">{t('current_plan')}</h3>
                <div className="bg-[#111] rounded-2xl p-4 border border-gold/20 flex justify-between items-center group cursor-pointer active:scale-[0.99] transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center border border-gold/20">
                      <Zap className="text-gold w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white group-hover:text-gold transition-colors">{t('trainee_merchant')}</h4>
                      <p className="text-[10px] text-white/40 font-mono">{t('commission')}: 2.5% | {t('tier')} 1</p>
                    </div>
                  </div>
                  <ArrowUpRight className="text-gold w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-[#111] hover:bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center transition-all">
                  <div className="flex items-center space-x-3">
                    <Wallet className="text-white/40 w-5 h-5" />
                    <span className="text-sm font-medium text-white/80">{t('withdraw_earnings')}</span>
                  </div>
                  <div className="text-[10px] bg-white/10 text-white/40 px-2 py-0.5 rounded uppercase font-bold">{t('locked')}</div>
                </button>
                <button className="w-full bg-[#111] hover:bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center transition-all">
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="text-white/40 w-5 h-5" />
                    <span className="text-sm font-medium text-white/80">{t('affiliate_system')}</span>
                  </div>
                  <span className="text-emerald-green text-xs font-bold font-mono">+12%</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav id="app-nav" className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 px-6 py-2 pb-8 flex items-center justify-between z-40 max-w-md mx-auto">
        <NavItem icon={TrendingUp} label={t('lend_tab')} isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavItem icon={Zap} label={t('roadmap_tab')} isActive={activeTab === 'roadmap'} onClick={() => setActiveTab('roadmap')} />
        <NavItem icon={Info} label={t('protocol_tab')} isActive={activeTab === 'info'} onClick={() => setActiveTab('info')} />
        <NavItem icon={User} label={t('profile_tab')} isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
      </nav>

      <AnimatePresence>
        {isPurchaseOpen && (
          <PurchaseModal 
            isOpen={isPurchaseOpen} 
            onClose={() => setIsPurchaseOpen(false)} 
            onBuy={handleBuy} 
            t={t}
          />
        )}
        {selectedLender && (
          <SystemTestModal 
            lender={selectedLender} 
            onClose={() => setSelectedLender(null)} 
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
