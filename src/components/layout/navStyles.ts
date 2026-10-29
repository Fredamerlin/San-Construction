/** Desktop navigation link styling (reference): muted text, gold when hovered or active. */
export function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'relative inline-flex min-h-11 items-center px-2.5 text-sm font-medium transition-colors duration-200 xl:px-3',
    isActive ? 'font-semibold text-gold' : 'text-gray-300 hover:text-gold',
  ].join(' ');
}
