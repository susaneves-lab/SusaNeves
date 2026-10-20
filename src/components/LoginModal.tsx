import React, { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck, Hospital } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  passwordCorreta: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onSuccess,
  passwordCorreta
}) => {
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [erro, setErro] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === passwordCorreta) {
      setErro('');
      onSuccess();
    } else {
      setErro('Palavra-passe incorreta. Por favor verifique e tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Banner Superior Hospitalar */}
        <div className="bg-teal-700 px-6 py-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-6 h-6 text-teal-100" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">RadForm · Acesso Seguro</h2>
          <p className="text-xs text-teal-100/90 mt-1">
            Serviço de Radioterapia · ULSAR, EPE
          </p>
        </div>

        {/* Formulário de Autenticação */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Palavra-passe de Acesso ao Sistema:
            </label>
            <div className="relative">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                autoFocus
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (erro) setErro('');
                }}
                placeholder="Introduza a palavra-passe..."
                className="w-full pl-3 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer transition-colors"
                title={mostrarPassword ? 'Ocultar palavra-passe' : 'Visualizar palavra-passe'}
              >
                {mostrarPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {erro && (
              <p className="text-xs text-rose-600 font-medium mt-1.5">
                {erro}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm rounded-lg shadow-xs hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Entrar no Sistema</span>
          </button>
        </form>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Aplicação protegida de gestão e contabilização de formação médica e técnica
        </div>
      </div>
    </div>
  );
};
