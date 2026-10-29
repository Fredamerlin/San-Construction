import type { ElementType, ReactNode } from 'react';

interface ContainerProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

/** Consistent page width and side gutters (16px on small phones, up to 48px). */
export function Container({ as: Tag = 'div', className = '', children }: ContainerProps) {
  return (
    <Tag className={`mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10 xl:px-12 ${className}`}>
      {children}
    </Tag>
  );
}
