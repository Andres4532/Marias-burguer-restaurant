'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import { useRequireJefa } from '@/hooks/useRequireJefa';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
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
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  formatPrice,
  getErrorMessage,
} from '@/lib/catalog';
import type { Category, Product } from '@/types/catalog';
import { getSortOrderForEnd, getMenuPositionRank } from '@/lib/sort-order';

export default function CategoriasPage() {
  const { loading, isJefa } = useRequireJefa();
  const [items, setItems] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [pageError, setPageError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [linkedProducts, setLinkedProducts] = useState<Product[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoadingData(true);
    setPageError('');
    try {
      setItems(await getCategories(true));
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

  const openEdit = (item: Category) => {
    setEditing(item);
    setName(item.name);
    setIsActive(item.isActive);
    setFormError('');
    setModalOpen(true);
  };

  const openDelete = async (item: Category) => {
    setDeleteTarget(item);
    setDeleteError('');
    setLinkedProducts([]);

    if ((item.productCount ?? 0) > 0) {
      setDeleteLoading(true);
      try {
        setLinkedProducts(await getProducts(item.id, true));
      } catch (e) {
        setDeleteError(getErrorMessage(e));
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const closeDelete = () => {
    if (deleteLoading) return;
    setDeleteTarget(null);
    setLinkedProducts([]);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteCategory(deleteTarget.id, linkedProducts.length > 0);
      closeDelete();
      await load();
    } catch (e) {
      setDeleteError(getErrorMessage(e));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const data = {
        name,
        sortOrder: editing ? editing.sortOrder : getSortOrderForEnd(items),
        isActive,
      };
      if (editing) {
        await updateCategory(editing.id, data);
      } else {
        await createCategory(data);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !isJefa) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-text-secondary font-medium">Cargando...</p>
      </div>
    );
  }

  const hasLinkedProducts = linkedProducts.length > 0;
  const categoryPeers = items.map((c) => ({
    id: c.id,
    sortOrder: c.sortOrder,
  }));

  return (
    <div>
      <PageHeader
        title="Categorías"
        description="Organiza el menú por secciones"
        action={<Button onClick={openCreate}>+ Nueva categoría</Button>}
      />

      {pageError && (
        <div className="mb-4">
          <FormError message={pageError} />
        </div>
      )}

      <CrudTable
        loading={loadingData}
        empty={items.length === 0}
        loadingMessage="Cargando categorías..."
        emptyMessage="No hay categorías registradas."
      >
        <table className="w-full text-sm">
          <CrudThead>
            <CrudTh>Nombre</CrudTh>
            <CrudTh>Posición</CrudTh>
            <CrudTh>Productos</CrudTh>
            <CrudTh>Estado</CrudTh>
            <CrudTh className="text-right">Acciones</CrudTh>
          </CrudThead>
          <tbody>
            {items.map((item) => {
              const { rank, total } = getMenuPositionRank(
                item.sortOrder,
                categoryPeers,
                item.id,
              );
              return (
              <CrudTr key={item.id}>
                <CrudTd>
                  <span className="font-bold text-foreground">{item.name}</span>
                </CrudTd>
                <CrudTd>
                  <span className="inline-flex flex-col gap-0.5">
                    <span className="font-bold text-foreground text-xs">
                      #{rank} de {total}
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      valor {item.sortOrder}
                    </span>
                  </span>
                </CrudTd>
                <CrudTd>
                  <span className="inline-flex min-w-[2rem] justify-center px-2 py-1 rounded-lg bg-background text-foreground font-bold text-xs">
                    {item.productCount ?? 0}
                  </span>
                </CrudTd>
                <CrudTd>
                  <Badge active={item.isActive} label={{ on: 'Activa', off: 'Inactiva' }} />
                </CrudTd>
                <CrudTd>
                  <CrudActions
                    onEdit={() => openEdit(item)}
                    onDelete={() => openDelete(item)}
                  />
                </CrudTd>
              </CrudTr>
            );
            })}
          </tbody>
        </table>
      </CrudTable>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <ActiveCheckbox
            checked={isActive}
            onChange={setIsActive}
            label="Activa"
          />
          {formError && <FormError message={formError} />}
          <FormActions
            saving={saving}
            onCancel={() => setModalOpen(false)}
          />
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={closeDelete}
        title={
          hasLinkedProducts
            ? `Eliminar categoría y productos`
            : `Eliminar categoría`
        }
      >
        {deleteTarget && (
          <div className="space-y-4">
            {deleteLoading && linkedProducts.length === 0 && (deleteTarget.productCount ?? 0) > 0 ? (
              <p className="text-sm text-text-secondary font-medium">
                Cargando productos de la categoría...
              </p>
            ) : hasLinkedProducts ? (
              <>
                <Card padding="sm" className="bg-red-950/30 border-red-800/50">
                  <p className="text-sm text-red-200 font-medium leading-relaxed">
                    La categoría{' '}
                    <strong className="text-red-100">{deleteTarget.name}</strong>{' '}
                    tiene{' '}
                    <strong className="text-red-100">
                      {linkedProducts.length} producto(s)
                    </strong>
                    . Para eliminarla, también se quitarán todos estos productos
                    del menú (no se borran pedidos antiguos).
                  </p>
                </Card>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                    Productos que se eliminarán
                  </p>
                  <ul className="max-h-48 overflow-y-auto space-y-2 rounded-xl border border-border bg-background p-3">
                    {linkedProducts.map((product) => (
                      <li
                        key={product.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="font-medium text-foreground truncate">
                          {product.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {formatPrice(product.price)}
                          </span>
                          <Badge active={product.isActive} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-sm text-text-secondary leading-relaxed">
                ¿Eliminar la categoría{' '}
                <strong className="text-foreground">{deleteTarget.name}</strong>?
                Esta acción no se puede deshacer.
              </p>
            )}

            {deleteError && <FormError message={deleteError} />}

            <div className="flex gap-2 pt-1">
              <Button
                variant="danger"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1"
              >
                {deleteLoading
                  ? 'Eliminando...'
                  : hasLinkedProducts
                    ? `Eliminar categoría y ${linkedProducts.length} producto(s)`
                    : 'Eliminar categoría'}
              </Button>
              <Button
                variant="secondary"
                onClick={closeDelete}
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
