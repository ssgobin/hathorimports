/**
 * Configuração do Firebase
 * Agora busca as credenciais do backend de forma segura
 */

let cachedConfig = null;

/**
 * Busca a configuração do Firebase do backend
 * @returns {Promise<Object>} Configuração do Firebase
 */
export async function getFirebaseConfig() {
  // Retorna do cache se já foi carregado
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/api/auth/config');
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar configuração: ${response.status}`);
    }

    cachedConfig = await response.json();
    return cachedConfig;
  } catch (error) {
    console.error('Erro ao carregar configuração do Firebase:', error);
    
    // Fallback para desenvolvimento (remova em produção)
    console.warn('Usando configuração de fallback');
    cachedConfig = {
      apiKey: "AIzaSyBoUOG0z7zqHCPvUvaNU1drTCYKqcx9bS4",
      authDomain: "hathorimports-b1155.firebaseapp.com",
      projectId: "hathorimports-b1155",
      storageBucket: "hathorimports-b1155.firebasestorage.app",
      messagingSenderId: "1074936726732",
      appId: "1:1074936726732:web:731aeaf94a6ea3ba512e69",
      measurementId: "G-2MSD70J3XK"
    };
    
    return cachedConfig;
  }
}

// Exporta também de forma síncrona para compatibilidade (deprecated)
export const firebaseConfig = {
  apiKey: "AIzaSyBoUOG0z7zqHCPvUvaNU1drTCYKqcx9bS4",
  authDomain: "hathorimports-b1155.firebaseapp.com",
  projectId: "hathorimports-b1155",
  storageBucket: "hathorimports-b1155.firebasestorage.app",
  messagingSenderId: "1074936726732",
  appId: "1:1074936726732:web:731aeaf94a6ea3ba512e69",
  measurementId: "G-2MSD70J3XK"
};
