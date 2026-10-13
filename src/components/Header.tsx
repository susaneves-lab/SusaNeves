import React from 'react';
import { 
  CalendarSync, 
  Download, 
  Bell, 
  ShieldCheck,
  ChevronDown,
  Settings,
  FileCheck2,
  Table,
  CalendarCheck,
  Cloud,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { CertificacaoObrigatoria } from '../types';

interface HeaderProps {
  currentTab: 'tabela' | 'dashboard' | 'relatorios' | 'burocracia' | 'tarefas' | 'radar' | 'certificacoes' | 'notificacoes';
  onSelectTab: (tab: 'tabela' | 'dashboard' | 'relatorios' | 'burocracia' | 'tarefas' | 'radar' | 'certificacoes' | 'notificacoes') => void;
  anoAtual: number;
  anosDisponiveis: number[];
  onChangeAno: (ano: number) => void;
  onOpenNovoRegisto?: () => void;
  onOpenNovoCiclo: () => void;
  onQuickBackup: () => void;
  onOpenSettings: () => void;
  certificacoes: CertificacaoObrigatoria[];
  totalAlertas?: number;
  isOnline?: boolean;
  onTriggerCloudSync?: () => void;
  isCloudSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  anoAtual,
  anosDisponiveis,
  onChangeAno,
  onOpenNovoRegisto,
  onOpenNovoCiclo,
  onQuickBackup,
  onOpenSettings,
  certificacoes,
  totalAlertas = 0,
  isOnline = true,
  onTriggerCloudSync,
  isCloudSyncing = false
}) => {

  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Zone 1: Wordmark / Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                RF
              </span>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                  RadForm
                </span>
                <span className="text-[11px] font-medium text-slate-500 leading-tight">
                  Serviço de Radioterapia · ULSAR
                </span>
              </div>
            </div>

            {/* Seletor de Ano do Ciclo */}
            <div className="relative ml-2 sm:ml-4">
              <select
                value={anoAtual}
                onChange={(e) => onChangeAno(parseInt(e.target.value, 10))}
                className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-md cursor-pointer border-0 transition-colors focus:ring-2 focus:ring-teal-500 focus:outline-hidden tabular-nums"
                title="Alternar ano de exercício formativo"
              >
                {anosDisponiveis.map(ano => (
                  <option key={ano} value={ano}>
                    Ano {ano}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Zone 2: Navigation Links (Clean unboxed text links) */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('tabela')}
              className={`py-5 transition-colors relative whitespace-nowrap cursor-pointer ${
                currentTab === 'tabela' 
                  ? 'text-teal-700 font-semibold' 
                  : 'hover:text-slate-900'
              }`}
            >
              Registo de Formações
              {currentTab === 'tabela' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onSelectTab('burocracia')}
              className={`py-5 transition-colors relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'burocracia' 
                  ? 'text-teal-700 font-semibold' 
                  : 'hover:text-slate-900'
              }`}
            >
              Burocracias & Matriz
              {currentTab === 'burocracia' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onSelectTab('tarefas')}
              className={`py-5 transition-colors relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'tarefas' 
                  ? 'text-teal-700 font-semibold' 
                  : 'hover:text-slate-900'
              }`}
            >
              <CalendarCheck className="w-4 h-4 text-slate-500" />
              <span>Tarefas & Cronograma</span>
              {currentTab === 'tarefas' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onSelectTab('dashboard')}
              className={`py-5 transition-colors relative whitespace-nowrap cursor-pointer ${
                currentTab === 'dashboard' 
                  ? 'text-teal-700 font-semibold' 
                  : 'hover:text-slate-900'
              }`}
            >
              Análise de Dados
              {currentTab === 'dashboard' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onSelectTab('relatorios')}
              className={`py-5 transition-colors relative whitespace-nowrap cursor-pointer ${
                currentTab === 'relatorios' 
                  ? 'text-teal-700 font-semibold' 
                  : 'hover:text-slate-900'
              }`}
            >
              Relatórios & Exportação
              {currentTab === 'relatorios' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onSelectTab('radar')}
              className={`py-5 transition-colors relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'radar' 
                  ? 'text-teal-700 font-semibold' 
                  : 'hover:text-slate-900'
              }`}
            >
              Radar Formações Futuras
              <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
                Novo
              </span>
              {currentTab === 'radar' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onSelectTab('certificacoes')}
              className={`py-5 transition-colors relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'certificacoes' 
                  ? 'text-teal-700 font-semibold' 
                  : 'hover:text-slate-900'
              }`}
            >
              Certificações & Prazos
              {currentTab === 'certificacoes' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>

            {/* Aba Notificações no Menu Principal: Alertas Exclusivos Aqui */}
            <button
              onClick={() => onSelectTab('notificacoes')}
              className={`py-5 transition-colors relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'notificacoes' 
                  ? 'text-teal-700 font-semibold' 
                  : 'hover:text-slate-900'
              }`}
            >
              <Bell className="w-4 h-4 text-slate-500" />
              <span>Notificações</span>
              {totalAlertas > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                  {totalAlertas}
                </span>
              )}
              {currentTab === 'notificacoes' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>
          </nav>

          {/* Zone 3: Primary Actions & Settings */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Indicador de Nuvem / Offline e Sincronização em Tempo Real (Requisitos 3 e 4) */}
            <div className="flex items-center">
              {isOnline ? (
                <button
                  type="button"
                  onClick={onTriggerCloudSync || onOpenSettings}
                  title="Nuvem Conectada · Criptografia E2EE AES-256 Ativa. Clique para sincronizar agora."
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors cursor-pointer"
                >
                  {isCloudSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <Cloud className="w-3.5 h-3.5 text-teal-600" />
                    </>
                  )}
                  <span className="hidden sm:inline">Nuvem E2EE</span>
                </button>
              ) : (
                <div
                  title="Modo Offline Total: Acesso total aos dados mantido sem internet. Dados seguros no dispositivo."
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded-md"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Offline</span>
                </div>
              )}
            </div>

            {/* Botão de Menu de Configurações */}
            <button
              onClick={onOpenSettings}
              title="Menu de Configurações (Colaboradores, Palavra-passe, Hospital, Nuvem E2EE)"
              className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">Configurações</span>
            </button>

            {/* Quick backup button */}
            <button
              onClick={onQuickBackup}
              title="Descarregar backup de segurança imediato (JSON)"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Ciclo Anual Reset */}
            <button
              onClick={onOpenNovoCiclo}
              title="Iniciar Novo Ciclo Anual (com backup automático e definição de meta)"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              <CalendarSync className="w-3.5 h-3.5 text-slate-600" />
              <span>Novo Ciclo Anual</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Medium navigation tab strip */}
      <div className="xl:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-200 bg-slate-50 gap-4 text-xs font-medium scrollbar-none">
        <button
          onClick={() => onSelectTab('tabela')}
          className={`whitespace-nowrap py-1 ${currentTab === 'tabela' ? 'text-teal-700 font-bold border-b-2 border-teal-600' : 'text-slate-600'}`}
        >
          Formações
        </button>
        <button
          onClick={() => onSelectTab('burocracia')}
          className={`whitespace-nowrap py-1 ${currentTab === 'burocracia' ? 'text-teal-700 font-bold border-b-2 border-teal-600' : 'text-slate-600'}`}
        >
          Burocracias
        </button>
        <button
          onClick={() => onSelectTab('tarefas')}
          className={`whitespace-nowrap py-1 ${currentTab === 'tarefas' ? 'text-teal-700 font-bold border-b-2 border-teal-600' : 'text-slate-600'}`}
        >
          Tarefas & Cronograma
        </button>
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`whitespace-nowrap py-1 ${currentTab === 'dashboard' ? 'text-teal-700 font-bold border-b-2 border-teal-600' : 'text-slate-600'}`}
        >
          Análise de dados
        </button>
        <button
          onClick={() => onSelectTab('relatorios')}
          className={`whitespace-nowrap py-1 ${currentTab === 'relatorios' ? 'text-teal-700 font-bold border-b-2 border-teal-600' : 'text-slate-600'}`}
        >
          Relatórios
        </button>
        <button
          onClick={() => onSelectTab('radar')}
          className={`whitespace-nowrap py-1 ${currentTab === 'radar' ? 'text-teal-700 font-bold border-b-2 border-teal-600' : 'text-slate-600'}`}
        >
          Radar Futuro
        </button>
        <button
          onClick={() => onSelectTab('certificacoes')}
          className={`whitespace-nowrap py-1 ${currentTab === 'certificacoes' ? 'text-teal-700 font-bold border-b-2 border-teal-600' : 'text-slate-600'}`}
        >
          Certificações
        </button>
        <button
          onClick={() => onSelectTab('notificacoes')}
          className={`whitespace-nowrap py-1 ${currentTab === 'notificacoes' ? 'text-teal-700 font-bold border-b-2 border-teal-600' : 'text-slate-600'}`}
        >
          Notificações{totalAlertas > 0 ? ` (${totalAlertas})` : ''}
        </button>
      </div>
    </header>
  );
};
