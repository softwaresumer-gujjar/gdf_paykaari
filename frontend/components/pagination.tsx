'use client';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, total, limit, onPage, className = '' }: Props) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className={`flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-[var(--border)] ${className}`}>
      <span className="text-xs text-[var(--text-3)]">
        {from}–{to} of {total.toLocaleString()}
      </span>
      <div className="pagination">
        <button className="page-btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>‹</button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`ellipsis-${i}`} className="px-1 text-[var(--text-3)] text-xs select-none">…</span>
            : <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPage(p as number)}>{p}</button>
        )}
        <button className="page-btn" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>›</button>
      </div>
    </div>
  );
}
