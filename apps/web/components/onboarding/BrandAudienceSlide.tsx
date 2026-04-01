"use client";

import { ArrowRight, Briefcase, ChevronDown, MapPin, Pencil, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { BrandProfile } from "./OnboardingShell";

const INDUSTRIES = [
  "Bygg & Fastigheter", "Detaljhandel", "E-handel", "Finans & Försäkring",
  "Fordon & Transport", "Hälsa & Sjukvård", "Hotell & Restaurang", "IT & Tech",
  "Juridik & Redovisning", "Konsult & Rådgivning", "Livsmedel & Dagligvaror",
  "Marknadsföring & Media", "Mode & Skönhet", "Rekrytering & Bemanning",
  "Tillverkning & Industri", "Träning & Fritid", "Utbildning",
  "Energi & Miljö", "Kultur & Nöje", "SaaS & Molntjänster",
];

const CUSTOM_INDUSTRY_VALUE = "__annat__";

function EditableField({ icon: Icon, label, value, onSave }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  function handleSave(newValue: string) {
    onSave(newValue);
    setEditing(false);
  }

  return (
    <Card className="border-0 bg-muted/30 shadow-none">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
        </div>
        {editing ? (
          <Input
            defaultValue={value}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleSave((e.target as HTMLInputElement).value); }}
            onBlur={(e) => handleSave(e.target.value)}
            className="h-auto border-0 bg-background px-2 py-1 text-base font-semibold shadow-none focus-visible:ring-1"
          />
        ) : (
          <button onClick={() => setEditing(true)} className="group flex w-full items-center justify-between rounded-md px-2 py-1 text-left transition-colors hover:bg-background">
            <span className="text-base font-semibold">{value || "Klicka för att ange..."}</span>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export function BrandAudienceSlide({ profile, onConfirm, onBack }: {
  profile: BrandProfile;
  onConfirm: (updated: BrandProfile) => void;
  onBack?: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const initialIsCustom = !!profile.industry && !INDUSTRIES.includes(profile.industry);
  const [industry, setIndustry] = useState(initialIsCustom ? CUSTOM_INDUSTRY_VALUE : (profile.industry ?? ""));
  const [customIndustry, setCustomIndustry] = useState(initialIsCustom ? (profile.industry ?? "") : "");
  const [location, setLocation] = useState(typeof profile.location === "string" ? profile.location : "");
  const [targetAudience, setTargetAudience] = useState(
    typeof profile.targetAudience === "string" ? profile.targetAudience : profile.targetAudience?.demographic ?? "",
  );

  const resolvedIndustry = industry === CUSTOM_INDUSTRY_VALUE ? customIndustry : industry;

  function handleConfirm() {
    onConfirm({ ...profile, industry: resolvedIndustry, location, targetAudience });
  }

  const stagger = (i: number) => prefersReduced ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.08 * i, duration: 0.3 } };

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 pt-[72px] sm:px-6">
      <div className="w-full max-w-lg">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Målgrupp & bransch</CardTitle>
                <CardDescription>Bekräfta eller ändra era uppgifter</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <motion.div {...stagger(0)}>
                <Card className="border-0 bg-muted/30 shadow-none">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bransch</Label>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-md bg-background px-2 py-1.5 shadow-sm ring-1 ring-border">
                      <select
                        value={industry}
                        onChange={(e) => { setIndustry(e.target.value); if (e.target.value !== CUSTOM_INDUSTRY_VALUE) setCustomIndustry(""); }}
                        className="w-full appearance-none bg-transparent text-base font-semibold outline-none cursor-pointer truncate pr-4"
                      >
                        {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                        <option value={CUSTOM_INDUSTRY_VALUE}>Annat</option>
                      </select>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    {industry === CUSTOM_INDUSTRY_VALUE && (
                      <Input
                        value={customIndustry}
                        onChange={(e) => setCustomIndustry(e.target.value)}
                        placeholder="Ange bransch..."
                        autoFocus
                        className="mt-2"
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div {...stagger(1)}>
                <EditableField icon={Users} label="Målgrupp" value={targetAudience} onSave={setTargetAudience} />
              </motion.div>

              <motion.div {...stagger(2)}>
                <EditableField icon={MapPin} label="Plats" value={location} onSave={setLocation} />
              </motion.div>
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button onClick={handleConfirm} size="lg" className="w-full rounded-full">
                Gå vidare
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {onBack && (
                <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">
                  ← Tillbaka
                </button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
