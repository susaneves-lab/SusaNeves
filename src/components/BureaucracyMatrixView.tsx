import React, { useState } from 'react';
import { 
  Formacao, 
  Colaborador, 
  SubtipoBurocracia, 
  MATRIZ_BUROCRACIA, 
  RequisitosDocumentais,
  DocumentosValidacaoFormacao,
  ConfiguracoesApp
} from '../types';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Search, 
  Filter, 
  ShieldCheck, 
  HelpCircle,
  Printer,
  Info,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface BureaucracyMatrixViewProps {
  formacoes: Formacao[];
  colaboradores: Colaborador[];
  anoAtual: number;
  configuracoes?: ConfiguracoesApp;
  onAtualizarFormacao: (formacao: Formacao) => void;
  onAbrirEmailOutlook: (formacao: Formacao) => void;
}

// Acrónimos e significado oficial dos documentos
export const SIGLAS_DOCUMENTOS = [
  { id: 'reservaSala', nomeCurto: 'Reserva Sala', sigla: 'RS', descricao: 'Reserva e agendamento da sala física de formação' },
  { id: 'emailConfirmacaoSala', nomeCurto: 'Email Conf. Sala', sigla: 'ECS', descricao: 'Email de confirmação da reserva da sala hospitalar' },
  { id: 'propostaPAF', nomeCurto: 'Proposta (PAF)', sigla: 'PAF', descricao: 'Proposta de Ação Formativa submetida e aprovada' },
  { id: 'fichaFormadorFF', nomeCurto: 'Ficha Formador (FF)', sigla: 'FF', descricao: 'Ficha curricular e identificação do formador' },
  { id: 'fichaInscricaoFI', nomeCurto: 'Ficha Inscrição (FI)', sigla: 'FI', descricao: 'Ficha individual de inscrição na formação' },
  { id: 'listaNominativaLN', nomeCurto: 'Lista Nominativa (LN)', sigla: 'LN', descricao: 'Lista oficial com nomes e números mecanográficos' },
  { id: 'sumarioS', nomeCurto: 'Sumário (S)', sigla: 'S', descricao: 'Sumário e programa pedagógico dos conteúdos lecionados' },
  { id: 'registoPresencaRPF', nomeCurto: 'Registo Presença (RPF)', sigla: 'RPF', descricao: 'Folha de assinaturas e registo de presenças' },
  { id: 'avaliacaoFormadorA1', nomeCurto: 'Aval. Formador (A1)', sigla: 'A1', descricao: 'Avaliação da prestação pedagógica do formador' },
  { id: 'avaliacaoFormandoAF1', nomeCurto: 'Aval. Formando (AF1)', sigla: 'AF1', descricao: 'Ficha de avaliação de reação do formando' },
  { id: 'certificadosCR', nomeCurto: 'Certificados (CR)', sigla: 'CR', descricao: 'Certificados de frequência ou aproveitamento' },
  { id: 'emailAvaliacao6Meses', nomeCurto: 'Email Aval. 6 Meses', sigla: '6M', descricao: 'Disparo de email formal aos 6 meses para aferir eficácia' },
  { id: 'avaliacaoEficaciaA6', nomeCurto: 'Aval. Eficácia (A6)', sigla: 'A6', descricao: 'Ficha oficial de avaliação da eficácia da formação no posto de trabalho' },
] as const;

