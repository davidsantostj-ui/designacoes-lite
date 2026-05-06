const waitMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executa função com retry exponencial
 * @param {Function} fn - Função async a executar
 * @param {Object} options - Opções de retry
 * @param {number} [options.maxAttempts=3] - Máximo de tentativas
 * @param {number} [options.baseDelay=400] - Delay base em ms
 * @param {number} [options.maxDelay=10000] - Delay máximo
 * @param {Function} [options.shouldRetry] - Função para determinar se deve retry
 * @param {Function} [options.onRetry] - Callback a cada retry
 * @returns {Promise<any>}
 */
const withRetry = async (fn, options = {}) => {
  const {
    maxAttempts = 3,
    baseDelay = 400,
    maxDelay = 10000,
    shouldRetry = () => true,
    onRetry = () => {}
  } = options;

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      
      if (attempt >= maxAttempts || !shouldRetry(e)) {
        break;
      }
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      await waitMs(delay);
      onRetry(e, attempt, maxAttempts);
    }
  }
  
  return Promise.reject(lastError);
};

/**
 * Cria versão com retry de qualquer função async
 * @param {Function} fn - Função a encapsular
 * @param {Object} options - Opções de retry
 * @returns {Function} Função com retry
 */
const createRetryable = (fn, options = {}) => {
  return (...args) => withRetry(() => fn(...args), options);
};

export { waitMs, withRetry, createRetryable };
