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
  getExtras,
  createExtra,
  updateExtra,
  deleteExtra,
  formatPrice,
  getErrorMessage,
} from '@/lib/catalog';
import type { Extra } from '@/types/catalog';

export default function ExtrasPage() {
  const { loading, isJefa } = useRequireJefa();
  const [items, setItems] = useState<Extra[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Extra | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      setItems(await getExtras(true));
    } catch (e) {
      setError(getErrorMessage(e));
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
    setPrice('0');
    setIsActive(true);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (item: Extra) => {
    setEditing(item);
    setName(item.name);
    setPrice(String(item.price));
    setIsActive(item.isActive);
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = {
        name,
        price: parseFloat(price),
        isActive,
      };
      if (editing) {
        await updateExtra(editing.id, data);
      } else {
        await createExtra(data);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Extra) => {
    if (!confirm(`¿Eliminar extra "${item.name}"?`)) return;
    try {
      await deleteExtra(item.id);
      await load();
    } catch (err) {
      alert(getErrorMessage(err));
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
        title="Extras y salsas"
        description="En el producto (al elegir) o como porción aparte en Productos → Salsas aparte"
        action={<Button onClick={openCreate}>+ Nuevo extra</Button>}
      />

      <CrudTable
        loading={loadingData}
        empty={items.length === 0}
        loadingMessage="Cargando extras..."
        emptyMessage="No hay extras registrados."
      >
        <table className="w-full text-sm">
          <CrudThead>
            <CrudTh>Nombre</CrudTh>
            <CrudTh>Precio</CrudTh>
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
                  <span
                    className={`font-bold ${
                      item.price > 0 ? 'text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {item.price > 0 ? formatPrice(item.price) : 'Gratis'}
                  </span>
                </CrudTd>
                <CrudTd>
                  <Badge active={item.isActive} />
                </CrudTd>
                <CrudTd>
                  <CrudActions
                    onEdit={() => openEdit(item)}
                    onDelete={() => handleDelete(item)}
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
        title={editing ? 'Editar extra' : 'Nuevo extra'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Precio adicional (Bs.)"
            type="number"
            min={0}
            step="0.5"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <ActiveCheckbox checked={isActive} onChange={setIsActive} />
          {error && <FormError message={error} />}
          <FormActions
            saving={saving}
            onCancel={() => setModalOpen(false)}
          />
        </form>
      </Modal>
    </div>
  );
}
