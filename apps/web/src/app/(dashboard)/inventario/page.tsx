'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRequireJefa } from '@/hooks/useRequireJefa';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormError } from '@/components/ui/CrudForm';
import {
  CrudTable,
  CrudThead,
  CrudTh,
  CrudTr,
  CrudTd,
} from '@/components/ui/CrudTable';
import {
  getProducts,
  updateProduct,
  getErrorMessage,
} from '@/lib/catalog';
import type { Product } from '@/types/catalog';
import { isLowStock, isOutOfStock } from '@/lib/inventory';

export default function InventarioPage() {
  const { loading, isJefa } = useRequireJefa();
  const [items, setItems] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [draftQty, setDraftQty] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadingData(true);
    setError('');
    try {
      const products = await getProducts(undefined, true, true);
      setItems(products);
      setDraftQty(
        Object.fromEntries(products.map((p) => [p.id, String(p.stockQuantity)])),
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isJefa) load();
  }, [isJefa, load]);

  const saveQuantity = async (product: Product) => {
    const raw = draftQty[product.id] ?? String(product.stockQuantity);
    const qty = parseInt(raw, 10);
    if (Number.isNaN(qty) || qty < 0) {
      setError('La cantidad debe ser un número entero mayor o igual a 0');
      return;
    }
    setSavingId(product.id);
    setError('');
    try {
      await updateProduct(product.id, { stockQuantity: qty, trackStock: true });
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-text-secondary">Verificando acceso...</div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Inventario"
        description="Cantidades de productos con control de stock (por ejemplo bebidas). Cada pedido confirmado descuenta automáticamente."
      />

      {error && (
        <div className="mb-4">
          <FormError message={error} />
        </div>
      )}

      <CrudTable
        loading={loadingData}
        empty={!loadingData && items.length === 0}
        loadingMessage="Cargando inventario..."
        emptyMessage='No hay productos con inventario activo. Edita un producto en Productos y marca "Controlar inventario".'
      >
        <table className="w-full text-sm min-w-[640px]">
          <CrudThead>
            <CrudTr>
              <CrudTh>Producto</CrudTh>
              <CrudTh>Categoría</CrudTh>
              <CrudTh>En stock</CrudTh>
              <CrudTh>Estado</CrudTh>
              <CrudTh className="text-right">Acción</CrudTh>
            </CrudTr>
          </CrudThead>
          <tbody>
            {items.map((product) => {
              const out = isOutOfStock(product);
              const low = isLowStock(product);
              return (
                <CrudTr key={product.id}>
                  <CrudTd>
                    <span className="font-bold text-foreground">{product.name}</span>
                  </CrudTd>
                  <CrudTd>{product.categoryName ?? '—'}</CrudTd>
                  <CrudTd>
                    <div className="flex max-w-[140px] items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={draftQty[product.id] ?? '0'}
                        onChange={(e) =>
                          setDraftQty((prev) => ({
                            ...prev,
                            [product.id]: e.target.value,
                          }))
                        }
                        aria-label={`Cantidad ${product.name}`}
                      />
                    </div>
                  </CrudTd>
                  <CrudTd>
                    {out ? (
                      <span className="inline-flex rounded-full border border-red-800/50 bg-red-950/40 px-2.5 py-1 text-xs font-bold text-red-300">
                        Agotado
                      </span>
                    ) : low ? (
                      <span className="inline-flex rounded-full border border-amber-800/50 bg-amber-950/40 px-2.5 py-1 text-xs font-bold text-amber-200">
                        Stock bajo
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-green-800/50 bg-green-950/40 px-2.5 py-1 text-xs font-bold text-green-300">
                        Disponible
                      </span>
                    )}
                  </CrudTd>
                  <CrudTd className="text-right">
                    <Button
                      variant="secondary"
                      onClick={() => saveQuantity(product)}
                      disabled={savingId === product.id}
                    >
                      {savingId === product.id ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </CrudTd>
                </CrudTr>
              );
            })}
          </tbody>
        </table>
      </CrudTable>
    </div>
  );
}
