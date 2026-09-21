"use client";

import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleCardProps {
  workflowId: string;
}

interface ScheduleFormState {
  hour: string;       // "1"–"12"
  minute: string;     // "00" | "15" | "30" | "45"
  ampm: "AM" | "PM";
  timezone: string;
  days: number[];     // 0=Sun, 1=Mon, … 6=Sat
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAY_FULL   = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ["00", "15", "30", "45"];

const TIMEZONES: { value: string; label: string }[] = [
  { value: "Asia/Calcutta",        label: "IST – India (UTC+5:30)"       },
  { value: "America/New_York",     label: "EST – New York (UTC-5)"        },
  { value: "America/Chicago",      label: "CST – Chicago (UTC-6)"         },
  { value: "America/Denver",       label: "MST – Denver (UTC-7)"          },
  { value: "America/Los_Angeles",  label: "PST – Los Angeles (UTC-8)"     },
  { value: "Europe/London",        label: "GMT – London (UTC+0)"          },
  { value: "Europe/Paris",         label: "CET – Paris (UTC+1)"           },
  { value: "Europe/Berlin",        label: "CET – Berlin (UTC+1)"          },
  { value: "Asia/Dubai",           label: "GST – Dubai (UTC+4)"           },
  { value: "Asia/Singapore",       label: "SGT – Singapore (UTC+8)"       },
  { value: "Asia/Tokyo",           label: "JST – Tokyo (UTC+9)"           },
  { value: "Australia/Sydney",     label: "AEDT – Sydney (UTC+11)"        },
  { value: "UTC",                  label: "UTC"                           },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formToCron(form: ScheduleFormState): string {
  let h = parseInt(form.hour, 10);
  if (form.ampm === "AM" && h === 12) h = 0;
  if (form.ampm === "PM" && h !== 12) h += 12;

  const daysPart =
    form.days.length === 7 || form.days.length === 0
      ? "*"
      : form.days.sort((a, b) => a - b).join(",");

  return `${parseInt(form.minute, 10)} ${h} * * ${daysPart}`;
}

function cronToForm(cron: string, timezone?: string): ScheduleFormState {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return defaultForm();

  const [minuteStr, hourStr, , , daysStr] = parts;

  const h24  = parseInt(hourStr, 10);
  const ampm: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;

  const rawMinute = parseInt(minuteStr, 10);
  const validMinutes = [0, 15, 30, 45];
  const snapped = validMinutes.reduce((prev, cur) =>
    Math.abs(cur - rawMinute) < Math.abs(prev - rawMinute) ? cur : prev,
  );
  const minute = String(snapped).padStart(2, "0");

  let days: number[] = [];
  if (daysStr === "*") {
    days = [0, 1, 2, 3, 4, 5, 6];
  } else {
    days = daysStr.split(",").map(Number).filter((d) => d >= 0 && d <= 6);
  }

  return { hour: String(h12), minute, ampm, timezone: timezone ?? "Asia/Calcutta", days };
}

function defaultForm(): ScheduleFormState {
  return { hour: "9", minute: "00", ampm: "AM", timezone: "Asia/Calcutta", days: [1, 2, 3, 4, 5] };
}

function humanReadableCron(form: ScheduleFormState): string {
  const timeStr = `${form.hour}:${form.minute} ${form.ampm}`;
  const tz = TIMEZONES.find((t) => t.value === form.timezone);
  const tzShort = tz ? tz.label.split("–")[0].trim() : form.timezone;

  if (form.days.length === 0) return "Never (no days selected)";
  if (form.days.length === 7) return `Every day at ${timeStr} ${tzShort}`;

  const sorted = [...form.days].sort((a, b) => a - b);
  const isWeekdays = sorted.join(",") === "1,2,3,4,5";
  const isWeekends = sorted.join(",") === "0,6";

  if (isWeekdays) return `Weekdays (Mon–Fri) at ${timeStr} ${tzShort}`;
  if (isWeekends) return `Weekends (Sat–Sun) at ${timeStr} ${tzShort}`;

  const dayNames = sorted.map((d) => DAY_FULL[d]).join(", ");
  return `${dayNames} at ${timeStr} ${tzShort}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScheduleCard({ workflowId }: ScheduleCardProps) {
  const utils = trpc.useUtils();

  const { data: scheduleData, isLoading: isScheduleLoading } =
    trpc.execution.getWorkflowSchedule.useQuery(
      { workflowId },
      { enabled: Boolean(workflowId) },
    );

  const scheduleMutation = trpc.execution.scheduleWorkflow.useMutation({
    onSuccess: () => utils.execution.getWorkflowSchedule.invalidate({ workflowId }),
  });

  const toggleMutation = trpc.execution.toggleWorkflowSchedule.useMutation({
    onSuccess: () => utils.execution.getWorkflowSchedule.invalidate({ workflowId }),
  });

  const deleteMutation = trpc.execution.deleteWorkflowSchedule.useMutation({
    onSuccess: () => utils.execution.getWorkflowSchedule.invalidate({ workflowId }),
  });

  const [form, setForm]         = useState<ScheduleFormState>(defaultForm());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (scheduleData?.cron) {
      setForm(cronToForm(scheduleData.cron, scheduleData.timezone ?? undefined));
    }
  }, [scheduleData]);

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }));
  };

  const handleSave = () => {
    scheduleMutation.mutate({ workflowId, cron: formToCron(form), timezone: form.timezone });
    setIsExpanded(false);
  };

  const isActive   = scheduleData?.active ?? false;
  const hasSchedule = Boolean(scheduleData);
  const isBusy     = scheduleMutation.isPending || toggleMutation.isPending || deleteMutation.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm leading-none">⏰</span>
          <span className="text-xs font-bold text-zinc-900">Automated Schedule</span>
          {hasSchedule ? (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold border flex items-center gap-1 ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              {isActive ? "Active" : "Paused"}
            </span>
          ) : (
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 border border-zinc-200">
              Not set
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasSchedule && (
            <Switch
              checked={isActive}
              disabled={isBusy}
              onCheckedChange={(checked) => toggleMutation.mutate({ workflowId, active: checked })}
              size="sm"
            />
          )}
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="rounded-md px-2 py-0.5 text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors cursor-pointer"
          >
            {isExpanded ? "Hide" : hasSchedule ? "Edit" : "Configure"}
          </button>
        </div>
      </div>

      {/* Summary row (collapsed, schedule exists) */}
      {hasSchedule && !isExpanded && (
        <div className="px-3 pb-3 space-y-1.5 text-[11px]">
          <div className="rounded-lg bg-zinc-50 border border-zinc-100 px-2.5 py-2 space-y-1">
            <p className="font-medium text-zinc-800">{humanReadableCron(form)}</p>
            <p className="font-mono text-zinc-400 text-[10px]">cron: {scheduleData?.cron}</p>
            {scheduleData?.nextRun && (
              <p className="text-zinc-500 text-[10px]">
                Next run:{" "}
                <span className="font-mono text-emerald-700 font-medium">
                  {new Date(scheduleData.nextRun).toLocaleString("en-IN", {
                    timeZone: form.timezone,
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => deleteMutation.mutate({ workflowId })}
              disabled={isBusy}
              className="text-[11px] font-medium text-red-500 hover:text-red-700 hover:underline transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Removing…" : "Remove schedule"}
            </button>
          </div>
        </div>
      )}

      {/* CTA – no schedule, collapsed */}
      {!hasSchedule && !isExpanded && (
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-zinc-200 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 transition-colors cursor-pointer"
          >
            <span className="text-base leading-none">+</span>
            <span>Set up automated schedule</span>
          </button>
        </div>
      )}

      {/* Skeleton */}
      {isScheduleLoading && !hasSchedule && !isExpanded && (
        <div className="px-3 pb-3">
          <div className="h-8 animate-pulse rounded-lg bg-zinc-100" />
        </div>
      )}

      {/* ── Expanded form ── */}
      {isExpanded && (
        <div className="border-t border-zinc-100 px-3 pt-3 pb-3 space-y-3.5">

          {/* Days of week */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Run on</p>
            <div className="flex gap-1">
              {DAY_LABELS.map((label, idx) => {
                const selected = form.days.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    title={DAY_FULL[idx]}
                    className={`flex-1 rounded-md py-1.5 text-[11px] font-bold transition-all cursor-pointer select-none ${
                      selected
                        ? "bg-zinc-900 text-white shadow-xs"
                        : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {/* Quick presets */}
            <div className="flex flex-wrap gap-1">
              {[
                { label: "Weekdays",  days: [1, 2, 3, 4, 5]          },
                { label: "Every day", days: [0, 1, 2, 3, 4, 5, 6]    },
                { label: "Weekends",  days: [0, 6]                    },
                { label: "Clear",     days: []                         },
              ].map((preset) => {
                const active =
                  preset.days.length > 0 &&
                  preset.days.length === form.days.length &&
                  preset.days.every((d) => form.days.includes(d));
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, days: preset.days }))}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time picker */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">At time</p>
            <div className="flex items-center gap-1.5">
              {/* Hour */}
              <Select value={form.hour} onValueChange={(v) => { if (v) setForm((f) => ({ ...f, hour: v })); }}>
                <SelectTrigger className="h-8 w-16 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={h} className="text-xs font-mono">{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-zinc-300 font-mono font-bold text-lg leading-none">:</span>

              {/* Minute */}
              <Select value={form.minute} onValueChange={(v) => { if (v) setForm((f) => ({ ...f, minute: v })); }}>
                <SelectTrigger className="h-8 w-16 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs font-mono">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* AM / PM toggle */}
              <div className="flex rounded-lg overflow-hidden border border-zinc-200">
                {(["AM", "PM"] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, ampm: period }))}
                    className={`px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                      form.ampm === period
                        ? "bg-zinc-900 text-white"
                        : "bg-white text-zinc-500 hover:bg-zinc-50"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Timezone</p>
            <Select value={form.timezone} onValueChange={(v) => setForm((f) => { if (!v) return f; return { ...f, timezone: v }; })}>
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value} className="text-xs">{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Live preview */}
          <div className="rounded-lg bg-zinc-50 border border-zinc-100 px-2.5 py-2 space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Preview</p>
            <p className="text-[11px] font-medium text-zinc-700">{humanReadableCron(form)}</p>
            <p className="text-[10px] font-mono text-zinc-400">cron: {formToCron(form)}</p>
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy || form.days.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              {scheduleMutation.isPending ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Saving…</span>
                </>
              ) : (
                <span>{hasSchedule ? "Update Schedule" : "Enable Schedule"}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
