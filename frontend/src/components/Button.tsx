import type { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
};

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  loading = false,
  icon,
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const inactive = Boolean(disabled) || loading;
  return (
    <motion.button
      type={type}
      whileHover={inactive ? undefined : { y: -1 }}
      whileTap={inactive ? undefined : { scale: 0.97 }}
      className={cn(VARIANT_CLASS[variant], className)}
      disabled={inactive}
      aria-busy={loading}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </motion.button>
  );
}
