import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, FileText, Users, DollarSign, BookOpen, BarChart3, Download, Upload, LogOut, Eye, EyeOff, RefreshCw, Trash2, Edit, Clock, CreditCard, Target, Trophy, Award, Check, X, Calendar } from 'lucide-react';

// IMPORT DO SUPABASE (VERSÃO CORRIGIDA COM DELETAR VENDA)
import { 
  supabase,
  salvarCliente, 
  buscarClientes, 
  atualizarCliente, 
  deletarCliente,
  salvarVenda,
  buscarVendas,
  atualizarVenda,
  deletarVenda, // ← NOVA FUNÇÃO ADICIONADA
  salvarParcelas,
  salvarProcesso,
  buscarProcessos,
  atualizarProcesso,
  salvarCurso,
  buscarCursos,
  atualizarCurso,
  testarConexao,
  createSubscription,
  removeSubscription,
  buscarUsuarios,
  salvarUsuario,
  atualizarUsuario,
  deletarUsuario,
  autenticarUsuario,
  // FUNÇÕES DE PRESENÇA ONLINE:
  marcarUsuarioOnline,
  marcarUsuarioOffline,
  atualizarHeartbeat,
  buscarUsuariosOnline
} from './supabase';

// IMPORT DE UTILITÁRIOS
import {
  calcularProximoVencimento,
  validarCPF,
  validarEmail,
  validarTelefone,
  filtrarPorPeriodo,
  filtrarDataPorPeriodo,
  criarFiltroPadrao
} from './utils';

// Sistema de toast simples
const toast = {
  success: (message) => {
    console.log('✅ SUCCESS:', message);
    alert('✅ ' + message);
  },
  error: (message) => {
    console.log('❌ ERROR:', message);
    alert('❌ ' + message);
  },
  loading: (message, options) => {
    console.log('🔄 LOADING:', message);
  }
};

