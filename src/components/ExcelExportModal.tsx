import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Formacao, Colaborador, DESTINATARIOS_INFO, FormacaoCategoria, DestinatarioGrupo } from '../types';
import { 
  FileSpreadsheet, 
  Download, 
  Check, 
  X, 
  Sliders, 
  CheckSquare, 
  Square,
  FileCheck2,
  Table
} from 'lucide-react';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  formacoes: Formacao[];
  colaboradores: Colaborador[];
  anoAtual: number;
}

interface ColunaExportacao {
  id: string;
  label: string;
  padrao: boolean;
  obterValor: (f: Formacao) => string | number;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  formacoes,
  colaboradores,
  anoAtual,
}) => {
  // Lista de colunas configuráveis (na ordem exata da tabela de formação)
  const COLUNAS_DISPONIVEIS: ColunaExportacao[] = [
    { id: 'realizada', label: 'Realiz. (Formação Realizada)', padrao: true, obterValor: (f) => f.realizada ? 'Sim' : 'Não' },
    { id: 'nome', label: 'Nome da Formação', padrao: true, obterValor: (f) => f.nome },
    { id: 'categoria', label: 'Tipo / Categoria', padrao: true, obterValor: (f) => f.categoria },
    { id: 'destinatarios', label: 'Destinatários', padrao: true, obterValor: (f) => f.destinatarios.join(', ') },
    { id: 'data', label: 'Data da Realização', padrao: true, obterValor: (f) => f.data + (f.dataFim ? ` a ${f.dataFim}` : '') },
    { id: 'frequentadaRad', label: 'Freq. RAD', padrao: true, obterValor: (f) => f.frequentadaColaboradorRad ? 'Sim' : 'Não' },
    { id: 'horas', label: 'Horas (h)', padrao: true, obterValor: (f) => f.horasTexto || f.horas },
    { id: 'codigo', label: 'Código Formação', padrao: true, obterValor: (f) => f.codigo || '-' },
    { id: 'relevancia', label: 'Relevância', padrao: true, obterValor: (f) => f.relevancia || '-' },
    { id: 'pnf', label: 'No PNF', padrao: true, obterValor: (f) => f.incluidaPlanoNecessidades || '-' },
    { id: 'certificado', label: 'Certificado', padrao: true, obterValor: (f) => f.certificado ? f.certificado.nomeFicheiro : 'Pendente' },
    { id: 'observacoes', label: 'Observações & Colaboradores', padrao: true, obterValor: (f) => {
        const parts: string[] = [];
        if (f.colaboradores && f.colaboradores.length > 0) parts.push(`Colaboradores: ${f.colaboradores.join(', ')}`);
        if (f.observacoes) parts.push(f.observacoes);
        return parts.join(' | ') || '-';
      }
    },
    { id: 'burocracia', label: 'Burocracia (Validada / Pendente)', padrao: false, obterValor: (f) => f.burocracia ? 'SIM' : 'NÃO' },
    { id: 'prioridade', label: 'Nível de Prioridade (Alta, Média, Baixa)', padrao: false, obterValor: (f) => f.prioridade || 'Média' },
    { id: 'subtipo', label: 'Subtipo Burocracia Matriz', padrao: false, obterValor: (f) => f.subtipoBurocracia || 'Padrão' },
    { id: 'dataRegisto', label: 'Data de Registo no Sistema', padrao: false, obterValor: (f) => f.dataRegisto || '' }
  ];

  // Estado das colunas selecionadas
  const [colunasSelecionadas, setColunasSelecionadas] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    COLUNAS_DISPONIVEIS.forEach(c => {
      init[c.id] = c.padrao;
    });
    return init;
  });

  // Opções de Folhas adicionais no ficheiro Excel
  const [incluirFolhaColaboradores, setIncluirFolhaColaboradores] = useState(true);
  const [incluirFolhaCategorias, setIncluirFolhaCategorias] = useState(true);
  const [incluirFolhaGrupos, setIncluirFolhaGrupos] = useState(true);
  const [incluirFolhaAuditoriaBurocracia, setIncluirFolhaAuditoriaBurocracia] = useState(true);

  // Nome do ficheiro customizado
  const [nomeFicheiro, setNomeFicheiro] = useState(
    `Relatorio_Formacao_RAD_${anoAtual}_Export_${new Date().toISOString().slice(0, 10)}`
  );

  if (!isOpen) return null;

  // Alternar seleção de coluna
  const toggleColuna = (id: string) => {
    setColunasSelecionadas(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Predefinições rápidas
  const aplicarPredefinicao = (tipo: 'todas' | 'oficial' | 'horas' | 'burocracia') => {
    const novas: Record<string, boolean> = {};
    if (tipo === 'todas') {
      COLUNAS_DISPONIVEIS.forEach(c => { novas[c.id] = true; });
    } else if (tipo === 'oficial') {
      COLUNAS_DISPONIVEIS.forEach(c => { novas[c.id] = c.padrao; });
    } else if (tipo === 'horas') {
      COLUNAS_DISPONIVEIS.forEach(c => {
        novas[c.id] = ['nome', 'categoria', 'colaboradores', 'horas', 'codigo', 'destinatarios'].includes(c.id);
      });
    } else if (tipo === 'burocracia') {
      COLUNAS_DISPONIVEIS.forEach(c => {
        novas[c.id] = ['nome', 'burocracia', 'realizada', 'pnf', 'subtipo', 'certificado', 'data'].includes(c.id);
      });
    }
    setColunasSelecionadas(novas);
  };

  // Gerar e Descarregar o Ficheiro Excel
  const handleExportarExcel = () => {
    const formacoesDoAno = formacoes.filter(f => f.ano === anoAtual);
    const wb = XLSX.utils.book_new();

    // 1. Folha Principal Personalizada de Formações
    const colunasAtivas = COLUNAS_DISPONIVEIS.filter(c => colunasSelecionadas[c.id]);
    
    const rowsFormacoes = formacoesDoAno.map(f => {
      const row: Record<string, string | number> = {};
      colunasAtivas.forEach(c => {
        row[c.label] = c.obterValor(f);
      });
      return row;
    });

    const wsFormacoes = XLSX.utils.json_to_sheet(rowsFormacoes);
    XLSX.utils.book_append_sheet(wb, wsFormacoes, `Formações ${anoAtual}`);

    // 2. Folha de Resumo de Horas por Colaborador
    if (incluirFolhaColaboradores) {
      const rowsColabs = colaboradores.map(c => {
        const participacoes = formacoesDoAno.filter(f => f.colaboradores.includes(c.sigla));
        const totalHoras = participacoes.reduce((sum, f) => sum + f.horas, 0);
        const meta = c.metaHorasAnual || 35;
        const perc = Math.round((totalHoras / meta) * 100);

        return {
          'Sigla': c.sigla,
          'Nome Colaborador': c.nome,
          'Grupo Profissional': `${c.categoriaProfissional} - ${DESTINATARIOS_INFO[c.categoriaProfissional]?.nomeCompleto || ''}`,
          'Estado': c.estadoProfissional,
          'Total de Formações': participacoes.length,
          'Horas Realizadas': totalHoras,
          'Meta Anual (Horas)': meta,
          '% Cumprimento da Meta': `${perc}%`,
          'Situação': totalHoras >= meta ? 'Meta Cumprida' : 'Em Progresso'
        };
      });
      const wsColabs = XLSX.utils.json_to_sheet(rowsColabs);
      XLSX.utils.book_append_sheet(wb, wsColabs, 'Horas por Colaborador');
    }

    // 3. Folha de Totais por Grupo Profissional
    if (incluirFolhaGrupos) {
      const grupos: DestinatarioGrupo[] = ['AT', 'ENF', 'FIS', 'MR', 'TAS', 'TSDT'];
      const rowsGrupos = grupos.map(grp => {
        const colabsDoGrupo = colaboradores.filter(c => c.categoriaProfissional === grp || (grp === 'TAS' && c.categoriaProfissional === 'AO'));
        const acoesDestinadas = formacoesDoAno.filter(f => f.destinatarios.includes(grp) || (grp === 'TAS' && f.destinatarios.includes('AO' as any)));
        const totalHorasEquipa = colabsDoGrupo.reduce((acc, c) => {
          const h = formacoesDoAno.filter(f => f.colaboradores.includes(c.sigla)).reduce((sum, f) => sum + f.horas, 0);
          return acc + h;
        }, 0);

        return {
          'Código': grp,
          'Grupo Profissional': DESTINATARIOS_INFO[grp]?.nomeCompleto || grp,
          'Total Colaboradores': colabsDoGrupo.length,
          'Ações Destinadas': acoesDestinadas.length,
          'Horas Acumuladas pela Equipa': totalHorasEquipa,
          'Média Horas / Colaborador': colabsDoGrupo.length > 0 ? (totalHorasEquipa / colabsDoGrupo.length).toFixed(1) : '0'
        };
      });
      const wsGrupos = XLSX.utils.json_to_sheet(rowsGrupos);
      XLSX.utils.book_append_sheet(wb, wsGrupos, 'Por Grupo Profissional');
    }

    // 4. Folha de Totais por Categoria
    if (incluirFolhaCategorias) {
      const categorias: FormacaoCategoria[] = ['Externa', 'Interna', 'Enfermagem', 'ACAF'];
      const rowsCategorias = categorias.map(cat => {
        const lista = formacoesDoAno.filter(f => f.categoria === cat);
        const totalHoras = lista.reduce((sum, f) => sum + f.horas, 0);
        return {
          'Categoria': cat,
          'Total Formações': lista.length,
          'Total Horas': totalHoras,
          'Média Horas / Formação': lista.length > 0 ? (totalHoras / lista.length).toFixed(1) : '0'
        };
      });
      const wsCategorias = XLSX.utils.json_to_sheet(rowsCategorias);
      XLSX.utils.book_append_sheet(wb, wsCategorias, 'Por Categoria');
    }

    // 5. Folha de Auditoria de Burocracia & PNF
    if (incluirFolhaAuditoriaBurocracia) {
      const rowsAuditoria = formacoesDoAno.map(f => ({
        'Nome': f.nome,
        'Código': f.codigo,
        'Categoria': f.categoria,
        'Burocracia Concluída': f.burocracia ? 'SIM' : 'NÃO',
        'Realizada': f.realizada ? 'SIM' : 'NÃO',
        'Incluída no PNF': f.incluidaPlanoNecessidades,
        'Certificado Anexo': f.certificado ? 'SIM' : 'NÃO',
        'Frequência por Colab. RAD': f.frequentadaColaboradorRad ? 'SIM' : 'NÃO'
      }));
      const wsAuditoria = XLSX.utils.json_to_sheet(rowsAuditoria);
      XLSX.utils.book_append_sheet(wb, wsAuditoria, 'Auditoria de Burocracia');
    }

    // Gravar ficheiro final
    XLSX.writeFile(wb, `${nomeFicheiro.trim() || 'Relatorio_Formacao'}.xlsx`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header do Configurador de Excel */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Configurador de Exportação para Excel (.xlsx)</span>
              </h2>
              <p className="text-xs text-emerald-100">
                Defina exatamente quais os campos, resumos e dados a incluir no ficheiro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-md cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Configuração */}
        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          
          {/* Nome do Ficheiro */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nome do Ficheiro Excel a Gerar:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nomeFicheiro}
                onChange={(e) => setNomeFicheiro(e.target.value)}
                className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-md font-mono text-xs focus:ring-2 focus:ring-emerald-600"
              />
              <span className="font-mono text-slate-500 font-semibold">.xlsx</span>
            </div>
          </div>

          {/* Pré-definições Rápidas */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block mb-2">Modelos Pré-definidos:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => aplicarPredefinicao('oficial')}
                className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md cursor-pointer transition-colors"
              >
                Padrão Oficial RAD (Completo)
              </button>
              <button
                type="button"
                onClick={() => aplicarPredefinicao('horas')}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md cursor-pointer transition-colors"
              >
                Mapa de Horas & Participações
              </button>
              <button
                type="button"
                onClick={() => aplicarPredefinicao('burocracia')}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md cursor-pointer transition-colors"
              >
                Auditoria de Burocracia & PNF
              </button>
              <button
                type="button"
                onClick={() => aplicarPredefinicao('todas')}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md cursor-pointer transition-colors"
              >
                Selecionar Todas as Colunas
              </button>
            </div>
          </div>

          {/* Seleção de Colunas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Table className="w-4 h-4 text-emerald-700" />
                <span>Colunas a Incluir na Folha Principal ({Object.values(colunasSelecionadas).filter(Boolean).length} selecionadas):</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              {COLUNAS_DISPONIVEIS.map((col) => {
                const ativo = colunasSelecionadas[col.id];
                return (
                  <label
                    key={col.id}
                    onClick={() => toggleColuna(col.id)}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                      ativo ? 'bg-white border border-emerald-300 shadow-2xs' : 'hover:bg-slate-100 text-slate-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={ativo}
                      onChange={() => {}} // tratado no onClick
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-xs text-slate-800">{col.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Folhas de Resumo Complementares */}
          <div>
            <label className="font-bold text-slate-800 block mb-2">
              Folhas Complementares de Resumo e Estatísticas:
            </label>
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirFolhaColaboradores}
                  onChange={(e) => setIncluirFolhaColaboradores(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 font-medium">
                  Folha: Resumo de Horas Acumuladas por Cada Colaborador (com % de cumprimento de meta)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirFolhaGrupos}
                  onChange={(e) => setIncluirFolhaGrupos(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 font-medium">
                  Folha: Resumo por Grupo Profissional (TSDT, ENF, MR, FIS, AT, TAS)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirFolhaCategorias}
                  onChange={(e) => setIncluirFolhaCategorias(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 font-medium">
                  Folha: Resumo por Categoria de Formação (Externa, Interna, Enfermagem, ACAF)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirFolhaAuditoriaBurocracia}
                  onChange={(e) => setIncluirFolhaAuditoriaBurocracia(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 font-medium">
                  Folha: Matriz de Auditoria de Burocracia, Certificados e PNF
                </span>
              </label>
            </div>
          </div>

        </div>

        {/* Footer com Botão de Descarregar */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-slate-500 text-xs">
            Formato: <strong>Livro de Cálculo Excel Microsoft (.xlsx)</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-md cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleExportarExcel}
              className="px-4 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer flex items-center gap-2 transition-colors active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Gerar & Descarregar Ficheiro Excel</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
