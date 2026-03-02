import React, { useState } from 'react';
import { supabase, isConfigured } from '../services/supabaseClient';
import { Wallet, ArrowRight, Loader2, Mail, Lock, AlertTriangle, Terminal } from 'lucide-react';

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        else {
            alert('注册成功！请检查邮箱完成验证，或者直接登录（如果未开启验证）。');
            setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || '发生错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // --- SETUP MODE: Shown when .env is missing ---
  if (!isConfigured) {
      return (
        <div className="min-h-screen bg-stone-900 flex flex-col justify-center px-6 text-stone-300 font-sans">
            <div className="max-w-md w-full mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-2xl bg-yellow-500/10 text-yellow-500 mb-4">
                        <AlertTriangle size={40} />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-white mb-2">应用未连接</h1>
                    <p className="text-stone-400">请配置 Supabase 环境变量以继续</p>
                </div>

                <div className="bg-stone-800 rounded-xl p-6 border border-stone-700 shadow-xl space-y-4">
                    <div className="flex items-start gap-3">
                        <Terminal size={20} className="mt-1 text-stone-500 shrink-0" />
                        <div className="space-y-2 w-full overflow-hidden">
                             <p className="text-sm font-medium text-white">1. 在项目根目录创建文件:</p>
                             <code className="block bg-black/50 p-2 rounded text-xs text-green-400 font-mono">.env</code>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Terminal size={20} className="mt-1 text-stone-500 shrink-0" />
                        <div className="space-y-2 w-full overflow-hidden">
                             <p className="text-sm font-medium text-white">2. 填入以下内容:</p>
                             <div className="bg-black/50 p-3 rounded text-[10px] sm:text-xs text-stone-300 font-mono overflow-x-auto whitespace-pre leading-relaxed">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
                             </div>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-stone-700 mt-4">
                        <p className="text-xs text-stone-500 text-center">
                            配置完成后，请重启开发服务器。
                        </p>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- LOGIN MODE ---
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center px-6 animate-fade-in relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-[-10%] right-[-20%] w-[300px] h-[300px] bg-stone-200 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[200px] h-[200px] bg-stone-300 rounded-full blur-3xl opacity-40 pointer-events-none"></div>

      <div className="max-w-md w-full mx-auto relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-stone-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-stone-200">
            <Wallet size={32} />
          </div>
          <h1 className="text-4xl font-serif font-bold text-stone-900 mb-2">ZenBudget</h1>
          <p className="text-stone-500 font-sans tracking-wide">极简生活，从容记账</p>
        </div>

        {/* Form Section */}
        <div className="bg-white/80 backdrop-blur-lg border border-stone-100 p-8 rounded-3xl shadow-xl shadow-stone-100/50">
            <div className="flex gap-4 mb-8 p-1 bg-stone-100 rounded-xl">
                <button 
                    onClick={() => { setIsLogin(true); setError(null); }}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${isLogin ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                >
                    登录
                </button>
                <button 
                    onClick={() => { setIsLogin(false); setError(null); }}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${!isLogin ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                >
                    注册
                </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-4">
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={18} />
                        <input
                            type="email"
                            placeholder="邮箱地址"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3.5 pl-11 pr-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white transition-all"
                        />
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={18} />
                        <input
                            type="password"
                            placeholder="密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3.5 pl-11 pr-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-xs text-center bg-red-50 p-2 rounded-lg">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-stone-900 text-white py-4 rounded-xl font-medium mt-4 flex items-center justify-center gap-2 hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg shadow-stone-200"
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            {isLogin ? '进入应用' : '创建账号'}
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>
        </div>
        
        <p className="text-center text-stone-300 text-xs mt-8">
            Build with Supabase & Gemini
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;