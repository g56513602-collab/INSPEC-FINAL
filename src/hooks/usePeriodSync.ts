import { useEffect } from 'react';
import { forceSync } from './useDataSync';

const STORAGE_KEY = 'inspec360_v22_data';

/**
 * Verifica se aplicar por cima o estado buscado do servidor pareceria
 * apagar registros que só existem no dispositivo local — sinal de que há
 * mudanças feitas offline que ainda não chegaram ao servidor (ex.: uma
 * inspeção concluída sem conexão). Diferente do merge do lado do servidor
 * (que tolera a exclusão legítima de 1 registro), aqui não há como
 * distinguir "o servidor não conhece isso ainda" de "isso foi excluído em
 * outro lugar" — então qualquer registro presente só localmente é tratado
 * como potencialmente não sincronizado, e o pull cru é substituído por um
 * push+pull seguro (forceSync) em vez de sobrescrever direto.
 *
 * Esta é a causa raiz confirmada de "completei uma inspeção offline, voltei
 * a internet e ela sumiu": o timer de 10s continuava rodando mesmo depois
 * de reconectar e sobrescrevia o armazenamento local com o estado antigo do
 * servidor antes de qualquer tentativa de reenviar a mudança offline.
 */
function wouldDropLocalOnlyRecords(current: any, incoming: any): boolean {
  if (!current || typeof current !== 'object' || !incoming || typeof incoming !== 'object') return false;

  const collectionsToCheck = ['serviceOrders', 'inspectionRecords', 'executionRecords', 'structures', 'users'];
  for (const key of collectionsToCheck) {
    const currentArr = current[key];
    const incomingArr = incoming[key];
    if (!Array.isArray(currentArr) || !Array.isArray(incomingArr)) continue;

    const incomingIds = new Set(
      incomingArr.filter((i: any) => i && typeof i === 'object' && 'id' in i).map((i: any) => i.id)
    );
    const hasLocalOnlyRecord = currentArr.some(
      (i: any) => i && typeof i === 'object' && 'id' in i && !incomingIds.has(i.id)
    );
    if (hasLocalOnlyRecord) return true;
  }
  return false;
}

async function safePullFromServer(source: string) {
  try {
    const response = await fetch('/api/state', { signal: AbortSignal.timeout(3000) });
    if (!response.ok) return;

    const { state, found } = await response.json();
    if (!found || !state) return;

    const currentRaw = localStorage.getItem(STORAGE_KEY);
    const newDataString = JSON.stringify(state);
    if (currentRaw === newDataString) return;

    const current = currentRaw ? JSON.parse(currentRaw) : null;
    if (current && wouldDropLocalOnlyRecords(current, state)) {
      console.log(`[Sync] (${source}) Estado do servidor omite registros locais — empurrando mudanças locais antes de aplicar o pull.`);
      await forceSync();
      return;
    }

    console.log(`[Sync] (${source}) Mudanças detectadas, atualizando...`);
    localStorage.setItem(STORAGE_KEY, newDataString);
    window.dispatchEvent(new CustomEvent('dataSync', { detail: { timestamp: Date.now(), source } }));
  } catch (error) {
    console.log(`[Sync] (${source}) Timeout ou erro de rede`);
  }
}

/**
 * Hook para sincronização periódica de dados com backend
 * Verifica a cada 10 segundos se há mudanças no servidor
 * e atualiza o frontend automaticamente
 */
export function usePeriodSync() {
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (!navigator.onLine) return;
      safePullFromServer('poll');
    }, 10000);

    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        safePullFromServer('foreground');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Ao reconectar, sempre empurra as mudanças locais primeiro (podem
    // incluir trabalho feito offline) e só então busca o estado do servidor
    // — nunca um pull cru direto, que sobrescreveria dados locais ainda não
    // sincronizados.
    const handleOnline = () => {
      console.log('[Sync] Conexão restaurada — sincronizando (push local + pull do servidor)...');
      forceSync().then(() => {
        window.dispatchEvent(new CustomEvent('dataSync', { detail: { timestamp: Date.now(), source: 'online' } }));
      });
    };
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}

/**
 * Hook para listen em eventos de sincronização
 * Pode ser usado em componentes que precisam reagir a atualizações
 */
export function useOnDataSync(callback: (event: CustomEvent) => void) {
  useEffect(() => {
    const handler = (event: Event) => {
      callback(event as CustomEvent);
    };

    window.addEventListener('dataSync', handler);
    return () => window.removeEventListener('dataSync', handler);
  }, [callback]);
}
