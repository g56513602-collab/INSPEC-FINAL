import { useState } from 'react';

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const sync = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        setLastSync(new Date());
        console.log('✅ Sincronização concluída');
        return true;
      } else {
        console.error('❌ Erro na sincronização');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return { sync, isSyncing, lastSync };
}
