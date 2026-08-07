'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import { useRequireJefa } from '@/hooks/useRequireJefa';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  CrudActions,
  ActiveCheckbox,
  FormError,
  FormActions,
} from '@/components/ui/CrudForm';
import {
  CrudTable,
  CrudThead,
  CrudTh,
  CrudTr,
  CrudTd,
} from '@/components/ui/CrudTable';
import {
  getSauces,
  createSauce,
  updateSauce,
  deleteSauce,
  getErrorMessage,
} from '@/lib/sauces';
import type { Sauce } from '@/types/catalog';
import { getSortOrderForEnd } from '@/lib/sort-order';

export default function SalsasPage() {
  const { loading, isJefa } = useRequireJefa();
  const [items, setItems] = useState<Sauce[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sauce | null>(null);
  const [pageError, setPageError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Sauce | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoadingData(true);
    setPageError('');
    try {
      setItems(await getSauces(true));
    } catch (e) {
      setPageError(getErrorMessage(e));
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isJefa) load();
  }, [isJefa, load]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setIsActive(true);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item: Sauce) => {
    setEditing(item);
    setName(item.name);
    setIsActive(item.isActive);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const data = {
        name: name.trim(),
        sortOrder: editing ? editing.sortOrder : getSortOrderForEnd(items),
        isActive,
      };
      if (editing) {
        await updateSauce(editing.id, data);
      } else {
        await createSauce(data);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteSauce(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setDeleteError(getErrorMessage(e));
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading || !isJefa) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-text-secondary font-medium">Cargando...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Salsas"
        description="Salsas de acompañamiento para productos del menú"
        action={<Button onClick={openCreate}>+ Nueva salsa</Button>}
      />

      {pageError && (
        <div className="mb-4">
          <FormError message={pageError} />
        </div>
      )}

      <CrudTable
        loading={loadingData}
        empty={items.length === 0}
        loadingMessage="Cargando salsas..."
        emptyMessage="No hay salsas registradas."
      >
        <table className="w-full text-sm">
          <CrudThead>
            <CrudTh>Nombre</CrudTh>
            <CrudTh>Estado</CrudTh>
            <CrudTh className="text-right">Acciones</CrudTh>
          </CrudThead>
          <tbody>
            {items.map((item) => (
              <CrudTr key={item.id}>
                <CrudTd>
                  <span className="font-bold text-foreground">{item.name}</span>
                </CrudTd>
                <CrudTd>
                  <Badge active={item.isActive} label={{ on: 'Activa', off: 'Inactiva' }} />
                </CrudTd>
                <CrudTd>
                  <CrudActions
                    onEdit={() => openEdit(item)}
                    onDelete={() => {
                      setDeleteTarget(item);
                      setDeleteError('');
                    }}
                  />
                </CrudTd>
              </CrudTr>
            ))}
          </tbody>
        </table>
      </CrudTable>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar salsa' : 'Nueva salsa'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Mayonesa, Ketchup"
            required
          />
          <ActiveCheckbox checked={isActive} onChange={setIsActive} label="Activa" />
          {formError && <FormError message={formError} />}
          <FormActions saving={saving} onCancel={() => setModalOpen(false)} />
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        title="Eliminar salsa"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              ¿Eliminar la salsa{' '}
              <strong className="text-foreground">{deleteTarget.name}</strong>?
              Los productos que la usen dejarán de ofrecerla.
            </p>
            {deleteError && <FormError message={deleteError} />}
            <div className="flex gap-2 pt-1">
              <Button
                variant="danger"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1"
              >
                {deleteLoading ? 'Eliminando...' : 'Eliminar salsa'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
