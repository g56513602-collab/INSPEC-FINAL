import { useState, useMemo } from 'react';
import { Search, Camera, ChevronDown, ChevronRight, Download, FolderOpen } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import { collectOrderPhotos } from '../data/orderPhotos';
import type { ServiceOrder, Structure } from '../data/types';

interface PhotoGalleryPanelProps {
  orders: ServiceOrder[];
  structures: Structure[];
  getStructureName: (id: string) => string;
  getTechnicianName: (id: string) => string;
}

function downloadPhoto(photo: string, filename: string) {
  const a = document.createElement('a');
  a.href = photo;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Galeria de fotos organizada por ordem de serviço ("uma pasta por ordem").
 * Antes disso não existia nenhum lugar no app, nem para supervisor nem para
 * admin, onde dar uma olhada em todas as fotos registradas — só era possível
 * ver as fotos de UMA ordem específica abrindo o detalhe dela em "Ordens
 * Concluídas".
 */
export function PhotoGalleryPanel({ orders, structures, getStructureName, getTechnicianName }: PhotoGalleryPanelProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number; prefix: string } | null>(null);

  const ordersWithPhotos = useMemo(() => {
    return orders
      .map((order) => ({ order, photos: collectOrderPhotos(order) }))
      .filter(({ photos }) => photos.length > 0);
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ordersWithPhotos;
    return ordersWithPhotos.filter(({ order }) =>
      order.id.toLowerCase().includes(q) ||
      (order.om || '').toLowerCase().includes(q) ||
      getStructureName(order.structureId).toLowerCase().includes(q) ||
      getTechnicianName(order.technicianId).toLowerCase().includes(q)
    );
  }, [ordersWithPhotos, search, getStructureName, getTechnicianName]);

  const totalPhotos = ordersWithPhotos.reduce((sum, { photos }) => sum + photos.length, 0);

  function toggleExpand(orderId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  async function downloadAllForOrder(order: ServiceOrder, photos: string[]) {
    for (let i = 0; i < photos.length; i++) {
      downloadPhoto(photos[i], `${order.id}_foto_${i + 1}.jpg`);
      // Pequeno intervalo entre downloads — navegadores bloqueiam/perguntam
      // quando muitos downloads disparam ao mesmo tempo.
      if (i < photos.length - 1) await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg" style={{ color: '#193A2A' }}>Fotos das Inspeções</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {totalPhotos} foto{totalPhotos !== 1 ? 's' : ''} em {ordersWithPhotos.length} ordem{ordersWithPhotos.length !== 1 ? 's' : ''} · organizadas por ordem de serviço
        </p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-9 text-sm"
          placeholder="Buscar por ID, OM, estrutura, técnico..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Camera className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">Nenhuma foto encontrada</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(({ order, photos }) => {
            const isOpen = expanded.has(order.id);
            return (
              <Card key={order.id} className="overflow-hidden">
                <button
                  onClick={() => toggleExpand(order.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="text-left min-w-0">
                      <div className="text-sm truncate" style={{ color: '#193A2A' }}>{getStructureName(order.structureId)}</div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {order.id.toUpperCase()} · {order.om || 'sem OM'} · {getTechnicianName(order.technicianId)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {photos.length} foto{photos.length !== 1 ? 's' : ''}
                    </span>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-3 border-t border-gray-100 space-y-3">
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => downloadAllForOrder(order, photos)}
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Baixar todas ({photos.length})
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {photos.map((p, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={p}
                            alt={`Foto ${i + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-100 cursor-pointer"
                            onClick={() => setLightbox({ photos, index: i, prefix: order.id })}
                          />
                          <button
                            onClick={() => downloadPhoto(p, `${order.id}_foto_${i + 1}.jpg`)}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Baixar"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          fileNamePrefix={lightbox.prefix}
        />
      )}
    </div>
  );
}
