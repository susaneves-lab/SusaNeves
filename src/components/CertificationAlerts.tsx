import React, { useState, useMemo } from 'react';
import { CertificacaoObrigatoria, Colaborador, DestinatarioGrupo } from '../types';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  Plus, 
  RotateCw, 
  User,
  Filter,
  Check
} from 'lucide-react';

interface CertificationAlertsProps {
  certificacoes: CertificacaoObrigatoria[];
  colaboradores: Colaborador[];
  onRenovar: (id: string, novaDataExpiracao: string) => void;
  onAdicionar: (nova: CertificacaoObrigatoria) => void;
}

export const CertificationAlerts: React.FC<CertificationAlertsProps> = ({
  certificacoes,
  colaboradores,
  onRenovar,
  onAdicionar
}) => {
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [modalRenovarId, setModalRenovarId] = useState<string | null>(null);
  const [novaDataExp, setNovaDataExp] = useState<string>('');
  const [modalNovoAberto, setModalNovoAberto] = useState(false);

  // Formulário de nova certificação
  const [colabSigla, setColabSigla] = useState(colaboradores[0]?.sigla || 'ASN');
  const [nomeCert, setNomeCert] = useState('Proteção Radiológica Nível II');
  const [dataObt, setDataObt] = useState(new Date().toISOString().slice(0, 10));
  const [dataExp, setDataExp] = useState(
    new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [entidade, setEntidade] = useState('Agência Portuguesa do Ambiente (APA)');
  const [obs, setObs] = useState('');

  // Filtragem
  const certificacoesFiltradas = useMemo(() => {
    return certificacoes.filter(c => {
      if (filtroEstado !== 'todos' && c.estado !== filtroEstado) return false;
      return true;
    }).sort((a, b) => a.diasParaExpirar - b.diasParaExpirar);
  }, [certificacoes, filtroEstado]);

  const expiradas = certificacoes.filter(c => c.estado === 'expirado').length;
  const aExpirar = certificacoes.filter(c => c.estado === 'a_expirar').length;
  const validas = certificacoes.filter(c => c.estado === 'valido').length;

  const handleConfirmarRenovacao = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalRenovarId && novaDataExp) {
      onRenovar(modalRenovarId, novaDataExp);
      setModalRenovarId(null);
      setNovaDataExp('');
    }
  };

  const handleSubmeterNovaCertificacao = (e: React.FormEvent) => {
    e.preventDefault();
    const colab = colaboradores.find(c => c.sigla === colabSigla);
    const expDate = new Date(dataExp);
    const hoje = new Date();
    const diffTime = expDate.getTime() - hoje.getTime();
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let estado: 'valido' | 'a_expirar' | 'expirado' = 'valido';
    if (dias < 0) estado = 'expirado';
    else if (dias <= 60) estado = 'a_expirar';

    const nova: CertificacaoObrigatoria = {
      id: `cert-${Date.now()}`,
      colaboradorSigla: colabSigla,
      colaboradorNome: colab?.nome || colabSigla,
      categoriaProfissional: colab?.categoriaProfissional || 'TSDT',
      nomeCertificacao: nomeCert,
      dataObtencao: dataObt,
      dataExpiracao: dataExp,
      entidadeCertificadora: entidade,
      estado,
      diasParaExpirar: dias,
      observacoes: obs
    };

    onAdicionar(nova);
    setModalNovoAberto(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Resumo de Alertas de Conformidade */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Expiradas */}
        <div className="bg-white p-4 rounded-lg border border-rose-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-rose-700 block">Certificações Expiradas</span>
            <span className="text-2xl font-bold text-rose-900 tabular-nums">
              {expiradas} <span className="text-xs font-normal text-slate-500">críticas</span>
            </span>
            <p className="text-[11px] text-rose-600 mt-1">Requerem renovação imediata</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* A Expirar em 60 dias */}
        <div className="bg-white p-4 rounded-lg border border-amber-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-amber-800 block">A Expirar brevemente</span>
            <span className="text-2xl font-bold text-amber-900 tabular-nums">
              {aExpirar} <span className="text-xs font-normal text-slate-500">alertas</span>
            </span>
            <p className="text-[11px] text-amber-700 mt-1">Prazo inferior a 60 dias</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Válidas e Conformes */}
        <div className="bg-white p-4 rounded-lg border border-emerald-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-emerald-800 block">Certificações Conformes</span>
            <span className="text-2xl font-bold text-emerald-900 tabular-nums">
              {validas} <span className="text-xs font-normal text-slate-500">ativas</span>
            </span>
            <p className="text-[11px] text-emerald-700 mt-1">Dentro do período de validade</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtro e Adição */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-700">Filtrar por Estado:</span>
          <div className="inline-flex rounded-md bg-slate-100 p-0.5 text-xs">
            <button
              onClick={() => setFiltroEstado('todos')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filtroEstado === 'todos' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({certificacoes.length})
            </button>
            <button
              onClick={() => setFiltroEstado('expirado')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filtroEstado === 'expirado' ? 'bg-white text-rose-700 font-semibold shadow-2xs' : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Expirados ({expiradas})
            </button>
            <button
              onClick={() => setFiltroEstado('a_expirar')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filtroEstado === 'a_expirar' ? 'bg-white text-amber-800 font-semibold shadow-2xs' : 'text-slate-600 hover:text-amber-800'
              }`}
            >
              A Expirar ({aExpirar})
            </button>
            <button
              onClick={() => setFiltroEstado('valido')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filtroEstado === 'valido' ? 'bg-white text-emerald-800 font-semibold shadow-2xs' : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              Válidos ({validas})
            </button>
          </div>
        </div>

        <button
          onClick={() => setModalNovoAberto(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Certificação</span>
        </button>
      </div>

      {/* Lista / Tabela de Certificações */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[11px]">
                <th className="py-2.5 px-3">Profissional</th>
                <th className="py-2.5 px-3">Certificação / Licença Obrigatória</th>
                <th className="py-2.5 px-3">Entidade Emissora</th>
                <th className="py-2.5 px-2.5">Data Obtenção</th>
                <th className="py-2.5 px-2.5">Data Expiração</th>
                <th className="py-2.5 px-3">Estado e Prazo</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {certificacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhuma certificação corresponde ao filtro selecionado.
                  </td>
                </tr>
              ) : (
                certificacoesFiltradas.map((cert) => {
                  return (
                    <tr key={cert.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-teal-800 font-mono">{cert.colaboradorSigla}</span>
                        <span className="text-slate-700 font-medium block">{cert.colaboradorNome}</span>
                        <span className="text-[11px] text-slate-500 block">{cert.categoriaProfissional}</span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900 block">{cert.nomeCertificacao}</span>
                        {cert.observacoes && (
                          <span className="text-[11px] text-slate-500 block">{cert.observacoes}</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600">
                        {cert.entidadeCertificadora}
                      </td>

                      <td className="py-2.5 px-2.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {cert.dataObtencao}
                      </td>

                      <td className="py-2.5 px-2.5 font-mono text-[11px] font-semibold text-slate-900 whitespace-nowrap">
                        {cert.dataExpiracao}
                      </td>

                      <td className="py-2.5 px-3">
                        {cert.estado === 'expirado' ? (
                          <div className="flex items-center gap-1.5 text-rose-700 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Expirou ({Math.abs(cert.diasParaExpirar)} dias)</span>
                          </div>
                        ) : cert.estado === 'a_expirar' ? (
                          <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Expira em {cert.diasParaExpirar} dias</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                            <Check className="w-3.5 h-3.5" />
                            <span>Válido ({cert.diasParaExpirar} dias)</span>
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setModalRenovarId(cert.id);
                            // Sugerir +2 ou +5 anos de acordo com o tipo
                            const d = new Date();
                            d.setFullYear(d.getFullYear() + 2);
                            setNovaDataExp(d.toISOString().slice(0, 10));
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 cursor-pointer transition-colors"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Renovar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Renovação */}
      {modalRenovarId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Registar Renovação de Certificação
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Introduza a nova data de expiração confirmada pelo organismo emissor:
            </p>

            <form onSubmit={handleConfirmarRenovacao} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nova Data de Expiração:
                </label>
                <input
                  type="date"
                  required
                  value={novaDataExp}
                  onChange={(e) => setNovaDataExp(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalRenovarId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md cursor-pointer"
                >
                  Confirmar Renovação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Nova Certificação */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Registar Certificação Obrigatória para Profissional
            </h3>

            <form onSubmit={handleSubmeterNovaCertificacao} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Colaborador:</label>
                <select
                  value={colabSigla}
                  onChange={(e) => setColabSigla(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
                >
                  {colaboradores.map(c => (
                    <option key={c.sigla} value={c.sigla}>
                      {c.sigla} - {c.nome} ({c.cargo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome da Certificação:</label>
                <input
                  type="text"
                  required
                  value={nomeCert}
                  onChange={(e) => setNomeCert(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Obtenção:</label>
                  <input
                    type="date"
                    required
                    value={dataObt}
                    onChange={(e) => setDataObt(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Expiração:</label>
                  <input
                    type="date"
                    required
                    value={dataExp}
                    onChange={(e) => setDataExp(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Entidade Emissora:</label>
                <input
                  type="text"
                  required
                  value={entidade}
                  onChange={(e) => setEntidade(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações:</label>
                <input
                  type="text"
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Ex: Renovação periódica / Requisito DGS"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md cursor-pointer"
                >
                  Guardar Certificação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
