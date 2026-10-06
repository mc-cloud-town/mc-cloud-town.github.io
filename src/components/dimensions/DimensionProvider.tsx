'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Dimension = 'overworld' | 'nether' | 'end' | 'respawn';

interface DimensionContextValue {
  dim: Dimension;
  setDim: (d: Dimension) => void;
}

const DimensionContext = createContext<DimensionContextValue | undefined>(
  undefined,
);

export const DimensionProvider = ({
  initial = 'overworld',
  children,
}: {
  initial?: Dimension;
  children: ReactNode;
}) => {
  const [dim, setDimState] = useState<Dimension>(initial);

  const setDim = useCallback((d: Dimension) => setDimState(d), []);

  // <html data-dim> drives the accent colour; remove it when leaving for a legacy page.
  useEffect(() => {
    document.documentElement.dataset.dim = dim;
  }, [dim]);
  useEffect(
    () => () => {
      delete document.documentElement.dataset.dim;
    },
    [],
  );

  const value = useMemo(() => ({ dim, setDim }), [dim, setDim]);
  return (
    <DimensionContext.Provider value={value}>
      {children}
    </DimensionContext.Provider>
  );
};

export const useDimension = (): DimensionContextValue => {
  const ctx = useContext(DimensionContext);
  if (!ctx)
    throw new Error('useDimension must be used within a DimensionProvider');
  return ctx;
};
