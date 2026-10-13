import React, { useState } from 'react';
import { MetaAno, Formacao, Colaborador, HistoricoAno } from '../types';
import { 
  CalendarSync, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  Target,
  ArrowRight,
  X
} from 'lucide-react';

interface NewCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  anoAtual: number;
  totalFormacoesAtuais: number;
  totalHorasAtuais: number;
  totalColaboradores: number;
  onConfirmNovoCiclo: (
    novoAno: number, 
    metaHorasPorColab: number, 
    metaTotalServico: number,
    metaQtdPorColab?: number,
    metaTotalQtdServico?: number
  ) => void;
  onTriggerBackupDownload: () => void;
}

export const NewCycleModal: React.FC<NewCycleModalProps> = ({
  isOpen,
  onClose,
  anoAtual,
  totalFormacoesAtuais,
  totalHorasAtuais,
  totalColaboradores,
  onConfirmNovoCiclo,
  onTriggerBackupDownload
}) => {
  const [novoAno, setNovoAno] = useState(anoAtual + 1);
  const [metaHorasPorColab, setMetaHorasPorColab] = useState(35);
  const [metaQtdPorColab, setMetaQtdPorColab] = useState(3);
  const [backupEfetuado, setBackupEfetuado] = useState(false);
  const [confirmacaoEscrita, setConfirmacaoEscrita] = useState('');

  const metaTotalCalculada = metaHorasPorColab * totalColaboradores;
  const metaTotalQtdCalculada = Math.round(metaQtdPorColab * totalColaboradores * 0.4); // Ações globais do serviço

  const handleDownloadBackup = () => {
    onTriggerBackupDownload();
    setBackupEfetuado(true);
  };

  const handleFinalizar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupEfetuado) {
      alert('Por favor, efetue primeiro o download do backup de segurança para conformidade hospitalar.');
      return;
    }
    onConfirmNovoCiclo(novoAno, metaHorasPorColab, metaTotalCalculada, metaQtdPorColab, metaTotalQtdCalculada);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarSync className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-bold text-slate-900">
              Iniciar Novo Ciclo Anual de Registos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleFinalizar} className="p-6 space-y-5 text-xs">
          
          {/* Informação do Arquivo */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5 text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Transição e Arquivo Seguro do Ano {anoAtual}</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              O ciclo atual de <strong>{anoAtual}</strong> ({totalFormacoesAtuais} formações, {totalHorasAtuais} horas acumuladas) será automaticamente arquivado no Histórico Permanente da Análise de Dados.
            </p>
          </div>

          {/* Passo 1: Backup Obrigatório de Segurança */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                1. Backup de Segurança & Conformidade (Obrigatório)
              </span>
              {backupEfetuado && (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                  <Check className="w-3.5 h-3.5" />
                  Backup Gravado
                </span>
              )}
            </div>
            <p className="text-slate-600">
              Descarrega ficheiro integral dos registos para arquivo digital e auditoria hospitalar.
            </p>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className={`w-full py-2 px-3 rounded-md font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                backupEfetuado
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                  : 'bg-teal-700 text-white hover:bg-teal-800 shadow-xs'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>{backupEfetuado ? 'Descarregar Novamente Backup' : 'Descarregar Backup de Segurança'}</span>
            </button>
          </div>

          {/* Passo 2: Definição do Novo Ciclo e Meta */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <span className="font-bold text-slate-900 block">
              2. Metas do Serviço para o Próximo Ciclo
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Novo Ano de Exercício:
                </label>
                <input
                  type="number"
                  required
                  min={anoAtual}
                  max={2035}
                  value={novoAno}
                  onChange={(e) => setNovoAno(parseInt(e.target.value, 10))}
                  className="w-full p-2 bg-white border border-slate-300 rounded-md font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Meta Horas / Colaborador:
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  max={120}
                  value={metaHorasPorColab}
                  onChange={(e) => setMetaHorasPorColab(parseInt(e.target.value, 10))}
                  className="w-full p-2 bg-white border border-slate-300 rounded-md font-mono font-bold text-teal-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Meta Ações / Colaborador:
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={20}
                  value={metaQtdPorColab}
                  onChange={(e) => setMetaQtdPorColab(parseInt(e.target.value, 10))}
                  className="w-full p-2 bg-white border border-slate-300 rounded-md font-mono font-bold text-teal-700"
                />
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-600 border-t border-slate-200 flex justify-between items-center">
              <span>Metas Globais do Serviço ({totalColaboradores} colaboradores):</span>
              <strong className="font-mono text-xs text-slate-900">
                {metaTotalCalculada} horas · ~{metaTotalQtdCalculada} ações
              </strong>
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!backupEfetuado}
              className={`px-4 py-2 font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 ${
                backupEfetuado
                  ? 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Arquivar e Iniciar Ano {novoAno}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
