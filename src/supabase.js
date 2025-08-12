import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://gyxovqxguszvteumhuny.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eG92cXhndXN6dnRldW1odW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MzY3MDQsImV4cCI6MjA2ODExMjcwNH0.4qSYcYv8TNLie0AYw5cja6Vj3ssBFSjO_4Nh6r-8hxw'

// Criação do cliente Supabase com configurações mais explícitas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// ===== CLIENTES =====
export const salvarCliente = async (cliente) => {
  try {
    console.log('🔄 Salvando cliente:', cliente)
    const { data, error } = await supabase
      .from('clientes')
      .insert([{
        nome: cliente.nome,
        cpf: cliente.cpf,
        cnh: cliente.cnh || null,
        telefone: cliente.telefone || null,
        email: cliente.email || null,
        status: cliente.status || 'Ativo',
        vendedor: cliente.vendedor
      }])
      .select()
    
    if (error) throw error
    console.log('✅ Cliente salvo:', data[0])
    return data[0]
  } catch (error) {
    console.error('❌ Erro ao salvar cliente:', error)
    throw error
  }
}

export const buscarClientes = async () => {
  try {
    console.log('🔄 Buscando clientes...')
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('id', { ascending: false })
    
    if (error) throw error
    console.log('✅ Clientes encontrados:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error)
    return []
  }
}

export const atualizarCliente = async (id, dadosAtualizados) => {
  try {
    console.log('🔄 Atualizando cliente:', id)
    const { data, error } = await supabase
      .from('clientes')
      .update(dadosAtualizados)
      .eq('id', id)
      .select()
    
    if (error) throw error
    console.log('✅ Cliente atualizado:', data[0])
    return data[0]
  } catch (error) {
    console.error('❌ Erro ao atualizar cliente:', error)
    throw error
  }
}

export const deletarCliente = async (id) => {
  try {
    console.log('🔄 Deletando cliente:', id)
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    console.log('✅ Cliente deletado')
    return true
  } catch (error) {
    console.error('❌ Erro ao deletar cliente:', error)
    throw error
  }
}

// ===== VENDAS =====
export const salvarVenda = async (venda) => {
  try {
    console.log('🔄 Salvando venda:', venda)
    
    const vendaParaSalvar = {
      cliente: venda.cliente,
      vendedor: venda.vendedor,
      servico: venda.servico,
      valor: parseFloat(venda.valor),
      data: venda.data,
      status_pagamento: venda.statusPagamento || 'Pendente',
      forma_pagamento: venda.formaPagamento,
      observacoes: venda.observacoes || null,
      comissao: parseFloat(venda.comissao || 0),
      quantidade_multas: venda.quantidadeMultas ? parseInt(venda.quantidadeMultas) : null,
      quantidade_suspensao: venda.quantidadeSuspensao ? parseInt(venda.quantidadeSuspensao) : null,
      valor_parcela: venda.valorParcela ? parseFloat(venda.valorParcela) : null,
      total_parcelas: parseInt(venda.totalParcelas || 1),
      parcela_atual: parseInt(venda.parcelaAtual || 1),
      proximo_vencimento: venda.proximoVencimento || null,
      processo_ja_criado: Boolean(venda.processoJaCriado || false),
      venda_principal_id: venda.vendaPrincipalId || null,
      valor_entrada: venda.valorEntrada ? parseFloat(venda.valorEntrada) : null
    }
    
    console.log('🔄 Dados formatados para salvar:', vendaParaSalvar)
    
    const { data, error } = await supabase
      .from('vendas')
      .insert([vendaParaSalvar])
      .select()
    
    if (error) throw error
    console.log('✅ Venda salva:', data[0])
    return data[0]
  } catch (error) {
    console.error('❌ Erro ao salvar venda:', error)
    throw error
  }
}

export const buscarVendas = async () => {
  try {
    console.log('🔄 Buscando vendas...')
    const { data, error } = await supabase
      .from('vendas')
      .select('*')
      .order('id', { ascending: false })
    
    if (error) throw error
    console.log('✅ Vendas encontradas:', data?.length || 0)
    
    // Converter para formato do sistema
    const vendasFormatadas = (data || []).map(venda => ({
      id: venda.id,
      cliente: venda.cliente,
      vendedor: venda.vendedor,
      servico: venda.servico,
      valor: parseFloat(venda.valor),
      data: venda.data,
      statusPagamento: venda.status_pagamento,
      formaPagamento: venda.forma_pagamento,
      observacoes: venda.observacoes,
      comissao: parseFloat(venda.comissao || 0),
      quantidadeMultas: venda.quantidade_multas,
      quantidadeSuspensao: venda.quantidade_suspensao,
      valorParcela: venda.valor_parcela ? parseFloat(venda.valor_parcela) : null,
      totalParcelas: venda.total_parcelas || 1,
      parcelaAtual: venda.parcela_atual || 1,
      proximoVencimento: venda.proximo_vencimento,
      processoJaCriado: venda.processo_ja_criado || false,
      vendaPrincipalId: venda.venda_principal_id,
      valorEntrada: venda.valor_entrada ? parseFloat(venda.valor_entrada) : null
    }))
    
    return vendasFormatadas
  } catch (error) {
    console.error('❌ Erro ao buscar vendas:', error)
    return []
  }
}

export const atualizarVenda = async (id, dadosAtualizados) => {
  try {
    console.log('🔄 Atualizando venda:', id)
    
    // Converter campos para formato do banco
    const dadosConvertidos = {}
    if (dadosAtualizados.statusPagamento !== undefined) dadosConvertidos.status_pagamento = dadosAtualizados.statusPagamento
    if (dadosAtualizados.observacoes !== undefined) dadosConvertidos.observacoes = dadosAtualizados.observacoes
    if (dadosAtualizados.servico !== undefined) dadosConvertidos.servico = dadosAtualizados.servico
    if (dadosAtualizados.processoJaCriado !== undefined) dadosConvertidos.processo_ja_criado = dadosAtualizados.processoJaCriado
    
    const { data, error } = await supabase
      .from('vendas')
      .update(dadosConvertidos)
      .eq('id', id)
      .select()
    
    if (error) throw error
    console.log('✅ Venda atualizada:', data[0])
    return data[0]
  } catch (error) {
    console.error('❌ Erro ao atualizar venda:', error)
    throw error
  }
}

export const salvarParcelas = async (parcelas) => {
  try {
    console.log('🔄 Salvando parcelas:', parcelas)
    
    const parcelasFormatadas = parcelas.map(p => ({
      cliente: p.cliente,
      vendedor: p.vendedor,
      servico: p.servico,
      valor: parseFloat(p.valor),
      data: p.data,
      status_pagamento: p.statusPagamento || 'Pendente',
      forma_pagamento: p.formaPagamento,
      observacoes: p.observacoes || null,
      comissao: parseFloat(p.comissao || 0),
      quantidade_multas: p.quantidadeMultas || null,
      quantidade_suspensao: p.quantidadeSuspensao || null,
      valor_parcela: p.valorParcela ? parseFloat(p.valorParcela) : null,
      total_parcelas: parseInt(p.totalParcelas || 1),
      parcela_atual: parseInt(p.parcelaAtual || 1),
      proximo_vencimento: p.proximoVencimento || null,
      processo_ja_criado: Boolean(p.processoJaCriado || false),
      venda_principal_id: p.vendaPrincipalId || null,
      valor_entrada: p.valorEntrada ? parseFloat(p.valorEntrada) : null
    }))
    
    console.log('🔄 Parcelas formatadas para salvar:', parcelasFormatadas)
    
    const { data, error } = await supabase
      .from('vendas')
      .insert(parcelasFormatadas)
      .select()
    
    if (error) throw error
    
    console.log('✅ Parcelas salvas:', data)
    return data
  } catch (error) {
    console.error('❌ Erro ao salvar parcelas:', error)
    throw error
  }
}

// ===== DELETAR VENDA (NOVA FUNÇÃO) =====
export const deletarVenda = async (id) => {
  try {
    console.log('🔄 Deletando venda:', id);
    
    // Buscar a venda antes de deletar para obter informações importantes
    const { data: vendaParaDeletar, error: errorBusca } = await supabase
      .from('vendas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (errorBusca) throw errorBusca;
    
    console.log('📄 Venda encontrada para deletar:', vendaParaDeletar);
    
    // 1. DELETAR TODAS AS PARCELAS RELACIONADAS (se for venda parcelada)
    if (vendaParaDeletar.venda_principal_id || vendaParaDeletar.total_parcelas > 1) {
      const vendaPrincipalId = vendaParaDeletar.venda_principal_id || vendaParaDeletar.id;
      
      console.log('🔄 Deletando todas as parcelas da venda principal:', vendaPrincipalId);
      
      // Deletar todas as parcelas desta venda
      const { error: errorParcelas } = await supabase
        .from('vendas')
        .delete()
        .or(`id.eq.${vendaPrincipalId},venda_principal_id.eq.${vendaPrincipalId}`);
      
      if (errorParcelas) throw errorParcelas;
      console.log('✅ Todas as parcelas deletadas');
    } else {
      // Se for venda única, deletar apenas ela
      const { error: errorVenda } = await supabase
        .from('vendas')
        .delete()
        .eq('id', id);
      
      if (errorVenda) throw errorVenda;
      console.log('✅ Venda única deletada');
    }
    
    // 2. DELETAR PROCESSOS RELACIONADOS (se existirem)
    const { error: errorProcessos } = await supabase
      .from('processos')
      .delete()
      .eq('venda_id', vendaParaDeletar.venda_principal_id || vendaParaDeletar.id);
    
    if (errorProcessos) {
      console.warn('⚠️ Erro ao deletar processos relacionados:', errorProcessos);
    } else {
      console.log('✅ Processos relacionados deletados');
    }
    
    // 3. DELETAR CURSOS RELACIONADOS (se existirem)
    const { error: errorCursos } = await supabase
      .from('cursos')
      .delete()
      .eq('venda_id', vendaParaDeletar.venda_principal_id || vendaParaDeletar.id);
    
    if (errorCursos) {
      console.warn('⚠️ Erro ao deletar cursos relacionados:', errorCursos);
    } else {
      console.log('✅ Cursos relacionados deletados');
    }
    
    console.log('✅ Venda e todos os dados relacionados deletados com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao deletar venda:', error);
    throw error;
  }
};

// ===== PROCESSOS =====
export const salvarProcesso = async (processo) => {
  try {
    console.log('🔄 Salvando processo:', processo)
    const { data, error } = await supabase
      .from('processos')
      .insert([{
        cliente: processo.cliente,
        tipo: processo.tipo,
        numero: processo.numero,
        orgao: processo.orgao,
        valor: parseFloat(processo.valor),
        status: processo.status,
        prazo: processo.prazo || null,
        responsavel: processo.responsavel || null,
        venda_id: processo.vendaId || null,
        quantidade_multas: processo.quantidadeMultas || null,
        quantidade_suspensao: processo.quantidadeSuspensao || null
      }])
      .select()
    
    if (error) throw error
    console.log('✅ Processo salvo:', data[0])
    return data[0]
  } catch (error) {
    console.error('❌ Erro ao salvar processo:', error)
    throw error
  }
}

export const buscarProcessos = async () => {
  try {
    console.log('🔄 Buscando processos...')
    const { data, error } = await supabase
      .from('processos')
      .select('*')
      .order('id', { ascending: false })
    
    if (error) throw error
    console.log('✅ Processos encontrados:', data?.length || 0)
    
    const processosFormatados = (data || []).map(p => ({
      id: p.id,
      cliente: p.cliente,
      tipo: p.tipo,
      numero: p.numero,
      orgao: p.orgao,
      valor: parseFloat(p.valor),
      status: p.status,
      prazo: p.prazo,
      responsavel: p.responsavel,
      vendaId: p.venda_id,
      quantidadeMultas: p.quantidade_multas,
      quantidadeSuspensao: p.quantidade_suspensao
    }))
    
    return processosFormatados
  } catch (error) {
    console.error('❌ Erro ao buscar processos:', error)
    return []
  }
}

export const atualizarProcesso = async (id, dadosAtualizados) => {
  try {
    console.log('🔄 Atualizando processo:', id)
    
    const dadosConvertidos = {}
    if (dadosAtualizados.status) dadosConvertidos.status = dadosAtualizados.status
    if (dadosAtualizados.orgao !== undefined) dadosConvertidos.orgao = dadosAtualizados.orgao

    const { data, error } = await supabase
      .from('processos')
      .update(dadosConvertidos)
      .eq('id', id)
      .select()
    
    if (error) throw error
    console.log('✅ Processo atualizado:', data[0])
    return data[0]
  } catch (error) {
    console.error('❌ Erro ao atualizar processo:', error)
    throw error
  }
}

// ===== CURSOS =====
export const salvarCurso = async (curso) => {
  try {
    console.log('🔄 Salvando curso:', curso)
    const { data, error } = await supabase
      .from('cursos')
      .insert([{
        cliente: curso.cliente,
        tipo: curso.tipo,
        turma: curso.turma || null,
        inicio: curso.inicio || null,
        fim: curso.fim || null,
        instrutor: curso.instrutor || null,
        status: curso.status || 'Aguardando',
        venda_id: curso.vendaId || null
      }])
      .select()
    
    if (error) throw error
    console.log('✅ Curso salvo:', data[0])
    return data[0]
  } catch (error) {
    console.error('❌ Erro ao salvar curso:', error)
    throw error
  }
}

export const buscarCursos = async () => {
  try {
    console.log('🔄 Buscando cursos...')
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .order('id', { ascending: false })
    
    if (error) throw error
    console.log('✅ Cursos encontrados:', data?.length || 0)
    
    const cursosFormatados = (data || []).map(c => ({
      id: c.id,
      cliente: c.cliente,
      tipo: c.tipo,
      turma: c.turma,
      inicio: c.inicio,
      fim: c.fim,
      instrutor: c.instrutor,
      status: c.status,
      vendaId: c.venda_id
    }))
    
    return cursosFormatados
  } catch (error) {
    console.error('❌ Erro ao buscar cursos:', error)
    return []
  }
}

export const atualizarCurso = async (id, dadosAtualizados) => {
  try {
    console.log('🔄 Atualizando curso:', id)
    
    const dadosConvertidos = {}
    if (dadosAtualizados.status) dadosConvertidos.status = dadosAtualizados.status

    const { data, error } = await supabase
      .from('cursos')
      .update(dadosConvertidos)
      .eq('id', id)
      .select()
    
    if (error) throw error
    console.log('✅ Curso atualizado:', data[0])
    return data[0]
  } catch (error) {
    console.error('❌ Erro ao atualizar curso:', error)
    throw error
  }
}

// ===== TESTE DE CONEXÃO =====
export const testarConexao = async () => {
  try {
    console.log('🔄 Testando conexão com Supabase...')
    const { data, error } = await supabase
      .from('clientes')
      .select('count', { count: 'exact' })
      .limit(1)
    
    if (error) throw error
    console.log('✅ Conexão OK!')
    return true
  } catch (error) {
    console.error('❌ Erro de conexão:', error)
    return false
  }
}

// ===== REALTIME SUBSCRIPTIONS =====
export const createSubscription = (table, callback) => {
  try {
    console.log(`🔄 Criando subscription para a tabela: ${table}`)
    
    const subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: table },
        payload => {
          console.log(`🔔 Evento em ${table}:`, payload)
          if (callback) callback(payload)
        }
      )
      .subscribe()
    
    return subscription
  } catch (error) {
    console.error('❌ Erro ao criar subscription:', error)
    return null
  }
}