export const BureaucracyMatrixView: React.FC<BureaucracyMatrixViewProps> = ({
  formacoes,
  colaboradores,
  anoAtual,
  configuracoes,
  onAtualizarFormacao,
  onAbrirEmailOutlook,
}) => {
  const [subtipoSelecionado, setSubtipoSelecionado] = useState<SubtipoBurocracia | 'todos'>('todos');
  const [buscaFormacao, setBuscaFormacao] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'validadas' | 'pendentes'>('todos');
  const [formacaoSelecionadaId, setFormacaoSelecionadaId] = useState<string | null>(null);

  // Formações do ano corrente (protegido contra valores nulos)
  const formacoesDoAno = formacoes.filter(f => f.ano === anoAtual);

  // Lista de subtipos da matriz da 2ª imagem
  const subtiposLista: SubtipoBurocracia[] = [
    'ACAF (inclui NIFTSDT)',
    'ACAF - Obrigatória',
    'Enfermagem (só Internas)',
    'Externa (inclui Enfermagem Externas)',
    'Interna - Formador Interno (i.e. só TSDT)',
    'Interna - Formador Externo (i.e. só TSDT)',
    'Interna - Obrigatória'
  ];

  // Helper para aceder à matriz ativa (customizada em configurações ou padrão)
  const obterMatrizReq = (st: SubtipoBurocracia): RequisitosDocumentais => {
    return (configuracoes?.matrizBurocraciaCustomizada?.[st]) || MATRIZ_BUROCRACIA[st] || MATRIZ_BUROCRACIA['Externa (inclui Enfermagem Externas)'];
  };

  // Helper para determinar subtipo automático baseado na categoria se não definido
  const obterSubtipo = (f: Formacao): SubtipoBurocracia => {
    if (f.subtipoBurocracia) return f.subtipoBurocracia;
    if (f.categoria === 'ACAF') return 'ACAF (inclui NIFTSDT)';
    if (f.categoria === 'Enfermagem') return 'Enfermagem (só Internas)';
    if (f.categoria === 'Externa') return 'Externa (inclui Enfermagem Externas)';
    if (f.categoria === 'Interna') return 'Interna - Formador Interno (i.e. só TSDT)';
    return 'Externa (inclui Enfermagem Externas)';
  };

  // Filtragem de formações para auditoria
  const formacoesFiltradas = formacoesDoAno.filter(f => {
    const st = obterSubtipo(f);
    if (subtipoSelecionado !== 'todos' && st !== subtipoSelecionado) return false;
    if (filtroEstado === 'validadas' && !f.burocracia) return false;
    if (filtroEstado === 'pendentes' && f.burocracia) return false;
    if (buscaFormacao.trim() !== '') {
      const q = buscaFormacao.toLowerCase();
      const nome = (f.nome || '').toLowerCase();
      const codigo = (f.codigo || '').toLowerCase();
      return nome.includes(q) || codigo.includes(q);
    }
    return true;
  });

  // Formação em detalhe: mantém a selecionada se existir, ou a primeira da lista filtrada, ou a primeira do ano
  const formacaoEmDetalhe = 
    (formacaoSelecionadaId ? formacoesDoAno.find(f => f.id === formacaoSelecionadaId) : null) || 
    formacoesFiltradas[0] || 
    formacoesDoAno[0] || 
    null;

  // Alternar um documento da burocracia para a formação
  const handleToggleDocumento = (formacao: Formacao, docKey: keyof DocumentosValidacaoFormacao) => {
    const docsAtuais = formacao.documentosBurocracia || {};
    const subtipo = obterSubtipo(formacao);
    const matrizReq = obterMatrizReq(subtipo);

    // Se burocracia estava validada globalmente mas docsAtuais estava vazio, assume obrigatórios como concluídos
    const valorAtual = docsAtuais[docKey] ?? (formacao.burocracia && matrizReq[docKey as keyof RequisitosDocumentais] === 'sim');
    const novoValor = !valorAtual;

    const novosDocs: DocumentosValidacaoFormacao = {
      ...docsAtuais,
      [docKey]: novoValor,
      ...(docKey === 'emailAvaliacao6Meses' && novoValor ? { emailEnviadoData: new Date().toISOString().slice(0, 10) } : {})
    };

    // Verificar se todos os itens obrigatórios da matriz foram cumpridos
    let todosObrigatoriosOk = true;
    let temObrigatorios = false;
    (Object.keys(matrizReq) as Array<keyof RequisitosDocumentais>).forEach((k) => {
      if (matrizReq[k] === 'sim') {
        temObrigatorios = true;
        // Se a chave for a que estamos a alterar, usa novoValor, senão o valor em novosDocs ou o fallback de validação prévia
        const docCumprido = (k === docKey) 
          ? novoValor 
          : (novosDocs[k as keyof DocumentosValidacaoFormacao] ?? (formacao.burocracia));
        if (!docCumprido) {
          todosObrigatoriosOk = false;
        }
      }
    });

    const formacaoAtualizada: Formacao = {
      ...formacao,
      documentosBurocracia: novosDocs,
      burocracia: temObrigatorios ? todosObrigatoriosOk : formacao.burocracia
    };

    onAtualizarFormacao(formacaoAtualizada);
  };

  // Alternar validação global direta da burocracia
  const handleToggleValidarGeral = (formacao: Formacao) => {
    const novoEstado = !formacao.burocracia;
    const subtipo = obterSubtipo(formacao);
    const matrizReq = obterMatrizReq(subtipo);

    const novosDocs: DocumentosValidacaoFormacao = { ...(formacao.documentosBurocracia || {}) };
    if (novoEstado) {
      // Ao validar, assinala os obrigatórios da matriz como cumpridos
      (Object.keys(matrizReq) as Array<keyof RequisitosDocumentais>).forEach((k) => {
        if (matrizReq[k] === 'sim') {
          (novosDocs as Record<string, any>)[k] = true;
        }
      });
    }

    const formacaoAtualizada: Formacao = {
      ...formacao,
      documentosBurocracia: novosDocs,
      burocracia: novoEstado
    };

    onAtualizarFormacao(formacaoAtualizada);
  };

  // Alterar subtipo regulamentar da formação selecionada
  const handleChangeSubtipo = (formacao: Formacao, novoSubtipo: SubtipoBurocracia) => {
    const matrizReq = obterMatrizReq(novoSubtipo);
    const docsAtuais = formacao.documentosBurocracia || {};
    let todosObrigatoriosOk = true;
    let temObrigatorios = false;
    (Object.keys(matrizReq) as Array<keyof RequisitosDocumentais>).forEach((k) => {
      if (matrizReq[k] === 'sim') {
        temObrigatorios = true;
        if (!docsAtuais[k as keyof DocumentosValidacaoFormacao]) {
          todosObrigatoriosOk = false;
        }
      }
    });

    const formacaoAtualizada: Formacao = {
      ...formacao,
      subtipoBurocracia: novoSubtipo,
      burocracia: temObrigatorios ? todosObrigatoriosOk : formacao.burocracia
    };

    onAtualizarFormacao(formacaoAtualizada);
  };

  // Contadores para o header
  const totalValidadas = formacoesDoAno.filter(f => f.burocracia).length;
  const totalPendentes = formacoesDoAno.length - totalValidadas;

  return (
    <div className="space-y-6">
      
      {/* Banner Superior Explicativo */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
              <h2 className="text-base font-bold text-slate-900">
                Menu de Gestão e Matriz de Burocracias (Qualidade & Auditoria Hospitalar)
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Normativo documental conforme a <strong>Segunda Imagem</strong> do Serviço de Radioterapia. 
              Valide e assinale os documentos de suporte de cada formação, despache os emails de avaliação de eficácia aos 6 meses e acompanhe a conformidade regulamentar.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md text-xs font-mono">
              <span className="text-emerald-700 font-bold">✔ {totalValidadas} Validadas</span>
              <span className="text-slate-300">|</span>
              <span className="text-amber-700 font-bold">⏳ {totalPendentes} Pendentes</span>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Matriz</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. MATRIZ VISUAL COMPLETA (EXATA DA SEGUNDA IMAGEM) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Matriz Regulamentar de Documentação Exigida por Subtipo
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {subtipoSelecionado !== 'todos' && (
              <button
                onClick={() => setSubtipoSelecionado('todos')}
                className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar Filtro ({subtipoSelecionado})</span>
              </button>
            )}
            <span className="text-[11px] text-slate-500 font-mono">
              Norma da Qualidade ULSAR · Edição {anoAtual}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-amber-100/75 border-b border-amber-200 text-slate-900 font-bold select-none">
                <th className="py-2.5 px-3 min-w-[220px] border-r border-amber-200">
                  Categoria / Subtipo de Formação
                </th>
                {SIGLAS_DOCUMENTOS.map((doc) => (
                  <th 
                    key={doc.id} 
                    className="py-2 px-1 text-center min-w-[62px] border-r border-amber-200"
                    title={`${doc.nomeCurto} - ${doc.descricao}`}
                  >
                    <div className="font-mono text-teal-900">{doc.sigla}</div>
                    <div className="text-[9px] font-normal text-slate-600 truncate max-w-[58px]">
                      {doc.nomeCurto}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {subtiposLista.map((subtipo) => {
                const req = obterMatrizReq(subtipo);
                const isSelected = subtipoSelecionado === subtipo;
                const countFormacoes = formacoesDoAno.filter(f => obterSubtipo(f) === subtipo).length;

                return (
                  <tr 
                    key={subtipo}
                    onClick={() => setSubtipoSelecionado(subtipo === subtipoSelecionado ? 'todos' : subtipo)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-teal-50/80 font-semibold text-teal-900' : 'hover:bg-amber-50/30 text-slate-700'
                    }`}
                    title={`Clique para filtrar formações do subtipo "${subtipo}"`}
                  >
                    <td className="py-2.5 px-3 font-sans font-medium border-r border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{subtipo}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            countFormacoes > 0 ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {countFormacoes}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] text-teal-700 bg-teal-100 px-1.5 py-0.2 rounded font-mono font-bold">
                              Ativo
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {SIGLAS_DOCUMENTOS.map((doc) => {
                      const valor = req[doc.id as keyof RequisitosDocumentais] || 'n.a.';
                      return (
                        <td key={doc.id} className="py-2 px-1 text-center border-r border-slate-100">
                          {valor === 'sim' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Sim
                            </span>
                          ) : valor === 'opcional' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Opc.
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">
                              n.a.
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legenda dos Acrónimos da 2ª Imagem */}
        <div className="bg-slate-50 p-3 border-t border-slate-200">
          <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-teal-700" />
            <span>Legenda dos Acrónimos Documentais (Imagem 2):</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 text-[10px] text-slate-600">
            {SIGLAS_DOCUMENTOS.map(d => (
              <div key={d.sigla} className="bg-white p-1.5 rounded border border-slate-200/80">
                <strong className="font-mono text-teal-800 font-bold">{d.sigla}</strong>: {d.nomeCurto}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. VERIFICADOR E AUDITOR INTERATIVO DE FORMAÇÕES DO ANO ATIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Coluna da Esquerda: Lista de Formações (5 Colunas) */}
        <div className="lg:col-span-5 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-700" />
              <span>Formações do Ano {anoAtual} ({formacoesFiltradas.length})</span>
            </h3>

            {subtipoSelecionado !== 'todos' && (
              <button
                onClick={() => setSubtipoSelecionado('todos')}
                className="text-[11px] font-semibold text-teal-700 hover:underline cursor-pointer"
              >
                Limpar Subtipo
              </button>
            )}
          </div>

          {/* Filtros: Busca + Filtro por Estado (Validadas / Pendentes) */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Pesquisar por nome ou código..."
                value={buscaFormacao}
                onChange={(e) => setBuscaFormacao(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-500 font-medium mr-1">Estado:</span>
              <button
                onClick={() => setFiltroEstado('todos')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  filtroEstado === 'todos' ? 'bg-slate-800 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({formacoesDoAno.length})
              </button>
              <button
                onClick={() => setFiltroEstado('pendentes')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  filtroEstado === 'pendentes' ? 'bg-amber-600 text-white font-bold' : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                Pendentes ({totalPendentes})
              </button>
              <button
                onClick={() => setFiltroEstado('validadas')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  filtroEstado === 'validadas' ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                Validadas ({totalValidadas})
              </button>
            </div>
          </div>

          {/* Lista com Scroll */}
          <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
            {formacoesFiltradas.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto opacity-70" />
                <p className="text-xs font-semibold text-slate-700">
                  Nenhuma formação encontrada para este filtro.
                </p>
                {subtipoSelecionado !== 'todos' && (
                  <p className="text-[11px] text-slate-500">
                    O subtipo "{subtipoSelecionado}" não tem ações formativas registadas em {anoAtual}.
                  </p>
                )}
                <button
                  onClick={() => {
                    setSubtipoSelecionado('todos');
                    setBuscaFormacao('');
                    setFiltroEstado('todos');
                  }}
                  className="mt-2 px-3 py-1 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-md cursor-pointer transition-colors"
                >
                  Ver Todas as {formacoesDoAno.length} Formações
                </button>
              </div>
            ) : (
              formacoesFiltradas.map((f) => {
                const isSelected = formacaoEmDetalhe?.id === f.id;
                const subtipo = obterSubtipo(f);
                const req = obterMatrizReq(subtipo);
                const docs = f.documentosBurocracia || {};

                // Contar cumpridos
                let obrigatoriosCount = 0;
                let cumpridosCount = 0;
                if (req) {
                  (Object.keys(req) as Array<keyof RequisitosDocumentais>).forEach(k => {
                    if (req[k] === 'sim') {
                      obrigatoriosCount++;
                      const isCumprido = docs[k as keyof DocumentosValidacaoFormacao] ?? (f.burocracia);
                      if (isCumprido) cumpridosCount++;
                    }
                  });
                }

                const perc = obrigatoriosCount > 0 ? Math.round((cumpridosCount / obrigatoriosCount) * 100) : 100;

                return (
                  <div
                    key={f.id}
                    onClick={() => setFormacaoSelecionadaId(f.id)}
                    className={`pt-2 first:pt-0 p-2.5 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-teal-50 border border-teal-300 shadow-2xs' 
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-slate-900 text-xs leading-snug">
                        {f.nome}
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
                        f.burocracia ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {f.burocracia ? 'Validada' : `${perc}%`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span className="font-mono text-teal-800 font-bold">{f.codigo || 'S/ CÓD'}</span>
                      <span>{f.categoria} · {f.data}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 truncate">
                      Subtipo: {subtipo}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna da Direita: Checklist de Validação Documental da Formação Selecionada (7 Colunas) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          {formacaoEmDetalhe ? (
            <>
              {/* Header da Formação em Detalhe */}
              <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Seletor de Subtipo para permitir reclassificação direta */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-600">Subtipo:</span>
                      <select
                        value={obterSubtipo(formacaoEmDetalhe)}
                        onChange={(e) => handleChangeSubtipo(formacaoEmDetalhe, e.target.value as SubtipoBurocracia)}
                        className="text-xs font-semibold text-teal-900 bg-teal-50 border border-teal-300 rounded px-2 py-0.5 cursor-pointer focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                        title="Alterar o subtipo regulamentar desta formação"
                      >
                        {subtiposLista.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">|</span>
                    <span className="text-xs text-slate-500 font-mono">
                      Carga: <strong>{formacaoEmDetalhe.horas}h</strong>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {formacaoEmDetalhe.nome}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Código: <strong className="text-teal-800">{formacaoEmDetalhe.codigo}</strong> · Data: {formacaoEmDetalhe.data}{formacaoEmDetalhe.dataFim ? ` a ${formacaoEmDetalhe.dataFim}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onAbrirEmailOutlook(formacaoEmDetalhe)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0078D4] hover:bg-[#0060A8] text-white text-xs font-semibold rounded-md shadow-xs cursor-pointer transition-colors whitespace-nowrap"
                    title="Enviar notificação de Avaliação de Eficácia aos 6 Meses via Outlook"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email 6 Meses (Outlook)</span>
                  </button>
                </div>
              </div>

              {/* Informação sobre Colaboradores */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700 block mb-1">
                  Colaboradores Registados nesta Ação:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(formacaoEmDetalhe.colaboradores || []).map(sigla => {
                    const colab = colaboradores.find(c => c.sigla === sigla);
                    return (
                      <span key={sigla} className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-slate-800">
                        <strong>{sigla}</strong> - {colab?.nome || 'Colaborador'}
                      </span>
                    );
                  })}
                  {(!formacaoEmDetalhe.colaboradores || formacaoEmDetalhe.colaboradores.length === 0) && (
                    <span className="text-slate-400 italic">Nenhum colaborador individual associado</span>
                  )}
                </div>
              </div>

              {/* Checklist Interativo dos Documentos Regulamentares (Apenas Obrigatórios e Opcionais) */}
              <div>
                {(() => {
                  const subtipo = obterSubtipo(formacaoEmDetalhe);
                  const reqMatriz = obterMatrizReq(subtipo);
                  const docsAtuais = formacaoEmDetalhe.documentosBurocracia || {};

                  // Apenas documentos obrigatórios ('sim') ou opcionais ('opcional')
                  const docsAplicaveis = SIGLAS_DOCUMENTOS.filter((doc) => {
                    const exigencia = reqMatriz?.[doc.id as keyof RequisitosDocumentais];
                    return exigencia === 'sim' || exigencia === 'opcional';
                  });

                  return (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-800 text-xs">
                          Requisitos Documentais para este Subtipo ({docsAplicaveis.length} aplicáveis):
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Clique nas linhas para alternar entre Pendente e Recebido
                        </span>
                      </div>

                      <div className="space-y-2">
                        {docsAplicaveis.length === 0 ? (
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                            Não existem documentos obrigatórios ou opcionais regulamentados para o subtipo <strong>{subtipo}</strong>. Esta formação cumpre os requisitos normativos.
                          </div>
                        ) : (
                          docsAplicaveis.map((doc) => {
                            const exigencia = reqMatriz?.[doc.id as keyof RequisitosDocumentais] || 'opcional';
                            const isObrigatorio = exigencia === 'sim';
                            const isOpcional = exigencia === 'opcional';

                            // Estado de conclusão
                            const isConcluido = Boolean(docsAtuais[doc.id as keyof DocumentosValidacaoFormacao] ?? (formacaoEmDetalhe.burocracia && isObrigatorio));

                            return (
                              <div
                                key={doc.id}
                                onClick={() => {
                                  handleToggleDocumento(formacaoEmDetalhe, doc.id as keyof DocumentosValidacaoFormacao);
                                }}
                                className={`p-2.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                                  isConcluido
                                    ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-2xs'
                                    : isObrigatorio
                                    ? 'bg-rose-50/30 border-rose-200 hover:border-rose-300 text-slate-800'
                                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                  <input
                                    type="checkbox"
                                    checked={isConcluido}
                                    readOnly
                                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-xs">{doc.nomeCurto}</span>
                                      <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-1 py-0.2 rounded font-semibold">
                                        {doc.sigla}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 block truncate">
                                      {doc.descricao}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {isObrigatorio && (
                                    <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                      Obrigatório
                                    </span>
                                  )}
                                  {isOpcional && (
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      Opcional
                                    </span>
                                  )}

                                  {doc.id === 'emailAvaliacao6Meses' && isConcluido && (
                                    <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-mono">
                                      Enviado
                                    </span>
                                  )}

                                  <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                                    isConcluido ? 'text-emerald-700' : 'text-slate-400'
                                  }`}>
                                    {isConcluido ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        <span>Recebido</span>
                                      </>
                                    ) : (
                                      <span>Pendente</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Estado Geral de Burocracia */}
              <div className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                formacaoEmDetalhe.burocracia
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className={`w-5 h-5 shrink-0 ${formacaoEmDetalhe.burocracia ? 'text-emerald-600' : 'text-amber-500'}`} />
                  <div>
                    <strong className="block text-xs">
                      {formacaoEmDetalhe.burocracia
                        ? 'Burocracia Totalmente Validada (Conforme Registo)'
                        : 'Burocracia Pendente de Requisitos Regulamentares'}
                    </strong>
                    <span className="text-[11px] opacity-80 block mt-0.5">
                      {formacaoEmDetalhe.burocracia
                        ? 'Todos os documentos obrigatórios da matriz foram verificados e arquivados no processo hospitalar.'
                        : 'Assinale os documentos em falta para concluir a validação formal da formação.'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleValidarGeral(formacaoEmDetalhe)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-md cursor-pointer shadow-2xs whitespace-nowrap transition-colors ${
                    formacaoEmDetalhe.burocracia
                      ? 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {formacaoEmDetalhe.burocracia ? 'Desmarcar Burocracia' : 'Validar Diretamente'}
                </button>
              </div>

            </>
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">Selecione uma formação à esquerda</p>
              <p className="text-xs text-slate-400">Para visualizar o checklist de burocracia e enviar notificações via Outlook.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
