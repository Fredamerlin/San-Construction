/** Quiet placeholder while a page's code loads. No spinner or fake progress. */
export function LoadingFallback() {
  return (
    <div role="status" className="min-h-viewport">
      <span className="sr-only">Loading page</span>
    </div>
  );
}