export const removeSubscription = async (subscription) => {
  try {
    if (subscription) {
      console.log('🔄 Removendo subscription...')
      await supabase.removeChannel(subscription)
      console.log('✅ Subscription removida')
    }
  } catch (error) {
    console.error('❌ Erro ao remover subscription:', error)
  }
}

// ===== USUÁRIOS =====
export const buscarUsuarios = async () => {
  try {
    console.log('🔄 Buscando usuários...');
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('ativo', true)
      .order('id', { ascending: true });
    
    if (error) throw error;
    console.log('✅ Usuários encontrados:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    return [];
  }
};

export const salvarUsuario = async (usuario) => {
  try {
    console.log('🔄 Salvando usuário:', usuario);
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        username: usuario.username,
        password: usuario.password,
        nome: usuario.nome,
        role: usuario.role || 'vendedor',
        comissao: parseFloat(usuario.comissao || 0)
      }])
      .select();
    
    if (error) throw error;
    console.log('✅ Usuário salvo:', data[0]);
    return data[0];
  } catch (error) {
    console.error('❌ Erro ao salvar usuário:', error);
    throw error;
  }
};

export const atualizarUsuario = async (id, dadosAtualizados) => {
  try {
    console.log('🔄 Atualizando usuário:', id);
    const { data, error } = await supabase
      .from('usuarios')
      .update(dadosAtualizados)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    console.log('✅ Usuário atualizado:', data[0]);
    return data[0];
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    throw error;
  }
};

