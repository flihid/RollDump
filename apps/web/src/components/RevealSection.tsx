import { useInView } from '../hooks/useInView';
import { clsx } from 'clsx';

export default function RevealSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <section
      ref={ref}
      className={clsx('reveal-section', visible && 'reveal-section--visible', className)}
    >
      {children}
    </section>
  );
}
