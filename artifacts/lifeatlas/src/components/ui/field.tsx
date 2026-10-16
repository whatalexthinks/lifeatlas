"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Switch as RadixSwitch, Checkbox as RadixCheckbox, RadioGroup as RadixRadio } from "radix-ui";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-[12px] border border-line-strong/80 bg-surface px-4 text-[1rem] text-ink shadow-[inset_0_1px_1px_rgb(0_0_0/0.03)] placeholder:text-ink-4 transition-[border-color,box-shadow] duration-150 focus:border-evergreen focus:outline-none focus:ring-[3px] focus:ring-evergreen/15 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/10 disabled:opacity-60";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-[0.9375rem] font-medium text-ink", className)} {...props} />;
}

export function Hint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[0.875rem] leading-snug text-ink-3", className)} {...props} />;
}

export function ErrorText({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p role="alert" className={cn("text-[0.875rem] font-medium text-danger", className)} {...props}>
      {children}
    </p>
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  optional,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {optional ? <span className="text-[0.8125rem] text-ink-3">Optional</span> : null}
      </div>
      {children}
      {hint && !error ? <Hint id={`${htmlFor}-hint`}>{hint}</Hint> : null}
      <ErrorText id={`${htmlFor}-error`}>{error}</ErrorText>
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cn(control, "h-12", className)} {...props} />;
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(control, "min-h-32 py-3 leading-relaxed", className)} {...props} />;
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(function Select(
  { className, invalid, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} aria-invalid={invalid || undefined} className={cn(control, "h-12 appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
    </div>
  );
});

export function Checkbox({
  id,
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  className,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <RadixCheckbox.Root
        id={id}
        checked={checked}
        disabled={disabled}
        aria-describedby={description ? `${id}-desc` : undefined}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-[6px] border border-line-strong bg-surface transition-colors data-[state=checked]:border-evergreen data-[state=checked]:bg-evergreen disabled:opacity-50"
      >
        <RadixCheckbox.Indicator>
          <Check className="size-3.5 text-paper" strokeWidth={3} />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-[0.9375rem] font-medium leading-snug text-ink">
          {label}
        </label>
        {description ? (
          <span id={`${id}-desc`} className="mt-0.5 block text-[0.875rem] leading-snug text-ink-3">
            {description}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function Switch({
  id,
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-[0.9375rem] font-medium text-ink">
          {label}
        </label>
        {description ? (
          <span id={`${id}-desc`} className="mt-0.5 block text-[0.875rem] leading-snug text-ink-3">
            {description}
          </span>
        ) : null}
      </div>
      <RadixSwitch.Root
        id={id}
        checked={checked}
        disabled={disabled}
        aria-describedby={description ? `${id}-desc` : undefined}
        onCheckedChange={onCheckedChange}
        className="relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-line-strong transition-colors data-[state=checked]:bg-evergreen disabled:opacity-50"
      >
        <RadixSwitch.Thumb className="block size-6 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
      </RadixSwitch.Root>
    </div>
  );
}

export interface ChoiceOption<T extends string> {
  value: T;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

/** Large, touch-friendly radio cards. */
export function ChoiceCards<const T extends string>({
  value,
  onChange,
  options,
  name,
  columns = 2,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: {
  value: T | undefined;
  onChange: (v: NoInfer<T>) => void;
  options: readonly ChoiceOption<NoInfer<T>>[];
  name: string;
  columns?: 1 | 2 | 3 | 4;
  size?: "md" | "lg";
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <RadixRadio.Root
      value={value}
      onValueChange={(v) => onChange(v as T)}
      name={name}
      aria-label={ariaLabel}
      className={cn(
        "grid gap-3",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-3",
        columns === 4 && "grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {options.map((o) => (
        <RadixRadio.Item
          key={o.value}
          value={o.value}
          disabled={o.disabled}
          className={cn(
            "group relative flex w-full items-start gap-3.5 rounded-[16px] border border-line bg-surface/70 text-left transition-[border-color,background-color,box-shadow] duration-200 hover:border-line-strong hover:bg-surface data-[state=checked]:border-evergreen data-[state=checked]:bg-surface data-[state=checked]:shadow-[0_0_0_1px_var(--evergreen),0_10px_30px_-18px_rgb(40_60_50/0.5)] disabled:opacity-50",
            size === "lg" ? "p-5" : "p-4",
          )}
        >
          {o.icon ? <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ivory text-evergreen transition-colors group-data-[state=checked]:bg-evergreen group-data-[state=checked]:text-paper">{o.icon}</span> : null}
          <span className="min-w-0 flex-1">
            <span className="block text-[1rem] font-medium leading-snug text-ink">{o.label}</span>
            {o.description ? <span className="mt-1 block text-[0.875rem] leading-snug text-ink-3">{o.description}</span> : null}
          </span>
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-line-strong transition-colors group-data-[state=checked]:border-evergreen group-data-[state=checked]:bg-evergreen">
            <RadixRadio.Indicator>
              <span className="block size-2 rounded-full bg-paper" />
            </RadixRadio.Indicator>
          </span>
        </RadixRadio.Item>
      ))}
    </RadixRadio.Root>
  );
}

/** Compact segmented control (single-choice), keyboard accessible as a radio group. */
export function Segmented<const T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
  className,
}: {
  value: T;
  onChange: (v: NoInfer<T>) => void;
  options: readonly { value: NoInfer<T>; label: React.ReactNode; icon?: React.ReactNode }[];
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <RadixRadio.Root
      value={value}
      onValueChange={(v) => onChange(v as T)}
      aria-label={label}
      orientation="horizontal"
      className={cn("inline-flex rounded-full border border-line bg-ivory/70 p-1", className)}
    >
      {options.map((o) => (
        <RadixRadio.Item
          key={o.value}
          value={o.value}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full font-medium text-ink-3 transition-[background-color,color,box-shadow] duration-200 hover:text-ink data-[state=checked]:bg-surface data-[state=checked]:text-ink data-[state=checked]:shadow-sm",
            size === "sm" ? "h-8 px-3 text-[0.8125rem]" : "h-9 px-4 text-[0.875rem]",
          )}
        >
          {o.icon}
          {o.label}
        </RadixRadio.Item>
      ))}
    </RadixRadio.Root>
  );
}
