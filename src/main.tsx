
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import "./styles/pwa.css";
  import { OfflineProvider } from "./context/OfflineContext.tsx";
  import { OfflineIndicator } from "./components/OfflineIndicator.tsx";

// Register Service Worker for offline support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .then((registration) => {
        console.log("✅ Service Worker registrado");
        
        // Verificar atualizações a cada 5 minutos
        setInterval(() => {
          registration.update().catch(err => {
            console.log("Erro ao verificar atualização do SW:", err);
          });
        }, 5 * 60 * 1000);
        
        // Detectar quando nova versão do SW está pronta
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 Nova versão detectada, recarregando...');
              // Limpar cache antigo antes de recarregar
              caches.keys().then(cacheNames => {
                Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
                  .then(() => window.location.reload())
                  .catch(() => window.location.reload());
              });
            }
          });
        });
      })
      .catch((error) => {
        console.log("⚠️ Service Worker erro:", error);
      });
  });
}

function initAndRender() {
  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('Root element not found');

  // A hidratação inicial a partir do backend acontece dentro de <App/>, via
  // loadFromBackend() (busca o blob correto de /api/state e faz merge com os
  // padrões locais), que já bloqueia a renderização da UI real até concluir.
  //
  // Havia aqui uma segunda hidratação, via syncAllData()+applyBackendState(),
  // que buscava dados das tabelas REST normalizadas (users/structures/
  // serviceOrders/etc.) e SUBSTITUÍA todo o estado local por elas antes mesmo
  // do React montar. Essas tabelas não são atualizadas de forma confiável no
  // uso normal do app — diagnosticamos estruturas e ordens de serviço sempre
  // vazias nelas — então essa substituição apagava estruturas/ordens de
  // serviço reais a cada boot do app (e alguns campos, como inspectionRecords/
  // executionRecords/checklistComponents, tinham nomes diferentes dos
  // esperados e desapareciam do armazenamento local por completo, sendo
  // recriados com os dados de exemplo padrão). Isso é a causa raiz confirmada
  // de "perco todas as inspeções toda vez que atualizo o sistema": qualquer
  // reload do app (que é exatamente o que acontece após um deploy) disparava
  // essa substituição. Removida — loadFromBackend() é a única fonte de
  // hidratação inicial agora.
  createRoot(rootEl).render(
    <OfflineProvider>
      <App />
      <OfflineIndicator />
    </OfflineProvider>
  );
}

try {
  initAndRender();
} catch (err) {
  console.error('Erro ao inicializar a aplicação:', err);
  // fallback: render anyway to allow troubleshooting
  createRoot(document.getElementById('root')!).render(
    <OfflineProvider>
      <App />
      <OfflineIndicator />
    </OfflineProvider>
  );
}
  