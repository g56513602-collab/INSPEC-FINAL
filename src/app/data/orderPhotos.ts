import type { ServiceOrder } from './types';

/**
 * Reúne todas as fotos de uma ordem de serviço (fotos gerais + fotos de cada
 * componente da inspeção), sem duplicatas. Fonte única usada tanto na visão
 * de ordem concluída quanto no relatório analítico e na exportação, para que
 * nenhum desses lugares mostre uma contagem de fotos diferente dos outros.
 */
export function collectOrderPhotos(order: ServiceOrder): string[] {
  const componentPhotos = order.inspectionData?.components.flatMap((c) => c.photos || []) || [];
  return Array.from(new Set([...(order.photos || []), ...componentPhotos]));
}
