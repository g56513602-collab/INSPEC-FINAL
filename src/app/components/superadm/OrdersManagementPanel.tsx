import { useState, useMemo } from 'react';
import { Search, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { updateServiceOrder, deleteServiceOrder } from '../../data/store';
import type { ServiceOrder, Structure, SystemUser, InspectionType } from '../../data/types';
import { INSPECTION_TYPES } from '../../data/types';

interface OrdersManagementPanelProps {
  orders: ServiceOrder[];
  structures: Structure[];
  users: SystemUser[];
  onRefresh: () => void;
}

const STATUS_OPTIONS = ['pendente', 'em-andamento', 'pausado', 'concluido', 'cancelado'] as const;
const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  'em-andamento': 'Em Andamento',
  pausado: 'Pausado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

interface EditForm {
  status: ServiceOrder['status'];
  priority: ServiceOrder['priority'];
  deadline: string;
  om: string;
  inspectionType: InspectionType | '';
  technicianId: string;
  supervisorId: string;
}

/**
 * Gestão real das ordens de serviço para o admin — antes disso, o painel
 * "Bases de Dados" nem mostrava um banco de Ordens dedicado, e não existia
 * NENHUM lugar no app (nem supervisor, nem admin) onde uma ordem já criada
 * pudesse ser editada ou excluída pela UI — updateServiceOrder/
 * deleteServiceOrder já existiam em store.ts mas sem nenhum chamador.
 */
export function OrdersManagementPanel({ orders, structures, users, onRefresh }: OrdersManagementPanelProps) {
  const [search, setSearch] = useState('');
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ServiceOrder | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function getStructureName(id: string) {
    return structures.find((s) => s.id === id)?.name || '—';
  }
  function getUserName(id: string) {
    return users.find((u) => u.id === id)?.name || '—';
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return orders;
    return orders.filter((o) =>
      o.id.toLowerCase().includes(q) ||
      (o.om || '').toLowerCase().includes(q) ||
      getStructureName(o.structureId).toLowerCase().includes(q) ||
      getUserName(o.technicianId).toLowerCase().includes(q)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, search, structures, users]);

  const technicians = users.filter((u) => u.role === 'tecnico');
  const supervisors = users.filter((u) => u.role === 'supervisor' || u.role === 'superadm');

  function openEdit(order: ServiceOrder) {
    setEditingOrder(order);
    setEditForm({
      status: order.status,
      priority: order.priority,
      deadline: order.deadline ? order.deadline.slice(0, 10) : '',
      om: order.om || '',
      inspectionType: order.inspectionType || '',
      technicianId: order.technicianId,
      supervisorId: order.supervisorId,
    });
  }

  function handleSaveEdit() {
    if (!editingOrder || !editForm) return;
    const updated: ServiceOrder = {
      ...editingOrder,
      status: editForm.status,
      priority: editForm.priority,
      deadline: editForm.deadline,
      om: editForm.om,
      inspectionType: editingOrder.type === 'inspecao' && editForm.inspectionType ? editForm.inspectionType : undefined,
      technicianId: editForm.technicianId,
      supervisorId: editForm.supervisorId,
    };
    updateServiceOrder(updated);
    setEditingOrder(null);
    setEditForm(null);
    onRefresh();
    showToast('Ordem atualizada com sucesso.');
  }

  function handleDelete(order: ServiceOrder) {
    deleteServiceOrder(order.id);
    setConfirmDelete(null);
    onRefresh();
    showToast('Ordem excluída.');
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg" style={{ color: '#193A2A' }}>Ordens de Serviço</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {filtered.length} de {orders.length} ordens · editar ou excluir diretamente
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

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['ID', 'OM', 'Tipo', 'Estrutura', 'Técnico', 'Supervisor', 'Status', 'Prazo', 'Ações'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Nenhuma ordem encontrada</td></tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono text-gray-500 whitespace-nowrap">{o.id}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{o.om || '—'}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {o.type === 'inspecao' ? 'Inspeção' : 'Execução'}{o.inspectionType ? ` (${o.inspectionType})` : ''}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">{getStructureName(o.structureId)}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{getUserName(o.technicianId)}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{getUserName(o.supervisorId)}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{STATUS_LABELS[o.status] || o.status}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {o.deadline ? new Date(o.deadline).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(o)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Editar">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setConfirmDelete(o)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Excluir">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit modal */}
      {editingOrder && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg" style={{ color: '#193A2A' }}>Editar Ordem {editingOrder.id}</h3>
              <button onClick={() => { setEditingOrder(null); setEditForm(null); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div>
              <label className="text-xs text-gray-600 mb-1 block">OM</label>
              <Input className="text-sm" value={editForm.om} onChange={(e) => setEditForm({ ...editForm, om: e.target.value })} />
            </div>

            {editingOrder.type === 'inspecao' && (
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Tipo de Inspeção</label>
                <select
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                  value={editForm.inspectionType}
                  onChange={(e) => setEditForm({ ...editForm, inspectionType: e.target.value as InspectionType | '' })}
                >
                  <option value="">—</option>
                  {INSPECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Status</label>
                <select
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ServiceOrder['status'] })}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Prioridade</label>
                <select
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as ServiceOrder['priority'] })}
                >
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600 mb-1 block">Prazo</label>
              <Input
                type="date"
                className="text-sm"
                value={editForm.deadline}
                onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Técnico</label>
                <select
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                  value={editForm.technicianId}
                  onChange={(e) => setEditForm({ ...editForm, technicianId: e.target.value })}
                >
                  {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Supervisor</label>
                <select
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                  value={editForm.supervisorId}
                  onChange={(e) => setEditForm({ ...editForm, supervisorId: e.target.value })}
                >
                  {supervisors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setEditingOrder(null); setEditForm(null); }}>
                Cancelar
              </Button>
              <Button className="flex-1 text-white" style={{ backgroundColor: '#193A2A' }} onClick={handleSaveEdit}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium" style={{ color: '#193A2A' }}>Excluir Ordem de Serviço</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Tem certeza que deseja excluir a ordem "{confirmDelete.id}" ({getStructureName(confirmDelete.structureId)})?
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button className="flex-1 text-white bg-red-600 hover:bg-red-700" onClick={() => handleDelete(confirmDelete)}>Excluir</Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
