"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from '@/lib/firebase'; // <--- IMPORTANDO SUA CONFIG NOVA
import { Lock, ArrowRight, Loader2, AlertCircle, TrendingUp } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Se já estiver logado, manda pro Dashboard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.push("/");
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Tenta logar no Firebase com seus dados
      await signInWithEmailAndPassword(auth, email, password);
      // Se der certo, o useEffect acima vai redirecionar sozinho
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') setError("Email ou senha inválidos.");
      else if (err.code === 'auth/too-many-requests') setError("Muitas tentativas. Tente mais tarde.");
      else setError("Erro ao fazer login.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-800">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
        <div className="flex justify-center mb-6 mt-2">
          <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
            <Lock size={32} />
          </div>
        </div>

        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Acesso Restrito</h1>
            <p className="text-slate-500 text-sm mt-2">Entre com suas credenciais</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Email</label>
            <input 
              required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Senha</label>
            <input 
              required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg"><AlertCircle size={16} /> {error}</div>}
          <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 disabled:opacity-70">
            {loading ? <Loader2 className="animate-spin" /> : <>Entrar <ArrowRight size={18} /></>}
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-8 font-bold uppercase tracking-widest flex items-center justify-center gap-1"><TrendingUp size={12} /> ProfitLens Security</p>
      </div>
    </div>
  );
}