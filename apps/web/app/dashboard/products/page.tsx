"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import type { Product } from "@/lib/mock-data";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function ProductsPage() {
  useEffect(() => { document.title = "Products — Doost AI"; }, []);
  const toast = useToast();

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  function handleEdit(product: Product) {
    toast.info("Coming soon", `Editing ${product.name} will be available soon`);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    toast.success("Product deleted", deleteTarget.name);
    setDeleteTarget(null);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-[var(--doost-text)]">Products</h2>
        <button className="flex items-center gap-1.5 rounded-lg bg-[var(--doost-bg-active)] px-3 py-2 text-[12px] font-medium text-white hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> Add product
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="group relative overflow-hidden rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] transition-shadow hover:shadow-md" style={{ border: `1px solid var(--doost-border)` }}>
            {/* Image with hover overlay */}
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt={p.name} className="aspect-square w-full object-cover" loading="lazy" />
              {/* Hover overlay with Edit/Delete */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => handleEdit(p)}
                  className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-medium text-[var(--doost-text)] shadow-sm transition-transform hover:scale-105"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(p)}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-[11px] font-medium text-white shadow-sm transition-transform hover:scale-105"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
            <div className="p-3">
              <h3 className="text-[13px] font-semibold text-[var(--doost-text)]">{p.name}</h3>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[12px] text-[var(--doost-text-secondary)]">{p.category}</span>
                <span className="text-[13px] font-semibold text-[var(--doost-text)]">{p.price} {p.currency}</span>
              </div>
              {p.status === "draft" && (
                <span className="mt-1.5 inline-block rounded-full bg-[var(--doost-bg-secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--doost-text-muted)]">Draft</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete product"
        description={`Are you sure you want to delete "${deleteTarget?.name ?? ""}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
