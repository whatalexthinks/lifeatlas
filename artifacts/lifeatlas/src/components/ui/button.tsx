import * as React from "react";
import Link from "@/lib/router/link";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium tracking-[-0.005em] transition-[background-color,color,box-shadow,transform,border-color] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-ink text-paper shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_1px_2px_rgb(30_26_22/0.18),0_8px_20px_-12px_rgb(30_26_22/0.45)] hover:bg-ink-2",
        accent: "bg-oxblood text-on-oxblood shadow-[0_1px_2px_rgb(60_25_28/0.2),0_8px_20px_-12px_rgb(60_25_28/0.5)] hover:bg-oxblood-deep",
        secondary: "border border-line-strong bg-surface/70 text-ink hover:border-ink-3 hover:bg-surface",
        quiet: "bg-ivory text-ink hover:bg-linen",
        ghost: "text-ink-2 hover:bg-ivory hover:text-ink",
        text: "h-auto! px-0! text-ink underline decoration-1 underline-offset-[0.22em] decoration-current/35 hover:decoration-current",
        destructive: "bg-danger text-on-danger hover:brightness-95",
        light: "bg-[#f8f6f1] text-[#1b1a18] shadow-[0_10px_30px_-12px_rgb(0_0_0/0.6)] hover:bg-white",
        outlineLight: "border border-white/30 text-[#f3efe7] hover:border-white/60 hover:bg-white/8",
        brass: "bg-brass text-[#1f1a12] hover:brightness-105",
      },
      size: {
        sm: "h-10 rounded-[9px] px-4 text-[0.875rem]",
        md: "h-11 rounded-[9px] px-5 text-[0.9375rem]",
        lg: "h-[3.25rem] rounded-[10px] px-7 text-[1rem]",
        xl: "h-14 rounded-[10px] px-7 text-[1rem]",
        icon: "size-11 rounded-full",
        iconSm: "size-9 rounded-full",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Common = VariantProps<typeof buttonVariants> & {
  loading?: boolean;
  trailing?: React.ReactNode;
  leading?: React.ReactNode;
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & Common;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, loading, trailing, leading, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size, block }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : leading}
      {children}
      {trailing ? <span className="inline-flex transition-transform duration-300 ease-out group-hover/btn:translate-x-0.5">{trailing}</span> : null}
    </button>
  );
});

export type ButtonLinkProps = React.ComponentProps<typeof Link> & Common & { external?: boolean };

export function ButtonLink({ className, variant, size, block, trailing, leading, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={cn(buttonVariants({ variant, size, block }), className)} {...props}>
      {leading}
      {children}
      {trailing ? <span className="inline-flex transition-transform duration-300 ease-out group-hover/btn:translate-x-0.5">{trailing}</span> : null}
    </Link>
  );
}

export const IconButton = React.forwardRef<HTMLButtonElement, ButtonProps & { label: string }>(function IconButton(
  { label, className, variant = "ghost", size = "icon", children, ...props },
  ref,
) {
  return (
    <Button ref={ref} variant={variant} size={size} aria-label={label} title={label} className={cn("px-0", className)} {...props}>
      {children}
    </Button>
  );
});
