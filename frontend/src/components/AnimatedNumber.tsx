import { useCountUp } from '../hooks/useCountUp';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function AnimatedNumber({ value, decimals = 0, prefix = '', suffix = '', className }: AnimatedNumberProps) {
  const current = useCountUp(value);
  return (
    <span className={className} aria-label={`${prefix}${value.toFixed(decimals)}${suffix}`}>
      <span aria-hidden="true" className="tabular-nums">
        {prefix}
        {current.toFixed(decimals)}
        {suffix}
      </span>
    </span>
  );
}
