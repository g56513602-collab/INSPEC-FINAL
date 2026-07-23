import { useEffect, useState } from 'react';
import { getStore, saveStore, loadFromBackend } from '@/app/data/store';

/**
 * Hook para disparar re-render quando dados são sincronizados
 * Componentes que usam este hook serão re-renderizados quando dados mudam
 */
export function useDataSync() {
  const [syncCounter, setSyncCounter] = useState(0);

  useEffect(() => {
    const handleDataRefresh = () => {
      setSyncCounter(prev => prev + 1);
      console.log('[useDataSync] Dados sincronizados, atualizando componente...');
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    return () => window.removeEventListener('dataRefresh', handleDataRefresh);
  }, []);

  return { syncCounter };
}

/**
 * Força sincronização imediata com backend: envia os dados locais atuais
 * (nunca um estado vazio/nulo, que apagaria o banco compartilhado) e em
 * seguida busca o estado mais recente confirmado pelo backend.
 * Será silenciosa se backend não responder (localStorage é fallback).
 */
export async function forceSync(): Promise<boolean> {
  try {
    console.log('[ForceSync] Sincronizando com backend...');

    // Envia as alterações locais pendentes (best-effort; saveStore já trata falhas)
    saveStore(getStore());

    // Busca o estado mais recente confirmado pelo backend
    await loadFromBackend();

    console.log('[ForceSync] ✅ Sincronização concluída');
    window.dispatchEvent(new CustomEvent('dataRefresh', {
      detail: { timestamp: Date.now(), source: 'forceSync' }
    }));
    return true;
  } catch (error) {
    console.warn('[ForceSync] ⚠️ Erro ao sincronizar, modo offline:', error);
    // Sempre retornar true porque o localStorage é o fallback
    return true;
  }
}
