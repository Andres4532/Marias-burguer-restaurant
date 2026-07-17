'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import { useRequireJefa } from '@/hooks/useRequireJefa';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
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
  getExtras,
  createProduct,
  updateProduct,
  deleteProduct,
  formatPrice,
  getErrorMessage,
} from '@/lib/catalog';
import { uploadProductImage } from '@/lib/uploads';
import type { Product, Category, Extra } from '@/types/catalog';

export default function ProductosPage() {
  const { loading, isJefa } = useRequireJefa();
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      const [products, cats, ext] = await Promise.all([
        getProducts(undefined, true),
        getCategories(true),
        getExtras(true),
      ]);
      setItems(products);
      setCategories(cats);
      setExtras(ext);
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
    setCategoryId(categories[0]?.id ?? '');
    setName('');
    setDescription('');
    setPrice('');
    setImageUrl('');
    setSortOrder('0');
    setIsActive(true);
    setSelectedExtras([]);
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
    setSortOrder(String(item.sortOrder));
    setIsActive(item.isActive);
    setSelectedExtras(item.extras?.map((e) => e.id) ?? []);
    setError('');
    setModalOpen(true);
  };

  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extraId)
        ? prev.filter((id) => id !== extraId)
        : [...prev, extraId],
    );
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
        sortOrder: parseInt(sortOrder, 10),
        isActive,
        extraIds: selectedExtras,
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

  const handleDelete = async (item: Product) => {
    if (!confirm(`¿Eliminar producto "${item.name}"?`)) return;
    try {
      await deleteProduct(item.id);
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
            <CrudTh>Extras</CrudTh>
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
                  <span className="font-bold text-primary">
                    {formatPrice(item.price)}
                  </span>
                </CrudTd>
                <CrudTd>
                  <span className="text-text-secondary text-xs font-medium">
                    {item.extras?.length
                      ? item.extras.map((e) => e.name).join(', ')
                      : '—'}
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
        title={editing ? 'Editar producto' : 'Nuevo producto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Categoría"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
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
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm bg-card text-foreground"
            />
          </div>
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
            <ImageUploadField
              label="Imagen del producto"
              value={imageUrl}
              onChange={setImageUrl}
              onUpload={uploadProductImage}
              preview={
                <div className="max-w-[180px]">
                  <ProductImage
                    src={imageUrl}
                    alt={name || 'Vista previa'}
                    aspect="video"
                  />
                </div>
              }
            />
          </div>
          <Input
            label="Orden"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
          {extras.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                Extras en el producto
              </label>
              <p className="text-xs text-text-secondary mb-2">
                Salsas y complementos que el cliente elige al pedir este producto.
                Para porciones aparte, créalas en Productos → categoría Salsas aparte.
              </p>
              <div className="space-y-2 max-h-36 overflow-y-auto border border-border rounded-xl p-3 bg-background">
                {extras.map((extra) => (
                  <label
                    key={extra.id}
                    className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedExtras.includes(extra.id)}
                      onChange={() => toggleExtra(extra.id)}
                      className="rounded border-border text-primary focus:ring-primary/30"
                    />
                    <span className="font-medium">{extra.name}</span>
                    {extra.price > 0 && (
                      <span className="text-text-secondary text-xs font-bold">
                        (+{formatPrice(extra.price)})
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
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
