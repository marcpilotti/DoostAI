import type { AdCreative, BrandProfile } from "@/lib/stores/wizard-store";

export type AdLayoutProps = {
  ads: AdCreative[];
  brand: BrandProfile | null;
  onToggleSelection: (adId: string) => void;
  onEdit: (adId: string) => void;
  onRegenerate: () => void;
  renderAdContent: (ad: AdCreative) => React.ReactNode;
};
