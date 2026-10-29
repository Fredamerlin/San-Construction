import { Fragment } from 'react';
import { Link } from 'react-router';

export interface Crumb {
  label: string;
  /** Omit for the current page. */
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 text-sm text-stone">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && (
              <li aria-hidden="true" className="text-concrete-500">
                /
              </li>
            )}
            <li>
              {item.to ? (
                <Link to={item.to} className="inline-flex min-h-11 items-center hover:text-bone">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-bone">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
