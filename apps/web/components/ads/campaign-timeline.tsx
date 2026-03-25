"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Pause, RefreshCw, Rocket, Trash2 } from "lucide-react";

type TimelineEvent = {
  eventType: string;
  fromState: string;
  toState: string;
  actor: string;
  createdAt: string;
  payload?: Record<string, unknown>;
};

const EVENT_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  GENERATE_ADS: { icon: <Rocket className="h-3.5 w-3.5" />, color: "text-indigo-500 bg-indigo-50" },
  ADS_GENERATED: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-emerald-500 bg-emerald-50" },
  GENERATION_FAILED: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-red-500 bg-red-50" },
  APPROVE: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-emerald-500 bg-emerald-50" },
  REGENERATE: { icon: <RefreshCw className="h-3.5 w-3.5" />, color: "text-amber-500 bg-amber-50" },
  ALL_DEPLOYED: { icon: <Rocket className="h-3.5 w-3.5" />, color: "text-emerald-500 bg-emerald-50" },
  PARTIAL_DEPLOY: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-amber-500 bg-amber-50" },
  DEPLOY_FAILED: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-red-500 bg-red-50" },
  PAUSE: { icon: <Pause className="h-3.5 w-3.5" />, color: "text-amber-500 bg-amber-50" },
  RESUME: { icon: <Rocket className="h-3.5 w-3.5" />, color: "text-emerald-500 bg-emerald-50" },
  COMPLETE: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-blue-500 bg-blue-50" },
  DELETE: { icon: <Trash2 className="h-3.5 w-3.5" />, color: "text-red-500 bg-red-50" },
};

const DEFAULT_CONFIG = { icon: <Clock className="h-3.5 w-3.5" />, color: "text-gray-500 bg-gray-50" };

export function CampaignTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        Inga händelser ännu.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, i) => {
        const config = EVENT_CONFIG[event.eventType] ?? DEFAULT_CONFIG;
        const isLast = i === events.length - 1;
        const time = new Date(event.createdAt).toLocaleString("sv-SE", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div key={i} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full ${config.color}`}>
                {config.icon}
              </div>
              {!isLast && <div className="w-px flex-1 bg-border/40" />}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-4 ${isLast ? "" : ""}`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{event.eventType}</span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                  {event.fromState}
                  <ArrowRight className="h-2.5 w-2.5" />
                  {event.toState}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground/40">
                <span>{time}</span>
                <span>·</span>
                <span>{event.actor}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