// COMPONENTE FILTRO DE DATA
const FiltroData = ({ filtro, onChange, className = '', compacto = false }) => {
  const anos = Array.from({ length: 31 }, (_, i) => 2020 + i);
  const meses = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const handleChange = (campo, valor) => {
    onChange({
      ...filtro,
      [campo]: valor,
      // Reset campos específicos quando muda período
      ...(campo === 'periodo' && valor !== 'especifico' ? {
        mesEspecifico: '',
        anoEspecifico: new Date().getFullYear().toString()
      } : {})
    });
  };

  if (compacto) {
    return (
      <div className={`flex gap-2 items-center ${className}`}>
        <Calendar className="h-4 w-4 text-gray-400" />
        <select
          value={filtro.periodo}
          onChange={(e) => handleChange('periodo', e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todos</option>
          <option value="hoje">Hoje</option>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mês</option>
          <option value="especifico">Mês específico</option>
        </select>
        
        {filtro.periodo === 'especifico' && (
          <>
            <select
              value={filtro.mesEspecifico}
              onChange={(e) => handleChange('mesEspecifico', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Mês</option>
              {meses.map(mes => (
                <option key={mes.value} value={mes.value}>{mes.label}</option>
              ))}
            </select>
            <select
              value={filtro.anoEspecifico}
              onChange={(e) => handleChange('anoEspecifico', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              {anos.map(ano => (
                <option key={ano} value={ano.toString()}>{ano}</option>
              ))}
            </select>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`flex gap-3 flex-wrap items-center ${className}`}>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <select
          value={filtro.periodo}
          onChange={(e) => handleChange('periodo', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todos os períodos</option>
          <option value="hoje">Hoje</option>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mês</option>
          <option value="especifico">Mês específico</option>
        </select>
      </div>
      
      {filtro.periodo === 'especifico' && (
        <>
          <select
            value={filtro.mesEspecifico}
            onChange={(e) => handleChange('mesEspecifico', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione o mês</option>
            {meses.map(mes => (
              <option key={mes.value} value={mes.value}>{mes.label}</option>
            ))}
          </select>
          <select
            value={filtro.anoEspecifico}
            onChange={(e) => handleChange('anoEspecifico', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {anos.map(ano => (
              <option key={ano} value={ano.toString()}>{ano}</option>
            ))}
          </select>
        </>
      )}
    </div>
  );
};

// COMPONENTE BARRA DE PROGRESSO ANIMADA
const ProgressBar = ({ current, target, bonus, label }) => {
  const percentage = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Target className="h-6 w-6 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
        </div>
        <div className="flex items-center text-purple-600">
          <Trophy className="h-5 w-5 mr-1" />
          <span className="font-bold">R$ {bonus}</span>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progresso: R$ {current.toFixed(2)}</span>
          <span>Meta: R$ {target.toFixed(2)}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
            style={{ width: `${percentage}%` }}
          >
            {percentage > 15 && (
              <span className="text-white text-xs font-bold">{percentage.toFixed(1)}%</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-center">
        {remaining > 0 ? (
          <p className="text-sm text-gray-600">
            Faltam <span className="font-bold text-purple-600">R$ {remaining.toFixed(2)}</span> para seu bônus!
          </p>
        ) : (
          <p className="text-sm text-green-600 font-bold flex items-center justify-center">
            <Award className="h-4 w-4 mr-1" />
            Meta atingida! Bônus conquistado!
          </p>
        )}
      </div>
    </div>
  );
};

// COMPONENTE GESTÃO DE VENDEDORES (ADMIN)
const GestaoVendedores = ({ 
  vendedores, 
  setVendedores, 
  novoVendedor, 
  setNovoVendedor, 
  erros, 
  adicionarVendedor,
  editarVendedor,
  deletarVendedor,
  vendedorEditando,
  setVendedorEditando
}) => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestão de Vendedores</h1>
    
    <div className="bg-white rounded-xl shadow-lg mb-6">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">
          {vendedorEditando ? 'Editar Vendedor' : 'Adicionar Novo Vendedor'}
        </h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Nome completo *"
              value={novoVendedor.nome}
              onChange={(e) => setNovoVendedor({...novoVendedor, nome: e.target.value})}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                erros.nome ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {erros.nome && <p className="text-red-500 text-sm mt-1">{erros.nome}</p>}
          </div>
          <div>
            <input
              type="text"
              placeholder="Nome de usuário *"
              value={novoVendedor.username}
              onChange={(e) => setNovoVendedor({...novoVendedor, username: e.target.value})}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                erros.username ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {erros.username && <p className="text-red-500 text-sm mt-1">{erros.username}</p>}
          </div>
          <div>
            <input
              type="password"
              placeholder="Senha *"
              value={novoVendedor.password}
              onChange={(e) => setNovoVendedor({...novoVendedor, password: e.target.value})}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                erros.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {erros.password && <p className="text-red-500 text-sm mt-1">{erros.password}</p>}
          </div>
          <div>
            <input
              type="number"
              placeholder="Comissão (%) *"
              step="0.1"
              value={novoVendedor.comissao}
              onChange={(e) => setNovoVendedor({...novoVendedor, comissao: e.target.value})}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                erros.comissao ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {erros.comissao && <p className="text-red-500 text-sm mt-1">{erros.comissao}</p>}
          </div>
          <button
            onClick={vendedorEditando ? editarVendedor : adicionarVendedor}
            className={`${vendedorEditando ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center font-medium`}
          >
            <Plus className="h-4 w-4 mr-2" />
            {vendedorEditando ? 'Atualizar Vendedor' : 'Adicionar Vendedor'}
          </button>
          {vendedorEditando && (
            <button
              onClick={() => {
                setVendedorEditando(null);
                setNovoVendedor({ nome: '', username: '', password: '', comissao: '52.5' });
              }}
              className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center font-medium"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comissão (%)</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Cadastro</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(vendedores || []).filter(v => v.role === 'vendedor').map(vendedor => (
              <tr key={vendedor.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{vendedor.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{vendedor.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-bold">{vendedor.comissao}%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Ativo
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{vendedor.dataCadastro}</td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => {
                      setVendedorEditando(vendedor);
                      setNovoVendedor({
                        nome: vendedor.nome,
                        username: vendedor.username,
                        password: '',
                        comissao: vendedor.comissao.toString()
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deletarVendedor(vendedor.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// DASHBOARD ATUALIZADO
const Dashboard = ({ stats, vendas, currentUser, atualizarDados, filtroDashboard, setFiltroDashboard }) => {
  const isAdmin = currentUser?.role === 'admin';
  const vendedorVendas = isAdmin ? (vendas || []) : (vendas || []).filter(v => v.vendedor === currentUser?.nome);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Dashboard {!isAdmin && `- ${currentUser?.nome}`}
        </h1>
        <div className="flex gap-3 items-center">
          <FiltroData 
            filtro={filtroDashboard}
            onChange={setFiltroDashboard}
            compacto={true}
          />
          <button
            onClick={atualizarDados}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500 transform hover:scale-105 transition-transform">
          <h3 className="text-lg font-semibold text-gray-700">Total Clientes</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.totalClientes || 0}</p>
          <p className="text-sm text-gray-500 mt-2">Cadastrados</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500 transform hover:scale-105 transition-transform">
          <h3 className="text-lg font-semibold text-gray-700">Faturamento</h3>
          <p className="text-3xl font-bold text-green-600">R$ {(stats?.totalVendasPagas || 0).toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">Apenas vendas pagas</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500 transform hover:scale-105 transition-transform">
          <h3 className="text-lg font-semibold text-gray-700">Processos</h3>
          <p className="text-3xl font-bold text-orange-600">{stats?.processosPendentes || 0}</p>
          <p className="text-sm text-gray-500 mt-2">Em andamento</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500 transform hover:scale-105 transition-transform">
          <h3 className="text-lg font-semibold text-gray-700">Ticket Médio</h3>
          <p className="text-3xl font-bold text-purple-600">R$ {(stats?.ticketMedio || 0).toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">Vendas pagas</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500 transform hover:scale-105 transition-transform">
          <h3 className="text-lg font-semibold text-gray-700">Pendentes</h3>
          <p className="text-3xl font-bold text-red-600">{stats?.pagamentosPendentes || 0}</p>
          <p className="text-sm text-gray-500 mt-2">Pagamentos</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Vendas Recentes</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {vendedorVendas.slice(0, 5).map((venda, index) => (
              <div key={`venda-recente-${venda.id}-${index}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{venda.cliente}</p>
                  <p className="text-sm text-gray-600">{venda.servico}</p>
                  <p className="text-xs text-gray-500">por {venda.vendedor}</p>
                  <p className="text-xs text-blue-600">{venda.formaPagamento}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">R$ {(venda.valorParcela || venda.valor).toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{venda.data}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    venda.statusPagamento === 'Pago' ? 'bg-green-100 text-green-800' : 
                    venda.statusPagamento === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {venda.statusPagamento}
                    {venda.parcelaAtual && venda.totalParcelas && (
                      <span className="ml-1">{venda.parcelaAtual}/{venda.totalParcelas}</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Próximos Vencimentos</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {vendedorVendas.filter(v => v.proximoVencimento && v.statusPagamento === 'Pendente').slice(0, 5).map((venda, index) => (
              <div key={`venda-vencimento-${venda.id}-${index}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{venda.cliente}</p>
                  <p className="text-sm text-gray-600">{venda.servico}</p>
                  <p className="text-xs text-gray-500">{venda.formaPagamento}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-600">{venda.proximoVencimento}</p>
                  <p className="text-sm text-gray-500">Próximo vencimento</p>
                  <Clock className="h-4 w-4 text-orange-500 inline" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// RELATÓRIO DE PERFORMANCE ATUALIZADO
const RelatorioPerformance = ({ vendas, currentUser, filtroRelatorios, setFiltroRelatorios }) => {
  // Filtrar vendas por período primeiro
  const vendasFiltradas = (vendas || []).filter(v => 
    v.vendedor === currentUser?.nome && 
    filtrarDataPorPeriodo(v.data, filtroRelatorios)
  );
  
  const vendasPagas = vendasFiltradas.filter(v => v.statusPagamento === 'Pago');
  const vendasPendentes = vendasFiltradas.filter(v => v.statusPagamento === 'Pendente');
  const vendasRecusadas = vendasFiltradas.filter(v => v.statusPagamento === 'Recusado');
  
  const totalPago = vendasPagas.reduce((acc, v) => acc + (v.valorParcela || v.valor), 0);
  const totalPendente = vendasPendentes.reduce((acc, v) => acc + (v.valorParcela || v.valor), 0);
  const totalRecusado = vendasRecusadas.reduce((acc, v) => acc + (v.valorParcela || v.valor), 0);
  
  const totalComissoes = vendasPagas.reduce((acc, v) => acc + (v.comissao || 0), 0);
  
  const metas = [
    { valor: 3000, bonus: 150, label: "Meta Bronze" },
    { valor: 5000, bonus: 200, label: "Meta Prata" },
    { valor: 10000, bonus: 250, label: "Meta Ouro" }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Relatório de Performance - {currentUser?.nome}</h1>
        <FiltroData 
          filtro={filtroRelatorios}
          onChange={setFiltroRelatorios}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-700">Vendas Pagas</h3>
          <p className="text-3xl font-bold text-green-600">R$ {totalPago.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">{vendasPagas.length} vendas</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
          <h3 className="text-lg font-semibold text-gray-700">Vendas Pendentes</h3>
          <p className="text-3xl font-bold text-yellow-600">R$ {totalPendente.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">{vendasPendentes.length} vendas</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500">
          <h3 className="text-lg font-semibold text-gray-700">Vendas Recusadas</h3>
          <p className="text-3xl font-bold text-red-600">R$ {totalRecusado.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">{vendasRecusadas.length} vendas</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-700">Total Comissões</h3>
          <p className="text-3xl font-bold text-blue-600">R$ {totalComissoes.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">Apenas vendas pagas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {metas.map((meta, index) => (
          <ProgressBar
            key={index}
            current={totalPago}
            target={meta.valor}
            bonus={meta.bonus}
            label={meta.label}
          />
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Detalhamento de Vendas</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
<th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comissão</th>
               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-gray-200">
             {vendasFiltradas.map(venda => (
               <tr key={venda.id} className="hover:bg-gray-50 transition-colors">
                 <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{venda.cliente}</td>
                 <td className="px-6 py-4 whitespace-nowrap text-gray-500">{venda.servico}</td>
                 <td className="px-6 py-4 whitespace-nowrap text-green-600 font-bold">
                   R$ {(venda.valorParcela || venda.valor).toFixed(2)}
                   {venda.parcelaAtual && venda.totalParcelas && (
                     <span className="text-xs text-gray-500 ml-1">({venda.parcelaAtual}/{venda.totalParcelas})</span>
                   )}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-bold">
                   R$ {venda.statusPagamento === 'Pago' ? (venda.comissao || 0).toFixed(2) : '0.00'}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                   <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                     venda.statusPagamento === 'Pago' ? 'bg-green-100 text-green-800' : 
                     venda.statusPagamento === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                     'bg-red-100 text-red-800'
                   }`}>
                     {venda.statusPagamento}
                   </span>
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-gray-500">{venda.data}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     </div>
   </div>
 );
};

// COMPONENTE USUÁRIOS ONLINE
const UsuariosOnline = ({ usuariosOnline, currentUser }) => (
 <div className="bg-white rounded-lg shadow-md p-4 mb-4">
   <div className="flex items-center mb-3">
     <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
     <h3 className="font-semibold text-gray-800">Online ({usuariosOnline.length})</h3>
   </div>
   <div className="space-y-2 max-h-32 overflow-y-auto">
     {usuariosOnline.map(user => (
       <div key={user.id} className="flex items-center space-x-2">
         <div className={`w-2 h-2 rounded-full ${
           user.id === currentUser?.id ? 'bg-blue-500' : 'bg-green-500'
         }`}></div>
         <span className="text-sm text-gray-700">
           {user.nome} {user.id === currentUser?.id && '(você)'}
         </span>
         <span className="text-xs text-gray-500">
           {user.role === 'admin' ? '👑' : '💼'}
         </span>
       </div>
     ))}
   </div>
 </div>
);

// MENU LATERAL
const MenuLateral = ({ currentUser, activeTab, setActiveTab, exportarDados, importarDados, handleLogout, usuariosOnline }) => {
 const isAdmin = currentUser?.role === 'admin';
 
 return (
   <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white p-4 h-full shadow-xl">
     <div className="mb-6">
       <h2 className="text-xl font-bold mb-2">Sistema Inove</h2>
       <div className="text-sm bg-blue-700 rounded-lg p-2">
         <p className="font-medium">{currentUser?.nome}</p>
         <p className="text-blue-200 text-xs">{isAdmin ? 'Administrador' : 'Vendedor'}</p>
       </div>
     </div>
     
     <nav className="space-y-2 mb-6">
       <button
         onClick={() => setActiveTab('dashboard')}
         className={`flex items-center w-full p-3 rounded-lg transition-all ${
           activeTab === 'dashboard' ? 'bg-blue-700 shadow-md' : 'hover:bg-blue-800'
         }`}
       >
         <BarChart3 className="mr-3 h-5 w-5" />
         Dashboard
       </button>
       
       {isAdmin && (
         <button
           onClick={() => setActiveTab('vendedores')}
           className={`flex items-center w-full p-3 rounded-lg transition-all ${
             activeTab === 'vendedores' ? 'bg-blue-700 shadow-md' : 'hover:bg-blue-800'
           }`}
         >
           <Users className="mr-3 h-5 w-5" />
           Vendedores
         </button>
       )}
       
       <button
         onClick={() => setActiveTab('clientes')}
         className={`flex items-center w-full p-3 rounded-lg transition-all ${
           activeTab === 'clientes' ? 'bg-blue-700 shadow-md' : 'hover:bg-blue-800'
         }`}
       >
         <Users className="mr-3 h-5 w-5" />
         Clientes
       </button>
       <button
         onClick={() => setActiveTab('vendas')}
         className={`flex items-center w-full p-3 rounded-lg transition-all ${
           activeTab === 'vendas' ? 'bg-blue-700 shadow-md' : 'hover:bg-blue-800'
         }`}
       >
         <DollarSign className="mr-3 h-5 w-5" />
         Vendas
       </button>
       <button
         onClick={() => setActiveTab('processos')}
         className={`flex items-center w-full p-3 rounded-lg transition-all ${
           activeTab === 'processos' ? 'bg-blue-700 shadow-md' : 'hover:bg-blue-800'
         }`}
       >
         <FileText className="mr-3 h-5 w-5" />
         Processos
       </button>
       <button
         onClick={() => setActiveTab('cursos')}
         className={`flex items-center w-full p-3 rounded-lg transition-all ${
           activeTab === 'cursos' ? 'bg-blue-700 shadow-md' : 'hover:bg-blue-800'
         }`}
       >
         <BookOpen className="mr-3 h-5 w-5" />
         Cursos
       </button>
       
       <button
         onClick={() => setActiveTab('relatorios')}
         className={`flex items-center w-full p-3 rounded-lg transition-all ${
           activeTab === 'relatorios' ? 'bg-blue-700 shadow-md' : 'hover:bg-blue-800'
         }`}
       >
         <BarChart3 className="mr-3 h-5 w-5" />
         {isAdmin ? 'Relatórios' : 'Performance'}
       </button>
     </nav>
     
     <div className="space-y-2">
       {/* COMPONENTE USUÁRIOS ONLINE */}
       <UsuariosOnline usuariosOnline={usuariosOnline} currentUser={currentUser} />

       {isAdmin && (
         <>
           <button
             onClick={exportarDados}
             className="flex items-center w-full p-3 rounded-lg hover:bg-blue-800 transition-colors text-sm"
           >
             <Download className="mr-3 h-4 w-4" />
             Backup
           </button>
           
           <label className="flex items-center w-full p-3 rounded-lg hover:bg-blue-800 transition-colors text-sm cursor-pointer">
             <Upload className="mr-3 h-4 w-4" />
             Importar
             <input
               type="file"
               accept=".json"
               onChange={importarDados}
               className="hidden"
             />
           </label>
         </>
       )}
       
       <button
         onClick={handleLogout}
         className="flex items-center w-full p-3 rounded-lg hover:bg-red-600 transition-colors text-sm mt-4"
       >
         <LogOut className="mr-3 h-4 w-4" />
         Sair
       </button>
     </div>
   </div>
 );
};

// COMPONENTE PRINCIPAL
const SistemaGestaoMultas = () => {
 // Estados principais
 const [isLoggedIn, setIsLoggedIn] = useState(false);
 const [currentUser, setCurrentUser] = useState(null);
 const [showPassword, setShowPassword] = useState(false);
 const [activeTab, setActiveTab] = useState('dashboard');

 // Estados de dados
 const [clientes, setClientes] = useState([]);
 const [vendas, setVendas] = useState([]);
 const [processos, setProcessos] = useState([]);
 const [cursos, setCursos] = useState([]);
 const [vendedores, setVendedores] = useState([]);
 
 // ESTADO PARA USUÁRIOS ONLINE
 const [usuariosOnline, setUsuariosOnline] = useState([]);

 const [filtroDashboard, setFiltroDashboard] = useState({
   periodo: 'todos',
   mesEspecifico: '',
   anoEspecifico: new Date().getFullYear().toString()
 });
 const [filtroRelatorios, setFiltroRelatorios] = useState({
   periodo: 'todos',
   mesEspecifico: '',
   anoEspecifico: new Date().getFullYear().toString()
 });

 // Estados de formulários
 const [novoCliente, setNovoCliente] = useState({
   nome: '', cpf: '', cnh: '', telefone: '', email: ''
 });

 const [novaVenda, setNovaVenda] = useState({
   cliente: '', 
   servico: '', 
   valor: '', 
   data: new Date().toISOString().split('T')[0], 
   formaPagamento: '',
   observacoes: '',
   valorEntrada: '',
   quantidadeMultas: '',
   quantidadeSuspensao: ''
 });

 const [novoProcesso, setNovoProcesso] = useState({
   cliente: '', tipo: '', numero: '', orgao: '', valor: '', prazo: '', responsavel: ''
 });

 // Estados para vendedores
 const [novoVendedor, setNovoVendedor] = useState({
   nome: '', username: '', password: '', comissao: '52.5'
 });

 const [vendedorEditando, setVendedorEditando] = useState(null);

 // Estados para edição de vendas
 const [vendaEditando, setVendaEditando] = useState(null);
 const [editandoVenda, setEditandoVenda] = useState({});

 // Estados para edição de órgão em processos
 const [processoEditandoOrgao, setProcessoEditandoOrgao] = useState(null);
 const [orgaoEditando, setOrgaoEditando] = useState('');

 // Estados de filtros e busca
 const [filtroClientes, setFiltroClientes] = useState('');
 const [filtroVendas, setFiltroVendas] = useState({ 
   vendedor: '', 
   status: '', 
   periodo: 'todos', 
   mesEspecifico: '',
   anoEspecifico: new Date().getFullYear().toString(),
   statusPagamento: ''
 });
 const [filtroProcessos, setFiltroProcessos] = useState({ status: '', orgao: '' });

 // Estados de validação
 const [erros, setErros] = useState({});

 // Login/Logout
 const [loginData, setLoginData] = useState({ username: '', password: '' });

 // Listas auxiliares
 const anos = Array.from({ length: 31 }, (_, i) => 2020 + i);
 const meses = [
   { value: '01', label: 'Janeiro' },
   { value: '02', label: 'Fevereiro' },
   { value: '03', label: 'Março' },
   { value: '04', label: 'Abril' },
   { value: '05', label: 'Maio' },
   { value: '06', label: 'Junho' },
   { value: '07', label: 'Julho' },
   { value: '08', label: 'Agosto' },
   { value: '09', label: 'Setembro' },
   { value: '10', label: 'Outubro' },
   { value: '11', label: 'Novembro' },
   { value: '12', label: 'Dezembro' }
 ];

 // CARREGAR DADOS DO BANCO QUANDO FAZER LOGIN
 useEffect(() => {
   let mounted = true;
   
   const carregarDadosIniciais = async () => {
     if (!isLoggedIn || !mounted) return;
     
     try {
       toast.loading('Carregando dados...', { id: 'loading-data' });
       
       const conexaoOk = await testarConexao();
       if (!conexaoOk) {
         toast.error('Erro de conexão com o banco!');
         return;
       }
       
       const [clientesDoBanco, vendasDoBanco, processosDoBanco, cursosDoBanco, usuariosDoBanco] = await Promise.all([
         buscarClientes(),
         buscarVendas(),
         buscarProcessos(),
         buscarCursos(),
         buscarUsuarios()
       ]);

       if (mounted) {
         setClientes(clientesDoBanco || []);
         setVendas(vendasDoBanco || []);
         setProcessos(processosDoBanco || []);
         setCursos(cursosDoBanco || []);
         setVendedores(usuariosDoBanco || []);
         toast.success('Dados carregados!');
       }
       
     } catch (error) {
       console.error('❌ Erro ao carregar dados:', error);
       if (mounted) {
         toast.error('Erro ao carregar dados do banco.');
       }
     }
   };
   
   carregarDadosIniciais();
   
   // Realtime subscriptions
   let subscriptions = [];
   if (isLoggedIn) {
     subscriptions.push(createSubscription('clientes', () => carregarDadosIniciais()));
     subscriptions.push(createSubscription('vendas', () => carregarDadosIniciais()));
     subscriptions.push(createSubscription('processos', () => carregarDadosIniciais()));
     subscriptions.push(createSubscription('cursos', () => carregarDadosIniciais()));
   }

   return () => {
     mounted = false;
     subscriptions.forEach(sub => removeSubscription(sub));
   };
 }, [isLoggedIn]);

 // useEffect PARA PRESENÇA ONLINE
 useEffect(() => {
   let heartbeatInterval;
   let presenceSubscription;
   
   if (isLoggedIn && currentUser) {
     // Marcar como online ao fazer login
     marcarUsuarioOnline(currentUser.id);
     
     // Heartbeat a cada 30 segundos
     heartbeatInterval = setInterval(() => {
       atualizarHeartbeat(currentUser.id);
     }, 30000);
     
     // Subscription para mudanças em tempo real
     presenceSubscription = createSubscription('usuarios', async () => {
       const online = await buscarUsuariosOnline();
       setUsuariosOnline(online);
     });
     
     // Carregar usuários online inicial
     const carregarOnline = async () => {
       const online = await buscarUsuariosOnline();
       setUsuariosOnline(online);
     };
     carregarOnline();
     
     // Marcar como offline ao sair
     const handleBeforeUnload = () => {
       marcarUsuarioOffline(currentUser.id);
     };
     
     window.addEventListener('beforeunload', handleBeforeUnload);
     
     return () => {
       clearInterval(heartbeatInterval);
       if (presenceSubscription) removeSubscription(presenceSubscription);
       window.removeEventListener('beforeunload', handleBeforeUnload);
       marcarUsuarioOffline(currentUser.id);
     };
   }
 }, [isLoggedIn, currentUser]);

 // Função de login
 const handleLogin = useCallback(async (e) => {
   e.preventDefault();
   
   try {
     const user = await autenticarUsuario(loginData.username, loginData.password);
     
     if (user) {
       setCurrentUser(user);
       setIsLoggedIn(true);
       setLoginData({ username: '', password: '' });
       toast.success(`Bem-vindo, ${user.nome}!`);
     } else {
       toast.error('Usuário ou senha inválidos!');
     }
   } catch (error) {
     console.error('Erro no login:', error);
     toast.error('Erro ao fazer login!');
   }
 }, [loginData]);

 // Função de logout ATUALIZADA
 const handleLogout = useCallback(async () => {
   if (currentUser) {
     await marcarUsuarioOffline(currentUser.id);
   }
   setCurrentUser(null);
   setIsLoggedIn(false);
   setActiveTab('dashboard');
   setUsuariosOnline([]);
   toast.success('Você saiu com sucesso!');
 }, [currentUser]);

 // Função de atualização de dados
 const atualizarDados = useCallback(async () => {
   try {
     console.log('🔄 Atualizando todos os dados...');
     toast.loading('Atualizando dados...');
     
     const [clientesDoBanco, vendasDoBanco, processosDoBanco, cursosDoBanco] = await Promise.all([
       buscarClientes(),
       buscarVendas(),
       buscarProcessos(),
       buscarCursos()
     ]);
     
     setClientes(clientesDoBanco || []);
     setVendas(vendasDoBanco || []);
     setProcessos(processosDoBanco || []);
     setCursos(cursosDoBanco || []);
     
     console.log('✅ Dados atualizados:', {
       clientes: clientesDoBanco?.length || 0,
       vendas: vendasDoBanco?.length || 0,
       processos: processosDoBanco?.length || 0,
       cursos: cursosDoBanco?.length || 0
     });
     
     toast.success('Dados atualizados!');
   } catch (error) {
     console.error('❌ Erro ao atualizar dados:', error);
     toast.error('Erro ao atualizar dados.');
   }
 }, []);

 // Função para criar curso automaticamente
 const criarCursoAutomatico = useCallback(async (venda) => {
   if (venda.servico === 'Curso de Reciclagem') {
     try {
       const novoCurso = {
         cliente: venda.cliente,
         tipo: 'Curso de Reciclagem',
         turma: '',
         inicio: '',
         fim: '',
         status: 'Aguardando',
         instrutor: '',
         vendaId: venda.id
       };
       
       await salvarCurso(novoCurso);
       
       // Atualizar lista de cursos
       const cursosAtualizados = await buscarCursos();
       setCursos(cursosAtualizados);
       
       toast.success('Curso criado automaticamente!');
     } catch (error) {
       console.error('Erro ao criar curso:', error);
       toast.error('Falha ao criar curso.');
     }
   }
 }, []);

 // FUNÇÃO PARA CRIAR PROCESSO AUTOMATICAMENTE
 const criarProcessoAutomatico = useCallback(async (venda) => {
   console.log('🔄 Tentando criar processo para venda:', venda);
   
   if (venda.servico.includes('Recurso de Multa') || venda.servico.includes('Recurso de Suspensão')) {
     // Verificar se já existe processo para esta venda
     const processoExistente = processos.find(p => p.vendaId === venda.id);

     if (!processoExistente) {
       let tipo = '';
       if (venda.servico === 'Recurso de Multa') tipo = 'Recurso de Multa';
       else if (venda.servico === 'Recurso de Suspensão CNH') tipo = 'Recurso de Suspensão CNH';
       else if (venda.servico === 'Recurso de Multa + Recurso de Suspensão') tipo = 'Recurso de Multa + Suspensão CNH';
       
       const novoProcessoData = {
         cliente: venda.cliente,
         tipo: tipo,
         numero: `AUTO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
         orgao: 'A definir',
         valor: venda.valor,
         status: 'Em Andamento',
         prazo: '',
         responsavel: venda.vendedor,
         vendaId: venda.id,
         quantidadeMultas: venda.quantidadeMultas,
         quantidadeSuspensao: venda.quantidadeSuspensao
       };
       
       try {
         const processoSalvo = await salvarProcesso(novoProcessoData);
         
         // Atualizar lista de processos
         const processosAtualizados = await buscarProcessos();
         setProcessos(processosAtualizados);
         
         console.log('✅ Processo criado:', processoSalvo);
         toast.success(`Processo ${processoSalvo.numero} criado automaticamente!`);
       } catch (error) {
         console.error('❌ Erro ao salvar processo:', error);
         toast.error('Falha ao criar processo.');
       }
     } else {
       console.log('⚠️ Processo já existe para esta venda');
     }
   }
 }, [processos]);

 // Adicionar vendedor
 const adicionarVendedor = useCallback(async () => {
   const novosErros = {};
   
   if (!novoVendedor.nome.trim()) novosErros.nome = 'Nome é obrigatório';
   if (!novoVendedor.username.trim()) novosErros.username = 'Username é obrigatório';
   if (!novoVendedor.password.trim()) novosErros.password = 'Senha é obrigatória';
   if (!novoVendedor.comissao || parseFloat(novoVendedor.comissao) <= 0) novosErros.comissao = 'Comissão deve ser maior que 0';
   
   if (vendedores.find(v => v.username === novoVendedor.username && v.id !== vendedorEditando?.id)) {
     novosErros.username = 'Username já existe';
   }

   if (Object.keys(novosErros).length > 0) {
     setErros(novosErros);
     return;
   }

   try {
     const vendedorCompleto = {
       ...novoVendedor,
       role: 'vendedor',
       comissao: parseFloat(novoVendedor.comissao)
     };
     
     await salvarUsuario(vendedorCompleto);
     
     // Atualizar lista
     const usuariosAtualizados = await buscarUsuarios();
     setVendedores(usuariosAtualizados);
     
     setNovoVendedor({ nome: '', username: '', password: '', comissao: '52.5' });
     setErros({});
     toast.success('Vendedor adicionado com sucesso!');
   } catch (error) {
     console.error('Erro ao adicionar vendedor:', error);
     toast.error('Erro ao adicionar vendedor.');
   }
 }, [novoVendedor, vendedores, vendedorEditando]);

 const editarVendedor = useCallback(async () => {
   const novosErros = {};
   
   if (!novoVendedor.nome.trim()) novosErros.nome = 'Nome é obrigatório';
   if (!novoVendedor.username.trim()) novosErros.username = 'Username é obrigatório';
   if (!novoVendedor.comissao || parseFloat(novoVendedor.comissao) <= 0) novosErros.comissao = 'Comissão deve ser maior que 0';
   
   if (vendedores.find(v => v.username === novoVendedor.username && v.id !== vendedorEditando.id)) {
     novosErros.username = 'Username já existe';
   }

   if (Object.keys(novosErros).length > 0) {
     setErros(novosErros);
     return;
   }

   try {
     const dadosAtualizacao = {
       nome: novoVendedor.nome,
       username: novoVendedor.username,
       comissao: parseFloat(novoVendedor.comissao)
     };
     
     if (novoVendedor.password) {
       dadosAtualizacao.password = novoVendedor.password;
     }
     
     await atualizarUsuario(vendedorEditando.id, dadosAtualizacao);
     
     // Atualizar lista
     const usuariosAtualizados = await buscarUsuarios();
     setVendedores(usuariosAtualizados);
     
     setVendedorEditando(null);
     setNovoVendedor({ nome: '', username: '', password: '', comissao: '52.5' });
     setErros({});
     toast.success('Vendedor atualizado com sucesso!');
   } catch (error) {
     console.error('Erro ao atualizar vendedor:', error);
     toast.error('Erro ao atualizar vendedor.');
   }
 }, [novoVendedor, vendedores, vendedorEditando]);

 const deletarVendedor = useCallback(async (id) => {
   if (window.confirm('Tem certeza que deseja deletar este vendedor?')) {
     try {
       await deletarUsuario(id);
       
       // Atualizar lista
       const usuariosAtualizados = await buscarUsuarios();
       setVendedores(usuariosAtualizados);
       
       toast.success('Vendedor deletado com sucesso!');
     } catch (error) {
       console.error('Erro ao deletar vendedor:', error);
       toast.error('Erro ao deletar vendedor.');
     }
   }
 }, []);

 // CRUD CLIENTES
 const adicionarCliente = useCallback(async () => {
   const novosErros = {};
   
   if (!novoCliente.nome.trim()) novosErros.nome = 'Nome é obrigatório';
   if (!novoCliente.cpf.trim()) novosErros.cpf = 'CPF é obrigatório';
   else if (!validarCPF(novoCliente.cpf)) novosErros.cpf = 'CPF inválido';
   if (novoCliente.email && !validarEmail(novoCliente.email)) novosErros.email = 'Email inválido';
   if (novoCliente.telefone && !validarTelefone(novoCliente.telefone)) novosErros.telefone = 'Telefone inválido';

   if (Object.keys(novosErros).length > 0) {
     setErros(novosErros);
     return;
   }

   try {
     const clienteCompleto = {
       ...novoCliente,
       nome: novoCliente.nome.trim(),
       cpf: novoCliente.cpf.replace(/\D/g, ''),
       status: 'Ativo',
       dataCadastro: new Date().toISOString().split('T')[0],
       vendedor: currentUser?.nome
     };
     
     await salvarCliente(clienteCompleto);
     
     // Atualizar lista de clientes
     const clientesAtualizados = await buscarClientes();
     setClientes(clientesAtualizados);
     
     setNovoCliente({ nome: '', cpf: '', cnh: '', telefone: '', email: '' });
     setErros({});
     toast.success('Cliente salvo com sucesso!');
     
   } catch (error) {
     console.error('Erro ao salvar cliente:', error);
     toast.error('Erro ao salvar cliente.');
   }
 }, [novoCliente, currentUser]);

 // CRUD VENDAS - CORRIGIDO PARA CRIAR PARCELAS AUTOMÁTICAS
 const adicionarVenda = useCallback(async () => {
   const novosErros = {};
   
   if (!novaVenda.cliente) novosErros.cliente = 'Cliente é obrigatório';
   if (!novaVenda.servico) novosErros.servico = 'Serviço é obrigatório';
   if (!novaVenda.valor || parseFloat(novaVenda.valor) <= 0) novosErros.valor = 'Valor deve ser maior que 0';
   if (!novaVenda.formaPagamento) novosErros.formaPagamento = 'Forma de pagamento é obrigatória';
   
   if (novaVenda.formaPagamento === 'PIX + Cartão' && (!novaVenda.valorEntrada || parseFloat(novaVenda.valorEntrada) <= 0)) {
novosErros.valorEntrada = 'Valor de entrada é obrigatório';
   }
   
   if ((novaVenda.servico === 'Recurso de Multa' || novaVenda.servico === 'Recurso de Multa + Recurso de Suspensão') &&
    (!novaVenda.quantidadeMultas || parseInt(novaVenda.quantidadeMultas) <= 0)) {
     novosErros.quantidadeMultas = 'Quantidade de multas é obrigatória';
   }
   
   if ((novaVenda.servico === 'Recurso de Suspensão CNH' || novaVenda.servico === 'Recurso de Multa + Recurso de Suspensão') && 
       (!novaVenda.quantidadeSuspensao || parseInt(novaVenda.quantidadeSuspensao) <= 0)) {
     novosErros.quantidadeSuspensao = 'Quantidade de processos de suspensão é obrigatória';
   }

   if (Object.keys(novosErros).length > 0) {
     setErros(novosErros);
     return;
   }

   try {
     const valor = parseFloat(novaVenda.valor);
     const vendedorAtual = vendedores?.find(v => v.nome === currentUser?.nome);
     const percentualComissao = vendedorAtual?.comissao || 52.5;
     
     let totalParcelas = 1;
     const match = novaVenda.formaPagamento.match(/(\d+)x/);
     if (match) {
       totalParcelas = parseInt(match[1]);
     }
     
     console.log('🔍 DEBUG - Forma de pagamento:', novaVenda.formaPagamento);
     console.log('🔍 DEBUG - Total de parcelas detectado:', totalParcelas);
     
     const valorParcela = totalParcelas > 1 ? valor / totalParcelas : valor;
     const comissaoParcela = valorParcela * (percentualComissao / 100);
     
     // PRIMEIRA PARCELA
     const vendaPrincipal = {
       ...novaVenda,
       vendedor: currentUser?.nome,
       status: 'Pendente',
       valor: valor,
       valorParcela: valorParcela,
       comissao: comissaoParcela,
       statusPagamento: 'Pendente',
       proximoVencimento: totalParcelas > 1 ? calcularProximoVencimento(novaVenda.data, 1) : null,
       valorEntrada: novaVenda.valorEntrada ? parseFloat(novaVenda.valorEntrada) : null,
       quantidadeMultas: novaVenda.quantidadeMultas ? parseInt(novaVenda.quantidadeMultas) : null,
       quantidadeSuspensao: novaVenda.quantidadeSuspensao ? parseInt(novaVenda.quantidadeSuspensao) : null,
       totalParcelas,
       parcelaAtual: 1,
       processoJaCriado: false,
       vendaPrincipalId: null
     };
     
     console.log('🔍 DEBUG - Dados da primeira parcela:', vendaPrincipal);
     
     // Salvar a primeira parcela
     const vendaSalva = await salvarVenda(vendaPrincipal);
     console.log('✅ Primeira parcela salva:', vendaSalva);
     
     // ✅ CRIAR DEMAIS PARCELAS SE FOR PARCELADO
     if (totalParcelas > 1) {
       console.log(`🔄 Criando ${totalParcelas - 1} parcelas adicionais...`);
       
       const parcelasParaCriar = [];
       for (let i = 2; i <= totalParcelas; i++) {
         const dataVencimento = calcularProximoVencimento(novaVenda.data, i - 1);
         console.log(`🔍 DEBUG - Parcela ${i}: Data base: ${novaVenda.data}, Meses a adicionar: ${i - 1}, Data resultado: ${dataVencimento}`);
         
         const novaParcela = {
           cliente: novaVenda.cliente,
           vendedor: currentUser?.nome,
           servico: novaVenda.servico,
           valor: valor,
           data: dataVencimento,
           statusPagamento: 'Pendente',
           formaPagamento: novaVenda.formaPagamento,
           observacoes: `Parcela ${i}/${totalParcelas}`,
           comissao: comissaoParcela,
           quantidadeMultas: novaVenda.quantidadeMultas ? parseInt(novaVenda.quantidadeMultas) : null,
           quantidadeSuspensao: novaVenda.quantidadeSuspensao ? parseInt(novaVenda.quantidadeSuspensao) : null,
           valorParcela: valorParcela,
           totalParcelas: totalParcelas,
           parcelaAtual: i,
           proximoVencimento: null,
           processoJaCriado: true,
           vendaPrincipalId: vendaSalva.id,
           valorEntrada: null
         };
         
         parcelasParaCriar.push(novaParcela);
         console.log(`🔍 DEBUG - Parcela ${i} preparada:`, novaParcela);
       }
       
       if (parcelasParaCriar.length > 0) {
         console.log('🔄 Salvando parcelas:', parcelasParaCriar);
         try {
           await salvarParcelas(parcelasParaCriar);
           console.log('✅ Parcelas adicionais criadas com sucesso!');
         } catch (error) {
           console.error('❌ Erro ao salvar parcelas:', error);
           alert('❌ Erro ao criar parcelas: ' + error.message);
         }
       }
     } else {
       console.log('ℹ️ Venda à vista - não precisa criar parcelas');
     }
     
     // Criar curso se necessário
     if (novaVenda.servico === 'Curso de Reciclagem') {
       await criarCursoAutomatico(vendaSalva);
     }
     
     // ATUALIZAR A LISTA DE VENDAS IMEDIATAMENTE
     const vendasAtualizadas = await buscarVendas();
     setVendas(vendasAtualizadas);
     console.log('✅ Lista de vendas atualizada. Total:', vendasAtualizadas.length);
     
     // Limpar formulário
     setNovaVenda({ 
       cliente: '', 
       servico: '', 
       valor: '', 
       data: new Date().toISOString().split('T')[0], 
       formaPagamento: '',
       observacoes: '',
       valorEntrada: '',
       quantidadeMultas: '',
       quantidadeSuspensao: ''
     });
     setErros({});
     
     toast.success('Venda registrada com sucesso!');
     
   } catch (error) {
     console.error('❌ Erro ao adicionar venda:', error);
     toast.error(`Erro ao salvar venda: ${error.message}`);
   }
 }, [novaVenda, vendedores, currentUser, criarCursoAutomatico]);

 const adicionarProcesso = useCallback(async () => {
   const novosErros = {};
   
   if (!novoProcesso.cliente) novosErros.cliente = 'Cliente é obrigatório';
   if (!novoProcesso.tipo) novosErros.tipo = 'Tipo é obrigatório';
   if (!novoProcesso.numero.trim()) novosErros.numero = 'Número do processo é obrigatório';
   if (!novoProcesso.orgao.trim()) novosErros.orgao = 'Órgão é obrigatório';
   if (!novoProcesso.valor || parseFloat(novoProcesso.valor) <= 0) novosErros.valor = 'Valor deve ser maior que 0';

   if (Object.keys(novosErros).length > 0) {
     setErros(novosErros);
     return;
   }

   try {
     const processoCompleto = {
       ...novoProcesso,
       status: 'Em Andamento',
       valor: parseFloat(novoProcesso.valor)
     };
     await salvarProcesso(processoCompleto);
     
     // Atualizar lista de processos
     const processosAtualizados = await buscarProcessos();
     setProcessos(processosAtualizados);
     
     setNovoProcesso({ cliente: '', tipo: '', numero: '', orgao: '', valor: '', prazo: '', responsavel: '' });
     setErros({});
     toast.success('Processo adicionado com sucesso!');
   } catch(error) {
     console.error('Erro ao adicionar processo:', error);
     toast.error('Erro ao adicionar processo.');
   }
 }, [novoProcesso]);

 // Função para alterar status do cliente
 const alterarStatusCliente = useCallback(async (id, novoStatus) => {
   try {
     await atualizarCliente(id, { status: novoStatus });
     
     // Atualizar lista de clientes
     const clientesAtualizados = await buscarClientes();
     setClientes(clientesAtualizados);
     
     toast.success(`Status do cliente alterado para ${novoStatus}!`);
   } catch (error) {
     console.error('Erro ao atualizar status:', error);
     toast.error('Erro ao atualizar status.');
   }
 }, []);

 // Função para alterar status de processo
 const alterarStatusProcesso = useCallback(async (id, novoStatus) => {
   try {
     await atualizarProcesso(id, { status: novoStatus });
     
     // Atualizar lista de processos
     const processosAtualizados = await buscarProcessos();
     setProcessos(processosAtualizados);
     
     toast.success(`Status do processo alterado para ${novoStatus}!`);
   } catch (error) {
     console.error('Erro ao atualizar status do processo:', error);
     toast.error('Erro ao atualizar status do processo.');
   }
 }, []);

 // Função para alterar status de curso
 const alterarStatusCurso = useCallback(async (id, novoStatus) => {
   try {
     await atualizarCurso(id, { status: novoStatus });
     
     // Atualizar lista de cursos
     const cursosAtualizados = await buscarCursos();
     setCursos(cursosAtualizados);
     
     toast.success(`Status do curso alterado para ${novoStatus}!`);
   } catch (error) {
     console.error('Erro ao atualizar status do curso:', error);
     toast.error('Erro ao atualizar status do curso.');
   }
 }, []);

 // FUNÇÃO PARA ALTERAR STATUS DE PAGAMENTO (SIMPLIFICADA)
 const alterarStatusPagamento = useCallback(async (id, novoStatus) => {
   const vendaOriginal = vendas.find(v => v.id === id);
   if (!vendaOriginal) return;

   try {
     console.log('🔄 Alterando status de pagamento:', { id, novoStatus, venda: vendaOriginal });
     
     await atualizarVenda(id, { statusPagamento: novoStatus });
     
     if (novoStatus === 'Pago' && vendaOriginal.statusPagamento !== 'Pago') {
       // ✅ CRIAR PROCESSO APENAS SE FOR A PRIMEIRA PARCELA OU SE NÃO EXISTIR PROCESSO
       if (vendaOriginal.servico.includes('Recurso de Multa') || vendaOriginal.servico.includes('Recurso de Suspensão')) {
         
         // Verificar se já existe processo para este cliente e serviço
         const vendaPrincipalId = vendaOriginal.vendaPrincipalId || vendaOriginal.id;
         const processoExistente = processos.find(p => 
           p.cliente === vendaOriginal.cliente && 
           p.tipo.includes('Recurso') &&
           (p.vendaId === vendaPrincipalId || p.vendaId === vendaOriginal.id)
         );
         
         console.log('🔍 Verificando processo existente:', {
           cliente: vendaOriginal.cliente,
           vendaPrincipalId,
           processoExistente: !!processoExistente
         });
         
         // Só criar processo se não existir
         if (!processoExistente) {
           console.log('✅ Criando processo - primeiro pagamento desta venda');
           await criarProcessoAutomatico(vendaOriginal);
           
           // Marcar todas as parcelas desta venda como "processo já criado"
           const vendasParaAtualizar = vendas.filter(v => 
             v.cliente === vendaOriginal.cliente &&
             v.servico === vendaOriginal.servico &&
             (v.vendaPrincipalId === vendaPrincipalId || v.id === vendaPrincipalId)
           );
           
           for (const vendaParaAtualizar of vendasParaAtualizar) {
             if (vendaParaAtualizar.id !== id) { // Não atualizar a venda atual novamente
               await atualizarVenda(vendaParaAtualizar.id, { processoJaCriado: true });
             }
           }
           
         } else {
           console.log('ℹ️ Processo já existe - não criando duplicado');
         }
       }
     }
     
     // Forçar atualização da lista
     const vendasAtualizadas = await buscarVendas();
     setVendas(vendasAtualizadas);
     
     toast.success(`Status de pagamento alterado para ${novoStatus}!`);
   } catch (error) {
     console.error('❌ Erro ao atualizar status:', error);
     toast.error('Erro ao atualizar status.');
   }
 }, [vendas, processos, criarProcessoAutomatico]);

 // Funções de edição de vendas
 const editarVenda = useCallback((venda) => {
   setVendaEditando(venda.id);
   setEditandoVenda({
     observacoes: venda.observacoes || '',
     servico: venda.servico || ''
   });
 }, []);

 const salvarEdicaoVenda = useCallback(async (id) => {
   try {
     await atualizarVenda(id, editandoVenda);
     
     // Atualizar lista de vendas
     const vendasAtualizadas = await buscarVendas();
     setVendas(vendasAtualizadas);
     
     setVendaEditando(null);
     setEditandoVenda({});
     toast.success('Venda atualizada com sucesso!');
   } catch (error) {
     console.error('Erro ao atualizar venda:', error);
     toast.error('Erro ao atualizar venda.');
   }
 }, [editandoVenda]);

 // Funções para editar órgão em processos
 const editarOrgaoProcesso = useCallback((processo) => {
   setProcessoEditandoOrgao(processo.id);
   setOrgaoEditando(processo.orgao || '');
 }, []);

 const salvarOrgaoProcesso = useCallback(async (id) => {
   try {
     await atualizarProcesso(id, { orgao: orgaoEditando });
     
     // Atualizar lista de processos
     const processosAtualizados = await buscarProcessos();
     setProcessos(processosAtualizados);
     
     setProcessoEditandoOrgao(null);
     setOrgaoEditando('');
     toast.success('Órgão atualizado com sucesso!');
   } catch (error) {
     console.error('Erro ao atualizar órgão:', error);
     toast.error('Erro ao atualizar órgão.');
   }
 }, [orgaoEditando]);

 // Funções de exclusão
 const deletarProcesso = useCallback(async (id) => {
   if (window.confirm('Tem certeza que deseja deletar este processo?')) {
     try {
       await supabase.from('processos').delete().eq('id', id);
       
       // Atualizar lista de processos
       const processosAtualizados = await buscarProcessos();
       setProcessos(processosAtualizados);
       
       toast.success('Processo deletado com sucesso!');
     } catch (error) {
       console.error('Erro ao deletar processo:', error);
       toast.error('Erro ao deletar processo.');
     }
   }
 }, []);

 const deletarCurso = useCallback(async (id) => {
   if (window.confirm('Tem certeza que deseja deletar este curso?')) {
     try {
       await supabase.from('cursos').delete().eq('id', id);
       
       // Atualizar lista de cursos
       const cursosAtualizados = await buscarCursos();
       setCursos(cursosAtualizados);
       
       toast.success('Curso deletado com sucesso!');
     } catch (error) {
       console.error('Erro ao deletar curso:', error);
       toast.error('Erro ao deletar curso.');
     }
   }
 }, []);

 const deletarClienteFunc = useCallback(async (id) => {
   if (window.confirm('Tem certeza que deseja deletar este cliente?')) {
     try {
       await deletarCliente(id);
       
       // Atualizar lista de clientes
       const clientesAtualizados = await buscarClientes();
       setClientes(clientesAtualizados);
       
       toast.success('Cliente deletado com sucesso!');
     } catch (error) {
       console.error('Erro ao deletar cliente:', error);
       toast.error('Erro ao deletar cliente.');
     }
   }
 }, []);

 // ✅ NOVA FUNÇÃO PARA DELETAR VENDA
 const deletarVendaFunc = useCallback(async (id) => {
   if (window.confirm('⚠️ ATENÇÃO: Esta ação irá deletar a venda e TODOS os dados relacionados (parcelas, processos, cursos). Tem certeza que deseja continuar?')) {
     try {
       await deletarVenda(id);
       
       // Atualizar todas as listas após deletar
       const [vendasAtualizadas, processosAtualizados, cursosAtualizados] = await Promise.all([
         buscarVendas(),
         buscarProcessos(),
         buscarCursos()
       ]);
       
       setVendas(vendasAtualizadas);
       setProcessos(processosAtualizados);
       setCursos(cursosAtualizados);
       
       toast.success('Venda e todos os dados relacionados deletados com sucesso!');
     } catch (error) {
       console.error('Erro ao deletar venda:', error);
       toast.error('Erro ao deletar venda.');
     }
   }
 }, []);

 // Funções de exportação/importação
 const exportarDados = useCallback(async () => {
   try {
     const [clientesDoBanco, vendasDoBanco, processosDoBanco, cursosDoBanco] = await Promise.all([
       buscarClientes(),
       buscarVendas(),
       buscarProcessos(),
       buscarCursos()
     ]);
     
     const dados = { 
       clientes: clientesDoBanco, 
       vendas: vendasDoBanco, 
       processos: processosDoBanco,
       cursos: cursosDoBanco, 
       vendedores, 
       dataExportacao: new Date().toISOString() 
     };
     
     const dataStr = JSON.stringify(dados, null, 2);
     const dataBlob = new Blob([dataStr], { type: 'application/json' });
     const url = URL.createObjectURL(dataBlob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `backup-sistema-${new Date().toISOString().split('T')[0]}.json`;
     link.click();
     toast.success('Backup exportado com sucesso!');
   } catch (error) {
     console.error('Erro ao exportar:', error);
     toast.error('Erro ao exportar dados.');
   }
 }, [vendedores]);

 const importarDados = useCallback((event) => {
   const file = event.target.files[0];
   if (file) {
     const reader = new FileReader();
     reader.onload = (e) => {
       try {
         const dados = JSON.parse(e.target.result);
         if (dados.clientes) setClientes(dados.clientes);
         if (dados.vendas) setVendas(dados.vendas);
         if (dados.processos) setProcessos(dados.processos);
         if (dados.cursos) setCursos(dados.cursos);
         if (dados.vendedores) setVendedores(dados.vendedores);
         toast.success('Dados importados com sucesso!');
       } catch (error) {
         toast.error('Erro ao importar dados. Verifique o arquivo.');
       }
     };
     reader.readAsText(file);
   }
 }, []);

 // FILTROS
 const clientesFiltrados = useMemo(() => {
   return (clientes || []).filter(cliente => {
     if (!filtroClientes.trim()) return true;
     
     const termo = filtroClientes.toLowerCase().trim();
     
     const buscaNome = cliente.nome?.toLowerCase().includes(termo);
     const buscaCPF = cliente.cpf?.replace(/\D/g, '').includes(termo.replace(/\D/g, ''));
     const buscaTelefone = cliente.telefone?.replace(/\D/g, '').includes(termo.replace(/\D/g, ''));
     const buscaEmail = cliente.email?.toLowerCase().includes(termo);
     
     const encontrou = buscaNome || buscaCPF || buscaTelefone || buscaEmail;
     
     if (currentUser?.role === 'vendedor') {
       return encontrou && cliente.vendedor === currentUser.nome;
     }
     
     return encontrou;
   });
 }, [clientes, filtroClientes, currentUser]);

 const vendasFiltradas = useMemo(() => {
   console.log('🔍 Filtrando vendas. Total:', vendas?.length || 0);
   console.log('🔍 Vendas brutas:', vendas);
   
   const filtradas = (vendas || []).filter(venda => {
     const filtroVendedor = !filtroVendas.vendedor || venda.vendedor.toLowerCase().includes(filtroVendas.vendedor.toLowerCase());
     const filtroStatus = !filtroVendas.status || venda.status === filtroVendas.status;
     const filtroStatusPagamento = !filtroVendas.statusPagamento || venda.statusPagamento === filtroVendas.statusPagamento;
     const filtroPeriodo = filtrarPorPeriodo(venda.data, filtroVendas);
     
     let filtroVendedorPermissao = true;
     if (currentUser?.role === 'vendedor') {
       filtroVendedorPermissao = venda.vendedor === currentUser.nome;
     }
     
     return filtroVendedor && filtroStatus && filtroStatusPagamento && filtroPeriodo && filtroVendedorPermissao;
   });
   
   console.log('🔍 Vendas filtradas:', filtradas.length);
   return filtradas;
 }, [vendas, filtroVendas, currentUser]);

 const processosFiltrados = useMemo(() => {
   return (processos || []).filter(processo => {
     const filtroStatus = !filtroProcessos.status || processo.status === filtroProcessos.status;
     const filtroOrgao = !filtroProcessos.orgao || processo.orgao.toLowerCase().includes(filtroProcessos.orgao.toLowerCase());
     return filtroStatus && filtroOrgao;
   });
 }, [processos, filtroProcessos]);

 // ESTATÍSTICAS ATUALIZADAS COM FILTRO
 const stats = useMemo(() => {
   let vendasParaCalculo = vendas || [];
   let clientesParaCalculo = clientes || [];
   
   if (currentUser?.role === 'vendedor') {
     vendasParaCalculo = (vendas || []).filter(v => v.vendedor === currentUser.nome);
     clientesParaCalculo = (clientes || []).filter(c => c.vendedor === currentUser.nome);
   }
   
   // APLICAR FILTRO DE DATA NAS VENDAS
   vendasParaCalculo = vendasParaCalculo.filter(v => filtrarDataPorPeriodo(v.data, filtroDashboard));
   
   const vendasPagas = vendasParaCalculo.filter(v => v.statusPagamento === 'Pago');
   const totalVendasPagas = vendasPagas.reduce((acc, venda) => acc + (venda.valorParcela || venda.valor), 0);
   const totalComissoes = vendasPagas.reduce((acc, venda) => acc + (venda.comissao || 0), 0);
   const processosPendentes = (processos || []).filter(p => p.status !== 'Finalizado').length;
   const pagamentosPendentes = vendasParaCalculo.filter(v => v.statusPagamento === 'Pendente').length;
   
   return {
     totalVendasPagas,
     totalComissoes,
     processosPendentes,
     pagamentosPendentes,
     ticketMedio: vendasPagas.length > 0 ? totalVendasPagas / vendasPagas.length : 0,
     totalClientes: clientesParaCalculo.length
   };
 }, [vendas, clientes, processos, currentUser, filtroDashboard]);

 // Tela de Login
 if (!isLoggedIn) {
   return (
     <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
       <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
         <div className="text-center mb-8">
           <h1 className="text-3xl font-bold text-gray-800 mb-2">Sistema de Gestão</h1>
           <p className="text-gray-600">Recursos de Multas e CNH</p>
         </div>
         
         <form onSubmit={handleLogin} className="space-y-6">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Usuário</label>
             <input
               type="text"
               value={loginData.username}
               onChange={(e) => setLoginData({...loginData, username: e.target.value})}
               className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               placeholder="Digite seu usuário"
               required
             />
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
             <div className="relative">
               <input
                 type={showPassword ? "text" : "password"}
                 value={loginData.password}
                 onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                 placeholder="Digite sua senha"
                 required
               />
               <button
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
               >
                 {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
               </button>
             </div>
           </div>
           
           <button
             type="submit"
             className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
           >
             Entrar
           </button>
         </form>
         

       </div>
     </div>
   );
 }

 // Função para renderizar conteúdo
 const renderContent = () => {
   switch (activeTab) {
     case 'dashboard':
       return (
         <Dashboard 
           stats={stats} 
           vendas={vendas} 
           currentUser={currentUser} 
           atualizarDados={atualizarDados}
           filtroDashboard={filtroDashboard}
           setFiltroDashboard={setFiltroDashboard}
         />
       );
     case 'vendedores':
       return currentUser?.role === 'admin' ? (
         <GestaoVendedores 
           vendedores={vendedores}
           setVendedores={setVendedores}
           novoVendedor={novoVendedor}
           setNovoVendedor={setNovoVendedor}
           erros={erros}
           adicionarVendedor={adicionarVendedor}
           editarVendedor={editarVendedor}
           deletarVendedor={deletarVendedor}
           vendedorEditando={vendedorEditando}
           setVendedorEditando={setVendedorEditando}
         />
       ) : <Dashboard stats={stats} vendas={vendas} currentUser={currentUser} atualizarDados={atualizarDados} filtroDashboard={filtroDashboard} setFiltroDashboard={setFiltroDashboard} />;
     case 'clientes':
       return (
         <div className="p-6">
           <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold text-gray-800">Gestão de Clientes</h1>
             <div className="flex gap-3">
               <div className="relative">
                 <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                 <input
                   type="text"
                   placeholder="Buscar por nome, CPF, telefone..."
                   value={filtroClientes}
                   onChange={(e) => setFiltroClientes(e.target.value)}
                   className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                 />
               </div>
             </div>
           </div>

<div className="bg-white rounded-xl shadow-lg mb-6">
             <div className="p-4 border-b border-gray-200">
               <h3 className="font-semibold text-gray-800">Adicionar Novo Cliente</h3>
             </div>
             <div className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                   <input
                     type="text"
                     placeholder="Nome completo *"
                     value={novoCliente.nome}
                     onChange={(e) => setNovoCliente({...novoCliente, nome: e.target.value})}
                     className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                       erros.nome ? 'border-red-500' : 'border-gray-300'
                       }`}
                   />
                   {erros.nome && <p className="text-red-500 text-sm mt-1">{erros.nome}</p>}
                 </div>
                 <div>
                   <input
                     type="text"
                     placeholder="CPF *"
                     value={novoCliente.cpf}
                     onChange={(e) => setNovoCliente({...novoCliente, cpf: e.target.value})}
                     className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                       erros.cpf ? 'border-red-500' : 'border-gray-300'
                     }`}
                   />
                   {erros.cpf && <p className="text-red-500 text-sm mt-1">{erros.cpf}</p>}
                 </div>
                 <div>
                   <input
                     type="text"
                     placeholder="CNH (Opcional)"
                     value={novoCliente.cnh}
                     onChange={(e) => setNovoCliente({...novoCliente, cnh: e.target.value})}
                     className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   />
                 </div>
                 <div>
                   <input
                     type="text"
                     placeholder="Telefone"
                     value={novoCliente.telefone}
                     onChange={(e) => setNovoCliente({...novoCliente, telefone: e.target.value})}
                     className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                       erros.telefone ? 'border-red-500' : 'border-gray-300'
                     }`}
                   />
                   {erros.telefone && <p className="text-red-500 text-sm mt-1">{erros.telefone}</p>}
                 </div>
                 <div>
                   <input
                     type="email"
                     placeholder="Email (Opcional)"
                     value={novoCliente.email}
                     onChange={(e) => setNovoCliente({...novoCliente, email: e.target.value})}
                     className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                       erros.email ? 'border-red-500' : 'border-gray-300'
                     }`}
                   />
                   {erros.email && <p className="text-red-500 text-sm mt-1">{erros.email}</p>}
                 </div>
                 <button
                   onClick={adicionarCliente}
                   className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Adicionar Cliente
                 </button>
               </div>
             </div>
           </div>

           <div className="bg-white rounded-xl shadow-lg overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNH</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                     {currentUser?.role === 'admin' && (
                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                     )}
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {clientesFiltrados.map(cliente => (
                     <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{cliente.nome}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">{cliente.cpf}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">{cliente.cnh || '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">{cliente.telefone || '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">{cliente.email || '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <select 
                           value={cliente.status}
                           onChange={(e) => alterarStatusCliente(cliente.id, e.target.value)}
                           className="px-3 py-1 text-xs font-semibold rounded-full border-0 bg-transparent focus:ring-2 focus:ring-blue-500"
                           style={{
                             backgroundColor: cliente.status === 'Ativo' ? '#dcfce7' : 
                                            cliente.status === 'Inativo' ? '#fef2f2' : '#fef3c7',
                             color: cliente.status === 'Ativo' ? '#166534' : 
                                    cliente.status === 'Inativo' ? '#dc2626' : '#d97706'
                           }}
                         >
                           <option value="Ativo">Ativo</option>
                           <option value="Inativo">Inativo</option>
                           <option value="Pendente">Pendente</option>
                         </select>
                       </td>
                       {currentUser?.role === 'admin' && (
                         <td className="px-6 py-4 whitespace-nowrap">
                           <button
                             onClick={() => deletarClienteFunc(cliente.id)}
                             className="text-red-600 hover:text-red-800 transition-colors"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                         </td>
                       )}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         </div>
       );
     case 'vendas':
       return (
         <div className="p-6">
           <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold text-gray-800">Gestão de Vendas</h1>
             <div className="flex gap-3 flex-wrap">
               <select
                 value={filtroVendas.periodo}
                 onChange={(e) => setFiltroVendas({...filtroVendas, periodo: e.target.value, mesEspecifico: '', anoEspecifico: new Date().getFullYear().toString()})}
                 className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
               >
                 <option value="todos">Todos os períodos</option>
                 <option value="hoje">Hoje</option>
                 <option value="semana">Esta semana</option>
                 <option value="mes">Este mês</option>
                 <option value="especifico">Mês específico</option>
               </select>
               
               {filtroVendas.periodo === 'especifico' && (
                 <>
                   <select
                     value={filtroVendas.mesEspecifico}
                     onChange={(e) => setFiltroVendas({...filtroVendas, mesEspecifico: e.target.value})}
                     className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="">Selecione o mês</option>
                     {meses.map(mes => (
                       <option key={mes.value} value={mes.value}>{mes.label}</option>
                     ))}
                   </select>
                   <select
                     value={filtroVendas.anoEspecifico}
                     onChange={(e) => setFiltroVendas({...filtroVendas, anoEspecifico: e.target.value})}
                     className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   >
                     {anos.map(ano => (
                       <option key={ano} value={ano.toString()}>{ano}</option>
                     ))}
                   </select>
                 </>
               )}
               
               <select
                 value={filtroVendas.statusPagamento}
                 onChange={(e) => setFiltroVendas({...filtroVendas, statusPagamento: e.target.value})}
                 className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
               >
                 <option value="">Status Pagamento</option>
                 <option value="Pago">Pago</option>
                 <option value="Pendente">Pendente</option>
                 <option value="Recusado">Recusado</option>
               </select>
               {currentUser?.role === 'admin' && (
                 <input
                   type="text"
                   placeholder="Filtrar por vendedor"
                   value={filtroVendas.vendedor}
                   onChange={(e) => setFiltroVendas({...filtroVendas, vendedor: e.target.value})}
                   className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 />
               )}
             </div>
           </div>

           <div className="bg-white rounded-xl shadow-lg mb-6">
             <div className="p-4 border-b border-gray-200">
               <h3 className="font-semibold text-gray-800">Registrar Nova Venda</h3>
             </div>
             <div className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div>
                   <select
                     value={novaVenda.cliente}
                     onChange={(e) => setNovaVenda({...novaVenda, cliente: e.target.value})}
                     className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                       erros.cliente ? 'border-red-500' : 'border-gray-300'
                     }`}
                   >
                     <option value="">Selecione o cliente *</option>
                     {clientesFiltrados.map(cliente => (
                       <option key={cliente.id} value={cliente.nome}>{cliente.nome}</option>
                     ))}
                   </select>
                   {erros.cliente && <p className="text-red-500 text-sm mt-1">{erros.cliente}</p>}
                 </div>
                 <div>
                   <input
                     type="text"
                     value={currentUser?.nome || ''}
                     disabled
                     className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                     placeholder="Vendedor (automático)"
                   />
                 </div>
                 <div>
                   <select
                     value={novaVenda.servico}
                     onChange={(e) => setNovaVenda({...novaVenda, servico: e.target.value})}
                     className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                       erros.servico ? 'border-red-500' : 'border-gray-300'
                     }`}
                   >
                     <option value="">Selecione o serviço *</option>
                     <option value="Recurso de Multa">Recurso de Multa</option>
                     <option value="Recurso de Suspensão CNH">Recurso de Suspensão CNH</option>
                     <option value="Recurso de Multa + Recurso de Suspensão">Recurso de Multa + Recurso de Suspensão</option>
                     <option value="Curso de Reciclagem">Curso de Reciclagem</option>
                   </select>
                   {erros.servico && <p className="text-red-500 text-sm mt-1">{erros.servico}</p>}
                 </div>
                 <div>
                   <input
                     type="number"
                     placeholder="Valor *"
                     step="0.01"
                     value={novaVenda.valor}
                     onChange={(e) => setNovaVenda({...novaVenda, valor: e.target.value})}
                     className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                       erros.valor ? 'border-red-500' : 'border-gray-300'
                     }`}
                   />
                   {erros.valor && <p className="text-red-500 text-sm mt-1">{erros.valor}</p>}
                 </div>
                 
                 {(novaVenda.servico === 'Recurso de Multa' || novaVenda.servico === 'Recurso de Multa + Recurso de Suspensão') && (
                   <div>
                     <input
                       type="number"
                       placeholder="Qtd. Multas *"
                       min="1"
                       value={novaVenda.quantidadeMultas || ''}
                       onChange={(e) => setNovaVenda({...novaVenda, quantidadeMultas: e.target.value})}
                       className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                         erros.quantidadeMultas ? 'border-red-500' : 'border-gray-300'
                       }`}
                     />
                     {erros.quantidadeMultas && <p className="text-red-500 text-sm mt-1">{erros.quantidadeMultas}</p>}
                   </div>
                 )}

                 {(novaVenda.servico === 'Recurso de Suspensão CNH' || novaVenda.servico === 'Recurso de Multa + Recurso de Suspensão') && (
                   <div>
                     <input
                       type="number"
                       placeholder="Qtd. Processos Suspensão *"
                       min="1"
                       value={novaVenda.quantidadeSuspensao || ''}
                       onChange={(e) => setNovaVenda({...novaVenda, quantidadeSuspensao: e.target.value})}
                       className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                         erros.quantidadeSuspensao ? 'border-red-500' : 'border-gray-300'
                       }`}
                     />
                     {erros.quantidadeSuspensao && <p className="text-red-500 text-sm mt-1">{erros.quantidadeSuspensao}</p>}
                   </div>
                 )}
                 
                 <div>
                   <select
                     value={novaVenda.formaPagamento}
                     onChange={(e) => setNovaVenda({...novaVenda, formaPagamento: e.target.value})}
                     className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                       erros.formaPagamento ? 'border-red-500' : 'border-gray-300'
                     }`}
                   >
                     <option value="">Forma de Pagamento *</option>
                     <option value="PIX à vista">PIX à vista</option>
                     <option value="PIX 2x">PIX 2x</option>
                     <option value="PIX 3x">PIX 3x</option>
                     <option value="PIX 4x">PIX 4x</option>
                     <option value="PIX 5x">PIX 5x</option>
                     <option value="PIX 6x">PIX 6x</option>
                     <option value="PIX 7x">PIX 7x</option>
                     <option value="PIX 8x">PIX 8x</option>
                     <option value="PIX 9x">PIX 9x</option>
                     <option value="PIX 10x">PIX 10x</option>
                     <option value="PIX 11x">PIX 11x</option>
                     <option value="PIX 12x">PIX 12x</option>
                     <option value="Cartão sem juros 1x">Cartão sem juros 1x</option>
                     <option value="Cartão sem juros 2x">Cartão sem juros 2x</option>
                     <option value="Cartão sem juros 3x">Cartão sem juros 3x</option>
                     <option value="Cartão sem juros 4x">Cartão sem juros 4x</option>
                     <option value="Cartão sem juros 5x">Cartão sem juros 5x</option>
                     <option value="Cartão sem juros 6x">Cartão sem juros 6x</option>
                     <option value="Cartão sem juros 7x">Cartão sem juros 7x</option>
                     <option value="Cartão sem juros 8x">Cartão sem juros 8x</option>
                     <option value="Cartão sem juros 9x">Cartão sem juros 9x</option>
                     <option value="Cartão sem juros 10x">Cartão sem juros 10x</option>
                     <option value="Cartão sem juros 11x">Cartão sem juros 11x</option>
                     <option value="Cartão sem juros 12x">Cartão sem juros 12x</option>
                     <option value="PIX + Cartão">PIX + Cartão</option>
                   </select>
                   {erros.formaPagamento && <p className="text-red-500 text-sm mt-1">{erros.formaPagamento}</p>}
                 </div>
                 
                 {novaVenda.formaPagamento === 'PIX + Cartão' && (
                   <div>
                     <input
                       type="number"
                       placeholder="Valor entrada PIX *"
                       step="0.01"
                       value={novaVenda.valorEntrada || ''}
                       onChange={(e) => setNovaVenda({...novaVenda, valorEntrada: e.target.value})}
                       className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                         erros.valorEntrada ? 'border-red-500' : 'border-gray-300'
                       }`}
                     />
                     {erros.valorEntrada && <p className="text-red-500 text-sm mt-1">{erros.valorEntrada}</p>}
                   </div>
                 )}
                 
                 <div>
                   <input
                     type="date"
                     value={novaVenda.data}
                     onChange={(e) => setNovaVenda({...novaVenda, data: e.target.value})}
                     className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   />
                 </div>
                 <div className="md:col-span-2">
                   <textarea
                     placeholder="Observações"
                     value={novaVenda.observacoes}
                     onChange={(e) => setNovaVenda({...novaVenda, observacoes: e.target.value})}
                     className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-12"
                   />
                 </div>
                 <button
                   onClick={adicionarVenda}
                   className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-medium"
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Registrar Venda
                 </button>
               </div>
             </div>
           </div>

           <div className="bg-white rounded-xl shadow-lg overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamento</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Pag.</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observações</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {vendasFiltradas.map(venda => (
                     <tr key={venda.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{venda.cliente}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">{venda.vendedor}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                         {vendaEditando === venda.id ? (
                           <select
                             value={editandoVenda.servico}
                             onChange={(e) => setEditandoVenda({...editandoVenda, servico: e.target.value})}
                             className="w-full p-1 border rounded text-xs"
                           >
                             <option value="Recurso de Multa">Recurso de Multa</option>
                             <option value="Recurso de Suspensão CNH">Recurso de Suspensão CNH</option>
                             <option value="Recurso de Multa + Recurso de Suspensão">Recurso de Multa + Recurso de Suspensão</option>
                             <option value="Curso de Reciclagem">Curso de Reciclagem</option>
                           </select>
                         ) : (
                           <div>
                             {venda.servico}
                             {venda.quantidadeMultas && <div className="text-xs text-gray-400">Multas: {venda.quantidadeMultas}</div>}
                             {venda.quantidadeSuspensao && <div className="text-xs text-gray-400">Suspensão: {venda.quantidadeSuspensao}</div>}
                           </div>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-green-600 font-bold">
                         R$ {(venda.valorParcela || venda.valor).toFixed(2)}
                         {venda.valorEntrada && (
                           <div className="text-xs text-gray-500">Entrada: R$ {venda.valorEntrada.toFixed(2)}</div>
                         )}
                         {venda.parcelaAtual && venda.totalParcelas && (
                           <div className="text-xs text-gray-500">Parcela {venda.parcelaAtual}/{venda.totalParcelas}</div>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                         <div className="flex items-center">
                           <CreditCard className="h-4 w-4 mr-1" />
                           {venda.formaPagamento}
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                         {venda.data}
                         {venda.proximoVencimento && (
                           <div className="text-xs text-orange-600">
                             Próx: {venda.proximoVencimento}
                           </div>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <select
                           value={venda.statusPagamento}
                           onChange={(e) => alterarStatusPagamento(venda.id, e.target.value)}
                           disabled={currentUser?.role !== 'admin' && venda.vendedor !== currentUser?.nome}
                           className="px-2 py-1 text-xs font-semibold rounded-full border-0 bg-transparent focus:ring-2 focus:ring-blue-500"
                           style={{
                             backgroundColor: venda.statusPagamento === 'Pago' ? '#dcfce7' : 
                                             venda.statusPagamento === 'Pendente' ? '#fef3c7' : '#fef2f2',
                             color: venda.statusPagamento === 'Pago' ? '#166534' : 
                                    venda.statusPagamento === 'Pendente' ? '#d97706' : '#dc2626'
                           }}
                         >
                           <option value="Pago">Pago</option>
                           <option value="Pendente">Pendente</option>
                           <option value="Recusado">Recusado</option>
                         </select>
                       </td>
                       <td className="px-6 py-4 text-gray-500 max-w-xs">
                         {vendaEditando === venda.id ? (
                           <textarea
                             value={editandoVenda.observacoes}
                             onChange={(e) => setEditandoVenda({...editandoVenda, observacoes: e.target.value})}
                             className="w-full p-1 border rounded text-xs"
                             rows={2}
                           />
                         ) : (
                           <span className="truncate">{venda.observacoes}</span>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex gap-2">
                           {vendaEditando === venda.id ? (
                             <>
                               <button
                                 onClick={() => salvarEdicaoVenda(venda.id)}
                                 className="text-green-600 hover:text-green-800 transition-colors"
                               >
                                 <Check className="h-4 w-4" />
                               </button>
                               <button
                                 onClick={() => setVendaEditando(null)}
                                 className="text-red-600 hover:text-red-800 transition-colors"
                               >
                                 <X className="h-4 w-4" />
                               </button>
                             </>
                           ) : (
                             <>
                               {currentUser?.role === 'admin' && (
                                 <button
                                   onClick={() => editarVenda(venda)}
                                   className="text-blue-600 hover:text-blue-800 transition-colors"
                                 >
                                   <Edit className="h-4 w-4" />
                                 </button>
                               )}
                               {/* ✅ BOTÃO DE DELETAR VENDA */}
                               {currentUser?.role === 'admin' && (
                                 <button
                                   onClick={() => deletarVendaFunc(venda.id)}
                                   className="text-red-600 hover:text-red-800 transition-colors"
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </button>
                               )}
                             </>
                           )}
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
                 </table>
             </div>
           </div>
         </div>
       );
     case 'processos':
       return (
         <div className="p-6">
           <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold text-gray-800">Gestão de Processos</h1>
             <div className="flex gap-3">
               <select
                 value={filtroProcessos.status}
                 onChange={(e) => setFiltroProcessos({...filtroProcessos, status: e.target.value})}
                 className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
               >
                 <option value="">Todos os Status</option>
                 <option value="Em Andamento">Em Andamento</option>
                 <option value="Protocolado">Protocolado</option>
                 <option value="Finalizado">Finalizado</option>
               </select>
               <input
                 type="text"
                 placeholder="Filtrar por órgão"
                 value={filtroProcessos.orgao}
                 onChange={(e) => setFiltroProcessos({...filtroProcessos, orgao: e.target.value})}
                 className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 />
             </div>
           </div>

           {currentUser?.role === 'admin' && (
             <div className="bg-white rounded-xl shadow-lg mb-6">
               <div className="p-4 border-b border-gray-200">
                 <h3 className="font-semibold text-gray-800">Adicionar Novo Processo</h3>
               </div>
               <div className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                     <select
                       value={novoProcesso.cliente}
                       onChange={(e) => setNovoProcesso({...novoProcesso, cliente: e.target.value})}
                       className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                         erros.cliente ? 'border-red-500' : 'border-gray-300'
                       }`}
                     >
                       <option value="">Selecione o cliente *</option>
                       {clientesFiltrados.map(cliente => (
                         <option key={cliente.id} value={cliente.nome}>{cliente.nome}</option>
                       ))}
                     </select>
                     {erros.cliente && <p className="text-red-500 text-sm mt-1">{erros.cliente}</p>}
                   </div>
                   <div>
                     <select
                       value={novoProcesso.tipo}
                       onChange={(e) => setNovoProcesso({...novoProcesso, tipo: e.target.value})}
                       className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                         erros.tipo ? 'border-red-500' : 'border-gray-300'
                       }`}
                     >
                       <option value="">Tipo do processo *</option>
                       <option value="Recurso de Multa">Recurso de Multa</option>
                       <option value="Recurso de Suspensão CNH">Recurso de Suspensão CNH</option>
                       <option value="Recurso JARI">Recurso JARI</option>
                       <option value="Recurso CETRAN">Recurso CETRAN</option>
                     </select>
                     {erros.tipo && <p className="text-red-500 text-sm mt-1">{erros.tipo}</p>}
                   </div>
                   <div>
                     <input
                       type="text"
                       placeholder="Número do processo *"
                       value={novoProcesso.numero}
                       onChange={(e) => setNovoProcesso({...novoProcesso, numero: e.target.value})}
                       className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                         erros.numero ? 'border-red-500' : 'border-gray-300'
                       }`}
                     />
                     {erros.numero && <p className="text-red-500 text-sm mt-1">{erros.numero}</p>}
                   </div>
                   <div>
                     <input
                       type="text"
                       placeholder="Órgão *"
                       value={novoProcesso.orgao}
                       onChange={(e) => setNovoProcesso({...novoProcesso, orgao: e.target.value})}
                       className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                         erros.orgao ? 'border-red-500' : 'border-gray-300'
                       }`}
                     />
                     {erros.orgao && <p className="text-red-500 text-sm mt-1">{erros.orgao}</p>}
                   </div>
                   <div>
                     <input
                       type="number"
                       placeholder="Valor da multa *"
                       step="0.01"
                       value={novoProcesso.valor}
                       onChange={(e) => setNovoProcesso({...novoProcesso, valor: e.target.value})}
                       className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                         erros.valor ? 'border-red-500' : 'border-gray-300'
                       }`}
                     />
                     {erros.valor && <p className="text-red-500 text-sm mt-1">{erros.valor}</p>}
                   </div>
                   <div>
                     <input
                       type="date"
                       placeholder="Prazo"
                       value={novoProcesso.prazo}
                       onChange={(e) => setNovoProcesso({...novoProcesso, prazo: e.target.value})}
                       className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                   <div>
                     <input
                       type="text"
                       placeholder="Responsável"
                       value={novoProcesso.responsavel}
                       onChange={(e) => setNovoProcesso({...novoProcesso, responsavel: e.target.value})}
                       className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                   <button
                     onClick={adicionarProcesso}
                     className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center font-medium"
                   >
                     <Plus className="h-4 w-4 mr-2" />
                     Adicionar Processo
                   </button>
                 </div>
               </div>
             </div>
           )}
           
           <div className="bg-white rounded-xl shadow-lg overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Órgão</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prazo</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsável</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {processosFiltrados.map(processo => (
                     <tr key={processo.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{processo.cliente}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                         {processo.tipo}
                         {processo.quantidadeMultas && <div className="text-xs text-gray-400">Multas: {processo.quantidadeMultas}</div>}
                         {processo.quantidadeSuspensao && <div className="text-xs text-gray-400">Suspensão: {processo.quantidadeSuspensao}</div>}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">{processo.numero}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                         {processoEditandoOrgao === processo.id ? (
                           <div className="flex gap-1">
                             <input
                               type="text"
                               value={orgaoEditando}
                               onChange={(e) => setOrgaoEditando(e.target.value)}
                               className="w-full p-1 border rounded text-xs"
                               placeholder="Digite o órgão"
                             />
                             <button
                               onClick={() => salvarOrgaoProcesso(processo.id)}
                               className="text-green-600 hover:text-green-800"
                             >
                               <Check className="h-3 w-3" />
                             </button>
                             <button
                               onClick={() => setProcessoEditandoOrgao(null)}
                               className="text-red-600 hover:text-red-800"
                             >
                               <X className="h-3 w-3" />
                             </button>
                           </div>
                         ) : (
                           <div className="flex items-center gap-2">
                             <span>{processo.orgao || 'Não informado'}</span>
                             <button
                               onClick={() => editarOrgaoProcesso(processo)}
                               className="text-blue-600 hover:text-blue-800"
                             >
                               <Edit className="h-3 w-3" />
                             </button>
                           </div>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-red-600 font-bold">R$ {processo.valor.toFixed(2)}</td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <select
                           value={processo.status}
                           onChange={(e) => alterarStatusProcesso(processo.id, e.target.value)}
                           className={`px-3 py-1 text-xs font-semibold rounded-full border-0 bg-transparent focus:ring-2 focus:ring-blue-500 ${
                             processo.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' : 
                             processo.status === 'Protocolado' ? 'bg-orange-100 text-orange-800' :
                             'bg-green-100 text-green-800'
                           }`}
                         >
                           <option value="Em Andamento">Em Andamento</option>
                           <option value="Protocolado">Protocolado</option>
                           <option value="Finalizado">Finalizado</option>
                         </select>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">{processo.prazo || '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">{processo.responsavel || '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <button
                           onClick={() => deletarProcesso(processo.id)}
                           className="text-red-600 hover:text-red-800 transition-colors"
                         >
                           <Trash2 className="h-4 w-4" />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         </div>
       );
     case 'cursos':
       return (
         <div className="p-6">
           <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestão de Cursos</h1>
           
           <div className="bg-white rounded-xl shadow-lg overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo do Curso</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turma</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Início</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fim</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instrutor</th>
                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                     {currentUser?.role === 'admin' && (
                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                     )}
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {(cursos || []).map(curso => (
                     <tr key={curso.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{curso.cliente}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">{curso.tipo}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">{curso.turma || '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">{curso.inicio || '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">{curso.fim || '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-gray-500">{curso.instrutor || '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <select
                           value={curso.status}
                           onChange={(e) => alterarStatusCurso(curso.id, e.target.value)}
                           className={`px-3 py-1 text-xs font-semibold rounded-full border-0 bg-transparent focus:ring-2 focus:ring-blue-500 ${
                             curso.status === 'Matriculado' ? 'bg-green-100 text-green-800' : 
                             curso.status === 'Aguardando' ? 'bg-yellow-100 text-yellow-800' :
                             'bg-blue-100 text-blue-800'
                           }`}
                         >
                           <option value="Aguardando">Aguardando</option>
                           <option value="Matriculado">Matriculado</option>
                           <option value="Concluído">Concluído</option>
                         </select>
                       </td>
                       {currentUser?.role === 'admin' && (
                         <td className="px-6 py-4 whitespace-nowrap">
                           <button
                             onClick={() => deletarCurso(curso.id)}
                             className="text-red-600 hover:text-red-800 transition-colors"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                         </td>
                       )}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         </div>
       );
     case 'relatorios':
       return currentUser?.role === 'admin' ? (
         <div className="p-6">
           <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold text-gray-800">Relatórios Gerenciais</h1>
             <FiltroData 
               filtro={filtroRelatorios}
               onChange={setFiltroRelatorios}
             />
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
             <div className="bg-white p-6 rounded-xl shadow-lg">
               <h3 className="text-lg font-semibold mb-4 text-gray-800">Resumo Financeiro</h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                   <span className="text-gray-700">Faturamento Total:</span>
                   <span className="font-bold text-green-600">R$ {(stats?.totalVendasPagas || 0).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                   <span className="text-gray-700">Total Comissões:</span>
                   <span className="font-bold text-blue-600">R$ {(stats?.totalComissoes || 0).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                   <span className="text-gray-700">Ticket Médio:</span>
                   <span className="font-bold text-purple-600">R$ {(stats?.ticketMedio || 0).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                   <span className="text-gray-700">Pagamentos Pendentes:</span>
                   <span className="font-bold text-red-600">{stats?.pagamentosPendentes || 0}</span>
                 </div>
               </div>
             </div>

             <div className="bg-white p-6 rounded-xl shadow-lg">
               <h3 className="text-lg font-semibold mb-4 text-gray-800">Performance por Vendedor</h3>
               <div className="space-y-3">
                 {[...new Set((vendas || []).filter(v => filtrarDataPorPeriodo(v.data, filtroRelatorios)).map(v => v.vendedor))].map(vendedor => {
                   const vendasVendedor = (vendas || []).filter(v => 
                     v.vendedor === vendedor && 
                     v.statusPagamento === 'Pago' && 
                     filtrarDataPorPeriodo(v.data, filtroRelatorios)
                   );
                   const totalVendedor = vendasVendedor.reduce((acc, v) => acc + (v.valorParcela || v.valor), 0);
                   const comissaoVendedor = vendasVendedor.reduce((acc, v) => acc + (v.comissao || 0), 0);
                   return (
                     <div key={vendedor} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                       <div>
                         <p className="font-medium text-gray-800">{vendedor}</p>
                         <p className="text-sm text-gray-600">{vendasVendedor.length} vendas pagas</p>
                       </div>
                       <div className="text-right">
                         <p className="font-bold text-green-600">R$ {totalVendedor.toFixed(2)}</p>
                         <p className="text-sm text-blue-600">Com.: R$ {comissaoVendedor.toFixed(2)}</p>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-xl shadow-lg">
               <h3 className="text-lg font-semibold mb-4 text-gray-800">Formas de Pagamento</h3>
               <div className="space-y-3">
                 {[...new Set((vendas || []).filter(v => filtrarDataPorPeriodo(v.data, filtroRelatorios)).map(v => v.formaPagamento))].map(forma => {
                   const vendasForma = (vendas || []).filter(v => 
                     v.formaPagamento === forma && 
                     v.statusPagamento === 'Pago' && 
                     filtrarDataPorPeriodo(v.data, filtroRelatorios)
                   );
                   const totalForma = vendasForma.reduce((acc, v) => acc + (v.valorParcela || v.valor), 0);
                   return (
                     <div key={forma} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                       <div className="flex items-center">
                         <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
                         <span className="font-medium text-gray-800">{forma}</span>
                       </div>
                       <div className="text-right">
                         <p className="font-bold text-green-600">R$ {totalForma.toFixed(2)}</p>
                         <p className="text-sm text-gray-600">{vendasForma.length} vendas pagas</p>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>

             <div className="bg-white p-6 rounded-xl shadow-lg">
               <h3 className="text-lg font-semibold mb-4 text-gray-800">Serviços Mais Vendidos</h3>
               <div className="space-y-3">
                 {[...new Set((vendas || []).filter(v => filtrarDataPorPeriodo(v.data, filtroRelatorios)).map(v => v.servico))].map(servico => {
                   const vendasServico = (vendas || []).filter(v => 
                     v.servico === servico && 
                     v.statusPagamento === 'Pago' && 
                     filtrarDataPorPeriodo(v.data, filtroRelatorios)
                   );
                   const totalServico = vendasServico.reduce((acc, v) => acc + (v.valorParcela || v.valor), 0);
                   return (
                     <div key={servico} className="p-3 border border-gray-200 rounded-lg">
                       <h4 className="font-medium text-gray-800 mb-1">{servico}</h4>
                       <div className="flex justify-between items-center">
                         <p className="text-sm text-gray-600">{vendasServico.length} vendas pagas</p>
                         <p className="font-bold text-green-600">R$ {totalServico.toFixed(2)}</p>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
           </div>
         </div>
       ) : (
         <RelatorioPerformance 
           vendas={vendas} 
           currentUser={currentUser} 
           filtroRelatorios={filtroRelatorios}
           setFiltroRelatorios={setFiltroRelatorios}
         />
       );
     default:
       return (
         <Dashboard 
           stats={stats} 
           vendas={vendas} 
           currentUser={currentUser} 
           atualizarDados={atualizarDados}
           filtroDashboard={filtroDashboard}
           setFiltroDashboard={setFiltroDashboard}
         />
       );
   }
 };

 return (
   <div className="flex h-screen bg-gray-100">
     <MenuLateral 
       currentUser={currentUser}
       activeTab={activeTab}
       setActiveTab={setActiveTab}
       exportarDados={exportarDados}
       importarDados={importarDados}
       handleLogout={handleLogout}
       usuariosOnline={usuariosOnline}
     />
     <div className="flex-1 overflow-y-auto">
       {renderContent()}
     </div>
   </div>
 );
};

export default SistemaGestaoMultas;