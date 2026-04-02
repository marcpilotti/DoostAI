"use client";

import { motion } from "motion/react";
import { useCallback,useState } from "react";

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
    <motion.div variants={listItemVariants}>
      <span
        className="text-text-caption uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1.5 text-text-body-sm font-medium"
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-bg-raised)",
              border: "1px solid var(--color-border-default)",
              color: "var(--color-text-secondary)",
            }}
          >
            {item}
            <button
              onClick={() => onRemove(item)}
              className="ml-0.5 text-[14px] transition-colors"
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
            className="text-text-body-sm font-medium outline-none"
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
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
            className="text-text-body-sm font-medium transition-colors"
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px dashed var(--color-border-default)",
              color: "var(--color-text-muted)",
              background: "transparent",
            }}
          >
            + Lägg till
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function AudienceSlide() {
  const { audience, setAudience, brand } = useWizardStore();
  const { handleNext } = useWizardNavigation();

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
      className="flex flex-col gap-5"
    >
      <div>
        <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>
          Din målgrupp
        </h2>
        <p className="mt-1 text-text-body-sm" style={{ color: "var(--color-text-muted)" }}>
          Dessa påverkar dina annonstexter.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <TagList
          label="Intressen"
          items={interests}
          onAdd={(item) => update("interests", [...interests, item])}
          onRemove={(item) => update("interests", interests.filter((i) => i !== item))}
        />

        <TagList
          label="Utmaningar"
          items={challenges}
          onAdd={(item) => update("challenges", [...challenges, item])}
          onRemove={(item) => update("challenges", challenges.filter((i) => i !== item))}
        />

        <div
          className="my-1"
          style={{
            height: 1,
            background: "var(--color-border-subtle)",
          }}
        />

        <div>
          <div className="flex items-center justify-between">
            <span
              className="text-text-caption uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              Dina unika fördelar
            </span>
          </div>
          <motion.ol
            variants={{ visible: { transition: transitions.stagger } }}
            initial="hidden"
            animate="visible"
            className="mt-2 flex flex-col gap-2"
          >
            {usps.map((usp, i) => (
              <motion.li
                key={i}
                variants={listItemVariants}
                className="flex items-start gap-2 text-text-body"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
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
      </div>

      <button
        onClick={handleNext}
        className="ai-breathe ml-auto mt-2 font-semibold transition-all"
        style={{
          background: "var(--color-primary)",
          color: "var(--color-text-inverse)",
          padding: "12px 28px",
          borderRadius: "var(--radius-sm)",
          fontSize: 16,
          border: "none",
          boxShadow: "var(--shadow-glow-sm)",
        }}
      >
        Fortsätt →
      </button>
    </motion.div>
  );
}