export const deletarUsuario = async (id) => {
  try {
    console.log('🔄 Deletando usuário:', id);
    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: false })
      .eq('id', id);
    
    if (error) throw error;
    console.log('✅ Usuário deletado');
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    throw error;
  }
};

export const autenticarUsuario = async (username, password) => {
  try {
    console.log('🔄 Autenticando usuário:', username);
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .eq('ativo', true)
      .single();
    
    if (error) throw error;
    console.log('✅ Usuário autenticado:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    return null;
  }
};

// ===== PRESENÇA ONLINE =====
export const marcarUsuarioOnline = async (userId) => {
  try {
    await supabase
      .from('usuarios')
      .update({ 
        is_online: true, 
        last_seen: new Date().toISOString() 
      })
      .eq('id', userId);
    console.log('✅ Usuário marcado como online:', userId);
  } catch (error) {
    console.error('Erro ao marcar usuário online:', error);
  }
};

export const marcarUsuarioOffline = async (userId) => {
  try {
    await supabase
      .from('usuarios')
      .update({ 
        is_online: false, 
        last_seen: new Date().toISOString() 
      })
      .eq('id', userId);
    console.log('✅ Usuário marcado como offline:', userId);
  } catch (error) {
    console.error('Erro ao marcar usuário offline:', error);
  }
};

export const atualizarHeartbeat = async (userId) => {
  try {
    await supabase
      .from('usuarios')
      .update({ 
        last_seen: new Date().toISOString() 
      })
      .eq('id', userId);
  } catch (error) {
    console.error('Erro ao atualizar heartbeat:', error);
  }
};

export const buscarUsuariosOnline = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, username, role, is_online, last_seen')
      .eq('ativo', true)
      .eq('is_online', true);
    
    if (error) throw error;
    console.log('✅ Usuários online encontrados:', data);
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar usuários online:', error);
    return [];
  }
};