"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, listItemVariants,transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

function TagList({
  label,
  items,
  onAdd,
  onRemove,
}: {
  label: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem("");
      setAdding(false);
    }
  };

  return (
    <div>
      <span
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </span>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1 text-[13px] font-medium"
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--color-text-secondary)",
            }}
          >
            {item}
            <button
              onClick={() => onRemove(item)}
              className="ml-0.5 text-[12px] transition-colors hover:text-white"
              style={{ color: "var(--color-text-muted)" }}
            >
              ×
            </button>
          </span>
        ))}

        {adding ? (
          <input
            autoFocus
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setAdding(false);
            }}
            onBlur={() => {
              if (newItem.trim()) handleAdd();
              else setAdding(false);
            }}
            className="text-[13px] font-medium outline-none"
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border-focus)",
              color: "var(--color-text-primary)",
              boxShadow: "0 0 0 3px var(--color-primary-glow)",
              width: 120,
            }}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="text-[13px] font-medium transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              border: "1px dashed rgba(255,255,255,0.1)",
              color: "var(--color-text-muted)",
              background: "transparent",
            }}
          >
            + Lägg till
          </button>
        )}
      </div>
    </div>
  );
}

export function AudienceSlide() {
  const { audience, setAudience, brand, setFooterAction } = useWizardStore();
  const { handleNext } = useWizardNavigation();

  useEffect(() => {
    setFooterAction(() => handleNext());
    return () => setFooterAction(null);
  }, [handleNext, setFooterAction]);

  const interests = audience?.interests || [];
  const challenges = audience?.challenges || [];
  const usps = audience?.usps || brand?.valuePropositions || [];

  const update = useCallback(
    (field: "interests" | "challenges" | "usps", items: string[]) => {
      setAudience({
        interests: field === "interests" ? items : interests,
        challenges: field === "challenges" ? items : challenges,
        usps: field === "usps" ? items : usps,
      });
    },
    [interests, challenges, usps, setAudience]
  );

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={transitions.spring}
      className="flex flex-col gap-3"
    >
      <div>
        <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>
          Din målgrupp
        </h2>
        <p className="mt-0.5 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
          Dessa påverkar dina annonstexter.
        </p>
      </div>

      {/* Tags — inline, two sections side by side on desktop */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
        <div className="flex-1">
          <TagList
            label="Intressen"
            items={interests}
            onAdd={(item) => update("interests", [...interests, item])}
            onRemove={(item) => update("interests", interests.filter((i) => i !== item))}
          />
        </div>
        <div className="flex-1">
          <TagList
            label="Utmaningar"
            items={challenges}
            onAdd={(item) => update("challenges", [...challenges, item])}
            onRemove={(item) => update("challenges", challenges.filter((i) => i !== item))}
          />
        </div>
      </div>

      {/* Separator */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

      {/* USPs */}
      <div>
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          Dina unika fördelar
        </span>
        <motion.ol
          variants={{ visible: { transition: transitions.stagger } }}
          initial="hidden"
          animate="visible"
          className="mt-1.5 flex flex-col gap-1.5"
        >
          {usps.map((usp, i) => (
            <motion.li
              key={i}
              variants={listItemVariants}
              className="flex items-start gap-2 text-[14px]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <span
                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  background: "var(--color-primary-glow)",
                  color: "var(--color-primary-light)",
                }}
              >
                {i + 1}
              </span>
              <span>{usp}</span>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </motion.div>
  );
}
