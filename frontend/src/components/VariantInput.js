import { useId } from 'react';

export function VariantInput({ options, className, ...props }) {
  const listId = `variants-${useId().replace(/:/g, '')}`;
  return (
    <>
      <input list={listId} autoComplete="off" placeholder="Basic, Silk…" className={className} {...props} />
      <datalist id={listId}>{options.map(o => <option key={o} value={o} />)}</datalist>
    </>
  );
}
