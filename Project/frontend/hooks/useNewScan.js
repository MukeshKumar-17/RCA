import { useState, useCallback } from 'react';

/**
 * useNewScan — manages modal open/close state for the New Scan modal.
 */
export default function useNewScan() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
