/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus,
  Wallet,
  ShieldCheck, 
  User, 
  Zap, 
  Cpu, 
  ArrowUpRight, 
  Bot,
  Terminal,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language } from './translations';
import { supabase } from './lib/supabase';
import { AIChat } from './components/AIChat';
import { QuestTab } from './components/QuestTab';
import { NeuralProvider, useNeural } from './lib/NeuralContext';
import { ComputeDashboard } from './components/ComputeDashboard';

// --- Constants & Types ---

type Tab = 'compute' | 'roadmap' | 'profile' | 'ai' | 'quest';

interface RoadmapPhase {
  id: number;
  title: string;
  subtitle: string;
  status: 'Active' | 'Locked';
  items: string[];
}

interface RoadmapItemProps {
  phase: RoadmapPhase;
  isFirst: boolean;
  isLast: boolean;
  t: any;
}

const RoadmapItem: React.FC<RoadmapItemProps> = ({ phase, isFirst, isLast, t }) => {
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

// --- Sub-components ---

interface NavItemProps {
  icon: any;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isCenter?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, isActive, onClick, isCenter }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center transition-all flex-1 py-1 relative ${
      isActive ? 'text-emerald-green' : 'text-white/30'
    } ${isCenter ? 'scale-110 -translate-y-1' : ''}`}
  >
    <div className={`p-2 rounded-xl transition-all ${isCenter && isActive ? 'bg-emerald-green/10 shadow-[0_0_20px_rgba(0,255,136,0.1)]' : ''}`}>
      <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
    </div>
    <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-40'}`}>
      {label}
    </span>
    {isActive && !isCenter && (
      <motion.div 
        layoutId="nav-indicator"
        className="absolute bottom-[-2px] w-1 h-1 bg-emerald-green rounded-full opacity-50"
      />
    )}
  </button>
);

// --- Main App Component ---

const AppContent = () => {
  const [activeTab, setActiveTab] = useState<Tab>('compute');
  const { intelligence: balance } = useNeural();
  const [userData, setUserData] = useState({ name: 'User', id: '00000', isAdmin: false });
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

  useEffect(() => {
    // Initialize Telegram Web App
    const tg = (window as any).Telegram?.WebApp;

    const syncUserWithSupabase = async (user: any) => {
      try {
        // 1. First, try to fetch the existing profile
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', user.id.toString())
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (profile) {
          // User exists: Load their coins balance into state via NeuralProvider (handled automatically by initial effect in provider)
          
          // Update metadata (name, updated_at) without resetting coins
          await supabase
            .from('profiles')
            .upsert({ 
              id: user.id.toString(), 
              name: user.first_name || 'User',
              updated_at: new Date().toISOString()
            });
          
          console.log(`Supabase Status: Data Loaded. Balance: ${profile.coins} $BANK`);
        } else {
          // User does NOT exist: Create new profile with 0 coins
          const { error: createError } = await supabase
            .from('profiles')
            .insert({ 
              id: user.id.toString(), 
              name: user.first_name || 'User',
              coins: 0,
              updated_at: new Date().toISOString()
            });

          if (createError) throw createError;
          console.log(`Supabase Status: New profile created for ${user.first_name}.`);
        }
      } catch (err: any) {
        console.error(`Supabase Sync Error: ${err.message}`);
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
        const tgId = tgUser.id.toString();
        setUserData({
          name: tgUser.first_name || 'User',
          id: tgId || '00000',
          isAdmin: tgId === '623203896'
        });
        
        // Trigger sync
        syncUserWithSupabase(tgUser);
      }

      return () => clearTimeout(expandTimer);
    }
  }, []);

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
        
        <div className="flex items-center bg-[#111] rounded-full px-4 py-1.5 border border-white/5 shadow-inner">
          <span className="text-xs font-bold text-gold">{balance.toLocaleString()} $BANK</span>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'compute' && (
            <motion.div 
              key="compute"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full"
            >
              <ComputeDashboard t={t} />
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full"
            >
              <AIChat t={t} />
            </motion.div>
          )}

          {activeTab === 'quest' && (
            <motion.div 
              key="quest"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full"
            >
              <QuestTab userId={userData.id} t={t} isAdmin={userData.isAdmin} />
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

      <nav id="app-nav" className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-3xl border-t border-white/5 px-2 py-3 pb-8 flex items-center justify-around z-40 max-w-md mx-auto font-mono">
        <NavItem icon={Zap} label={t('roadmap_tab')} isActive={activeTab === 'roadmap'} onClick={() => setActiveTab('roadmap')} />
        <NavItem icon={Bot} label={t('ai_tab')} isActive={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
        
        {/* CENTER TAB: MINING */}
        <NavItem 
          icon={Cpu} 
          label={t('lend_tab')} 
          isActive={activeTab === 'compute'} 
          onClick={() => setActiveTab('compute')} 
          isCenter
        />
        
        <NavItem icon={Terminal} label={t('quest_tab')} isActive={activeTab === 'quest'} onClick={() => setActiveTab('quest')} />
        <NavItem icon={User} label={t('profile_tab')} isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
      </nav>

      <AnimatePresence>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const tg = (window as any).Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id?.toString() || null;

  return (
    <NeuralProvider userId={userId}>
      <AppContent />
    </NeuralProvider>
  );
}
