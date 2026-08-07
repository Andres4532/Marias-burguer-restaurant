'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import { useRequireJefa } from '@/hooks/useRequireJefa';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProductImage } from '@/components/ui/ProductImage';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
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
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  formatPrice,
  getErrorMessage,
} from '@/lib/catalog';
import { getSauces } from '@/lib/sauces';
import { SAUCE_MODE_LABELS } from '@/lib/sauce-labels';
import { uploadProductImage } from '@/lib/uploads';
import type {
  Product,
  Category,
  ProductPromoType,
  ProductSauceMode,
  Sauce,
} from '@/types/catalog';
import { ProductPrice } from '@/components/catalog/ProductPrice';
import { getSortOrderForEnd } from '@/lib/sort-order';

function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ProductosPage() {
  const { loading, isJefa } = useRequireJefa();
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sauceOptions, setSauceOptions] = useState<Sauce[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [trackStock, setTrackStock] = useState(false);
  const [stockQuantity, setStockQuantity] = useState('0');
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoType, setPromoType] = useState<ProductPromoType>('PERCENT');
  const [promoValue, setPromoValue] = useState('');
  const [promoStartsAt, setPromoStartsAt] = useState('');
  const [promoEndsAt, setPromoEndsAt] = useState('');
  const [sauceMode, setSauceMode] = useState<ProductSauceMode>('NONE');
  const [allowSauceSeparate, setAllowSauceSeparate] = useState(true);
  const [selectedSauceIds, setSelectedSauceIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      const [products, cats, sauces] = await Promise.all([
        getProducts(undefined, true),
        getCategories(true),
        getSauces(true),
      ]);
      setItems(products);
      setCategories(cats);
      setSauceOptions(sauces.filter((s) => s.isActive));
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
    const defaultCategoryId = categories[0]?.id ?? '';
    setCategoryId(defaultCategoryId);
    setName('');
    setDescription('');
    setPrice('');
    setImageUrl('');
    setIsActive(true);
    setTrackStock(false);
    setStockQuantity('0');
    setPromoEnabled(false);
    setPromoType('PERCENT');
    setPromoValue('');
    setPromoStartsAt('');
    setPromoEndsAt('');
    setSauceMode('NONE');
    setAllowSauceSeparate(true);
    setSelectedSauceIds([]);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (item: Product) => {
    setEditing(item);
    setCategoryId(item.categoryId);
    setName(item.name);
    setDescription(item.description ?? '');
    setPrice(String(item.price));
    setImageUrl(item.imageUrl ?? '');
    setIsActive(item.isActive);
    setTrackStock(item.trackStock);
    setStockQuantity(String(item.stockQuantity));
    setPromoEnabled(item.promoType !== 'NONE');
    setPromoType(item.promoType === 'FIXED_PRICE' ? 'FIXED_PRICE' : 'PERCENT');
    setPromoValue(item.promoValue != null ? String(item.promoValue) : '');
    setPromoStartsAt(toDatetimeLocal(item.promoStartsAt));
    setPromoEndsAt(toDatetimeLocal(item.promoEndsAt));
    setSauceMode(item.sauceMode ?? 'NONE');
    setAllowSauceSeparate(item.allowSauceSeparate ?? true);
    setSelectedSauceIds(item.sauces?.map((s) => s.id) ?? []);
    setError('');
    setModalOpen(true);
  };

  const handleCategoryChange = (nextCategoryId: string) => {
    setCategoryId(nextCategoryId);
  };

  const resolveSortOrder = () => {
    if (editing) {
      if (editing.categoryId === categoryId) {
        return editing.sortOrder;
      }
      const inCategory = items.filter(
        (p) => p.categoryId === categoryId && p.id !== editing.id,
      );
      return getSortOrderForEnd(inCategory);
    }
    const inCategory = items.filter((p) => p.categoryId === categoryId);
    return getSortOrderForEnd(inCategory);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = {
        categoryId,
        name,
        description: description || undefined,
        price: parseFloat(price),
        imageUrl: imageUrl.trim() || undefined,
        sortOrder: resolveSortOrder(),
        isActive,
        trackStock,
        stockQuantity: trackStock ? parseInt(stockQuantity, 10) || 0 : 0,
        promoType: promoEnabled ? promoType : ('NONE' as ProductPromoType),
        promoValue:
          promoEnabled && promoValue.trim()
            ? parseFloat(promoValue)
            : undefined,
        ...(promoEnabled
          ? {
              promoStartsAt: promoStartsAt
                ? new Date(promoStartsAt).toISOString()
                : null,
              promoEndsAt: promoEndsAt
                ? new Date(promoEndsAt).toISOString()
                : null,
            }
          : {
              promoStartsAt: null,
              promoEndsAt: null,
            }),
        sauceMode,
        allowSauceSeparate: sauceMode === 'NONE' ? true : allowSauceSeparate,
        sauceIds:
          sauceMode === 'NONE'
            ? []
            : selectedSauceIds,
      };
      if (editing) {
        await updateProduct(editing.id, data);
      } else {
        await createProduct(data);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (item: Product) => {
    setDeleteTarget(item);
    setDeleteError('');
  };

  const closeDelete = () => {
    if (deleteLoading) return;
    setDeleteTarget(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteProduct(deleteTarget.id);
      closeDelete();
      await load();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
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
        title="Productos"
        description="Gestiona el menú del restaurante"
        action={<Button onClick={openCreate}>+ Nuevo producto</Button>}
      />

      <CrudTable
        loading={loadingData}
        empty={items.length === 0}
        loadingMessage="Cargando productos..."
        emptyMessage="No hay productos registrados."
      >
        <table className="w-full text-sm min-w-[720px]">
          <CrudThead>
            <CrudTh className="w-16" />
            <CrudTh>Producto</CrudTh>
            <CrudTh>Categoría</CrudTh>
            <CrudTh>Precio</CrudTh>
            <CrudTh>Estado</CrudTh>
            <CrudTh className="text-right">Acciones</CrudTh>
          </CrudThead>
          <tbody>
            {items.map((item) => (
              <CrudTr key={item.id}>
                <CrudTd>
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.name}
                    aspect="square"
                    className="w-12"
                  />
                </CrudTd>
                <CrudTd>
                  <div className="font-bold text-foreground">{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                      {item.description}
                    </div>
                  )}
                </CrudTd>
                <CrudTd>
                  <span className="inline-flex px-2.5 py-1 rounded-lg bg-background text-foreground text-xs font-bold border border-border">
                    {item.categoryName}
                  </span>
                </CrudTd>
                <CrudTd>
                  <ProductPrice
                    price={item.price}
                    effectivePrice={item.effectivePrice}
                    hasPromotion={item.hasPromotion}
                    promoLabel={item.promoLabel}
                    showBadge
                  />
                </CrudTd>
                <CrudTd>
                  <Badge active={item.isActive} />
                </CrudTd>
                <CrudTd>
                  <CrudActions
                    onEdit={() => openEdit(item)}
                    onDelete={() => openDelete(item)}
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
        title={editing ? 'Editar producto' : 'Nuevo producto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <Select
              label="Categoría"
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              required
            >
              <option value="">Seleccionar...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <Input
              label="Precio (Bs.)"
              type="number"
              min={0}
              step="0.5"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={1}
                className="w-full min-h-[46px] resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/50 px-4 py-3">
            <ImageUploadField
              label="Imagen del producto"
              value={imageUrl}
              onChange={setImageUrl}
              onUpload={uploadProductImage}
              compact
              preview={
                <ProductImage
                  src={imageUrl}
                  alt={name || 'Vista previa'}
                  aspect="square"
                  className="size-16"
                />
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-background/50 px-4 py-3 sm:grid-cols-2">
            <ActiveCheckbox checked={isActive} onChange={setIsActive} />
            <ActiveCheckbox
              checked={trackStock}
              onChange={setTrackStock}
              label="Controlar inventario"
            />
          </div>
          {trackStock && (
            <div className="max-w-xs">
              <Input
                label="Unidades en stock"
                type="number"
                min={0}
                step={1}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-3 rounded-xl border border-border bg-background/50 px-4 py-3">
            <ActiveCheckbox
              checked={promoEnabled}
              onChange={setPromoEnabled}
              label="Promoción o descuento"
            />

            {promoEnabled && (
              <div className="space-y-3 pt-1">
                <Select
                  label="Tipo"
                  value={promoType}
                  onChange={(e) =>
                    setPromoType(e.target.value as ProductPromoType)
                  }
                >
                  <option value="PERCENT">Descuento en %</option>
                  <option value="FIXED_PRICE">Precio promocional fijo</option>
                </Select>

                <Input
                  label={
                    promoType === 'PERCENT'
                      ? 'Descuento (%)'
                      : 'Precio promocional (Bs.)'
                  }
                  type="number"
                  min={promoType === 'PERCENT' ? 1 : 0}
                  max={promoType === 'PERCENT' ? 100 : undefined}
                  step={promoType === 'PERCENT' ? 1 : 0.5}
                  value={promoValue}
                  onChange={(e) => setPromoValue(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Inicio (opcional)"
                    type="datetime-local"
                    value={promoStartsAt}
                    onChange={(e) => setPromoStartsAt(e.target.value)}
                  />
                  <Input
                    label="Fin (opcional)"
                    type="datetime-local"
                    value={promoEndsAt}
                    onChange={(e) => setPromoEndsAt(e.target.value)}
                  />
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  El descuento aplica al precio base del producto. Los extras se
                  cobran al precio normal.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-background/50 px-4 py-3">
            <Select
              label="Salsas de acompañamiento"
              value={sauceMode}
              onChange={(e) => {
                const next = e.target.value as ProductSauceMode;
                setSauceMode(next);
                if (next === 'NONE') {
                  setSelectedSauceIds([]);
                }
              }}
            >
              {(Object.keys(SAUCE_MODE_LABELS) as ProductSauceMode[]).map(
                (mode) => (
                  <option key={mode} value={mode}>
                    {SAUCE_MODE_LABELS[mode]}
                  </option>
                ),
              )}
            </Select>

            {sauceMode !== 'NONE' && (
              <div className="space-y-3 pt-1">
                <ActiveCheckbox
                  checked={allowSauceSeparate}
                  onChange={setAllowSauceSeparate}
                  label="Permitir salsa aparte"
                />

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Salsas disponibles
                  </p>
                  {sauceOptions.length === 0 ? (
                    <p className="text-sm text-text-secondary">
                      Crea salsas en la sección Salsas del menú.
                    </p>
                  ) : (
                    <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-border bg-background p-3">
                      {sauceOptions.map((sauce) => {
                        const checked = selectedSauceIds.includes(sauce.id);
                        return (
                          <label
                            key={sauce.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition ${
                              checked ? 'bg-primary/10' : 'hover:bg-white/[0.04]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setSelectedSauceIds((prev) =>
                                  prev.includes(sauce.id)
                                    ? prev.filter((id) => id !== sauce.id)
                                    : [...prev, sauce.id],
                                );
                              }}
                              className="size-4 accent-primary"
                            />
                            <span className="text-sm font-semibold text-foreground">
                              {sauce.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {sauceMode === 'SINGLE'
                    ? 'El cliente deberá elegir exactamente una salsa.'
                    : 'El cliente podrá elegir una o más salsas.'}
                </p>
              </div>
            )}
          </div>

          {error && <FormError message={error} />}
          <FormActions
            saving={saving}
            onCancel={() => setModalOpen(false)}
          />
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={closeDelete}
        title="Eliminar producto"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <Card padding="sm" className="bg-red-950/30 border-red-800/50">
              <p className="text-sm text-red-200 font-medium leading-relaxed">
                Vas a quitar{' '}
                <strong className="text-red-100">{deleteTarget.name}</strong>{' '}
                del menú. Dejará de aparecer en el POS y en el menú público. Los
                pedidos anteriores conservan el nombre del producto.
              </p>
            </Card>

            <div className="flex gap-3 rounded-xl border border-border bg-background p-3">
              <ProductImage
                src={deleteTarget.imageUrl}
                alt={deleteTarget.name}
                aspect="square"
                className="w-16 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground truncate">
                  {deleteTarget.name}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {deleteTarget.categoryName}
                </p>
                <p className="text-sm font-bold text-primary mt-1">
                  {formatPrice(deleteTarget.price)}
                </p>
                <div className="mt-2">
                  <Badge active={deleteTarget.isActive} />
                </div>
              </div>
            </div>

            <p className="text-xs text-text-secondary">
              Si solo quieres ocultarlo temporalmente, cancela y desmarca
              &quot;Activo&quot; al editar el producto.
            </p>

            {deleteError && <FormError message={deleteError} />}

            <div className="flex gap-2 pt-1">
              <Button
                variant="danger"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1"
              >
                {deleteLoading ? 'Eliminando...' : 'Eliminar producto'}
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
