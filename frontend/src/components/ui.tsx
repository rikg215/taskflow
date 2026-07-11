import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cx } from '../utils';

export const fieldCls =
  'w-full rounded-lg border border-white/[0.08] bg-trackbg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20';

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500', className)}>
      {children}
    </span>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={cx(fieldCls, className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea {...rest} className={cx(fieldCls, 'resize-y leading-relaxed', className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return <select {...rest} className={cx(fieldCls, 'cursor-pointer', className)} />;
}

type ButtonVariant = 'primary' | 'ghost' | 'danger';

export function Button({
  variant = 'primary',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-accent text-accent-ink shadow-[0_0_12px_rgba(63,224,168,0.28)] hover:brightness-110 hover:shadow-[0_0_18px_rgba(63,224,168,0.5)]',
    ghost: 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100',
    danger: 'bg-alert/15 text-alert border border-alert/30 hover:bg-alert/25',
  };
  return (
    <button
      {...rest}
      className={cx(
        'rounded-lg px-3.5 py-2 text-[13px] font-semibold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        className,
      )}
    />
  );
}
