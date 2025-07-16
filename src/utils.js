/**
 * Calcula o próximo vencimento de uma parcela.
 * @param {string} dataAtual - Data base para o cálculo (formato YYYY-MM-DD).
 * @param {number} mesesParaAdicionar - Número de meses a adicionar à data base.
 * @returns {string} A data do próximo vencimento no formato YYYY-MM-DD.
 */
export const calcularProximoVencimento = (dataAtual, mesesParaAdicionar) => {
  const data = new Date(dataAtual);
  data.setMonth(data.getMonth() + mesesParaAdicionar);
  return data.toISOString().split("T")[0];
};

/**
 * Valida um CPF.
 * @param {string} cpf - O CPF a ser validado.
 * @returns {boolean} True se o CPF for válido, false caso contrário.
 */
export const validarCPF = (cpf) => {
  const cpfLimpo = cpf.replace(/\D/g, "");
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma = soma + parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma = soma + parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;

  return true;
};

/**
 * Valida um endereço de e-mail.
 * @param {string} email - O e-mail a ser validado.
 * @returns {boolean} True se o e-mail for válido ou vazio, false caso contrário.
 */
export const validarEmail = (email) => {
  if (!email) return true;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida um número de telefone.
 * @param {string} telefone - O telefone a ser validado.
 * @returns {boolean} True se o telefone for válido ou vazio, false caso contrário.
 */
export const validarTelefone = (telefone) => {
  if (!telefone) return true;
  const telefoneLimpo = telefone.replace(/\D/g, "");
  return telefoneLimpo.length >= 10 && telefoneLimpo.length <= 11;
};

/**
 * Filtra vendas por período
 * @param {string} dataVenda - Data da venda no formato YYYY-MM-DD
 * @param {object} filtroVendas - Objeto com os filtros de período
 * @returns {boolean} True se a venda está dentro do período filtrado
 */
export const filtrarPorPeriodo = (dataVenda, filtroVendas) => {
  if (filtroVendas.periodo === 'todos') return true;
  
  const hoje = new Date();
  const dataVendaObj = new Date(dataVenda);
  
  switch (filtroVendas.periodo) {
    case 'hoje':
      return dataVendaObj.toDateString() === hoje.toDateString();
    
    case 'semana':
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());
      return dataVendaObj >= inicioSemana;
    
    case 'mes':
      return dataVendaObj.getMonth() === hoje.getMonth() && 
             dataVendaObj.getFullYear() === hoje.getFullYear();
    
    case 'especifico':
      if (filtroVendas.mesEspecifico && filtroVendas.anoEspecifico) {
        return dataVendaObj.getMonth() === parseInt(filtroVendas.mesEspecifico) - 1 &&
               dataVendaObj.getFullYear() === parseInt(filtroVendas.anoEspecifico);
      }
      return true;
    
    default:
      return true;
  }
};

/**
 * NOVA FUNÇÃO: Filtra qualquer dado por período baseado numa data
 * @param {string} data - Data no formato YYYY-MM-DD
 * @param {object} filtro - Objeto com os filtros de período
 * @returns {boolean} True se o item está dentro do período filtrado
 */
export const filtrarDataPorPeriodo = (data, filtro) => {
  if (!data || filtro.periodo === 'todos') return true;
  
  const hoje = new Date();
  const dataObj = new Date(data);
  
  switch (filtro.periodo) {
    case 'hoje':
      return dataObj.toDateString() === hoje.toDateString();
    
    case 'semana':
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());
      return dataObj >= inicioSemana;
    
    case 'mes':
      return dataObj.getMonth() === hoje.getMonth() && 
             dataObj.getFullYear() === hoje.getFullYear();
    
    case 'especifico':
      if (filtro.mesEspecifico && filtro.anoEspecifico) {
        return dataObj.getMonth() === parseInt(filtro.mesEspecifico) - 1 &&
               dataObj.getFullYear() === parseInt(filtro.anoEspecifico);
      }
      return true;
    
    default:
      return true;
  }
};

/**
 * NOVA FUNÇÃO: Criar filtro padrão
 * @returns {object} Objeto com filtro padrão
 */
export const criarFiltroPadrao = () => ({
  periodo: 'todos',
  mesEspecifico: '',
  anoEspecifico: new Date().getFullYear().toString()
});