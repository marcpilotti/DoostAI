"use client";

import { useEffect } from "react";
import { Plus } from "lucide-react";
import { MOCK_PRODUCTS } from "@/lib/mock-data";

export default function ProductsPage() {
  useEffect(() => { document.title = "Products — Doost AI"; }, []);
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-[var(--doost-text)]">Products</h2>
        <button className="flex items-center gap-1.5 rounded-lg bg-[var(--doost-bg-active)] px-3 py-2 text-[12px] font-medium text-white hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> Add product
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {MOCK_PRODUCTS.map((p) => (
          <div key={p.id} className="group overflow-hidden rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] transition-shadow hover:shadow-md" style={{ border: `1px solid var(--doost-border)` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.imageUrl} alt={p.name} className="aspect-square w-full object-cover" loading="lazy" />
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
    </div>
  );
}
