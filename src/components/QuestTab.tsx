import React, { useState, useEffect, useRef } from 'react';
import { Lock, Terminal, CheckCircle2, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface Question {
  id: number;
  question_text: string;
  batch_id: number;
  is_active: boolean;
}

interface QuestTabProps {
  userId: string;
  t: (key: any) => string;
}

export const QuestTab: React.FC<QuestTabProps> = ({ userId, t }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answer, setAnswer] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Get user progress
      const { data: progress, error: pError } = await supabase
        .from('user_quests')
        .select('current_step')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (pError) throw pError;
      if (progress) setCurrentStep(progress.current_step);
      else {
        // Init progress if not exists
        await supabase.from('user_quests').insert({ user_id: userId, current_step: 1 });
      }

      // 2. Get all questions (ordered)
      const { data: qs, error: qError } = await supabase
        .from('quest_questions')
        .select('id, question_text, batch_id, is_active')
        .order('id', { ascending: true });

      if (qError) throw qError;
      setQuestions(qs || []);
    } catch (err: any) {
      console.error('Quest Load Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (questionId: number) => {
    if (!answer.trim() || submitting) return;
    
    setSubmitting(questionId);
    setErrorMsg(null);
    
    try {
      // Secure verification via RPC
      const { data: isCorrect, error: rpcError } = await supabase.rpc('check_quest_answer', {
        q_id: questionId,
        u_answer: answer.trim().toLowerCase()
      });

      if (rpcError) throw rpcError;

      if (isCorrect) {
        // Update Supabase Progress
        const nextStep = currentStep + 1;
        const { error: upError } = await supabase
          .from('user_quests')
          .update({ current_step: nextStep })
          .eq('user_id', userId);

        if (upError) throw upError;

        // Glitch Success Feedback
        setCurrentStep(nextStep);
        setAnswer('');
      } else {
        setErrorMsg(t('quest_error'));
      }
    } catch (err: any) {
      console.error('Submit Error:', err);
      setErrorMsg(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-emerald-green">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <span className="font-mono text-xs tracking-widest uppercase">Initializing Protocol...</span>
      </div>
    );
  }

  return (
    <div id="quest-container" className="px-6 py-8 space-y-8 pb-32">
      {/* Header */}
      <section className="space-y-3">
        <div className="flex items-center space-x-3 text-gold">
          <Terminal className="w-6 h-6 animate-pulse" />
          <h1 className="text-2xl font-black tracking-tighter uppercase italic glitch-text">
            {t('quest_title')}
          </h1>
        </div>
        <p className="text-white/40 text-xs font-medium leading-relaxed max-w-xs">
          {t('quest_desc')}
        </p>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-center space-x-2">
            <AlertTriangle className="text-red-500 w-4 h-4" />
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Prize Pool: 10.00 BTC</span>
        </div>
      </section>

      {/* Progress List */}
      <div className="space-y-4 relative">
        <div className="absolute left-4 top-2 bottom-2 w-[1px] bg-white/5 z-0" />
        
        {Array.from({ length: 30 }).map((_, idx) => {
          const stepNum = idx + 1;
          const question = questions.find(q => q.id === stepNum);
          const isSolved = stepNum < currentStep;
          const isActiveStep = stepNum === currentStep;
          const isHardLocked = question ? !question.is_active : true;
          const isSoftLocked = stepNum > currentStep && !isHardLocked;

          return (
            <div key={`step-${stepNum}`} className="relative pl-10">
              {/* Node Indicator */}
              <div className={`absolute left-0 w-8 h-8 rounded-full border flex items-center justify-center z-10 transition-all duration-500 ${
                isSolved ? 'bg-emerald-green border-emerald-green' : 
                isActiveStep ? 'bg-gold border-gold shadow-[0_0_15px_rgba(255,204,0,0.5)]' : 
                'bg-black border-white/10'
              }`}>
                {isSolved ? <CheckCircle2 className="text-black w-4 h-4" /> : 
                 isHardLocked ? <Lock className="text-white/20 w-3 h-3" /> :
                 <span className={`text-[10px] font-bold ${isActiveStep ? 'text-black' : 'text-white/40'}`}>{stepNum}</span>}
              </div>

              {/* Step Content */}
              <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                isActiveStep ? 'bg-[#111] border-gold/30' : 
                isSolved ? 'bg-emerald-green/5 border-emerald-green/10' :
                'bg-transparent border-white/5'
              } ${isSoftLocked ? 'opacity-40 grayscale blur-[1px]' : ''}`}>
                
                {isHardLocked ? (
                  <div className="flex flex-col items-center justify-center py-2 space-y-1">
                    <Lock className="w-5 h-5 text-white/10 mb-1" />
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{t('quest_locked_syndicate')}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Segment {stepNum.toString().padStart(2, '0')}</span>
                      {isSolved && <span className="text-[9px] font-bold text-emerald-green uppercase tracking-widest">{t('quest_solved')}</span>}
                    </div>

                    <p className={`text-sm ${isSolved ? 'text-white/40' : 'text-white font-medium'}`}>
                      {question?.question_text || '?? encrypted ??'}
                    </p>

                    {isActiveStep && (
                      <div className="space-y-3 pt-2">
                        <div className="relative">
                           <input 
                            type="text" 
                            disabled={submitting === stepNum}
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleOverride(stepNum)}
                            placeholder={t('quest_placeholder')}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-all"
                          />
                          {submitting === stepNum && (
                            <div className="absolute right-3 top-3">
                              <Loader2 className="w-4 h-4 text-gold animate-spin" />
                            </div>
                          )}
                        </div>
                        
                        {errorMsg && (
                          <motion.p 
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[10px] text-red-500 font-bold uppercase tracking-widest"
                          >
                            {errorMsg}
                          </motion.p>
                        )}

                        <button 
                          onClick={() => handleOverride(stepNum)}
                          disabled={submitting === stepNum || !answer.trim()}
                          className="w-full bg-gold/10 hover:bg-gold text-gold hover:text-black border border-gold/20 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-2 active:scale-95"
                        >
                          <span>{t('quest_submit')}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
