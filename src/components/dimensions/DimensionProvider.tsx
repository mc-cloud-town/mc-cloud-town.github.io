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

  // The document is told at once, not when React next gets round to it: the dimension is the ground and the accent
  // of what is on screen, and whoever sets it has just put the page there (the home page as it is handed over, a
  // scroll into the next section). The effect below says the same a moment later, and is what a first render has.
  const setDim = useCallback((d: Dimension) => {
    document.documentElement.dataset.dim = d;
    setDimState(d);
  }, []);

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
