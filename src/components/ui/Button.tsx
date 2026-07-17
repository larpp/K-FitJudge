import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'accent' | 'green' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: '',
  accent: 'btn-accent',
  green: 'btn-green',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
};

const sizeClass: Record<Size, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const classes = ['btn', variantClass[variant], sizeClass[size], block ? 'btn-block' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
