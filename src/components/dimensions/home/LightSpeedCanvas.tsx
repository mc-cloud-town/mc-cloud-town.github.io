'use client';

import { useEffect, useRef } from 'react';
import { mountLightSpeed } from '@/lib/dimensions/lightSpeed';

/**
 * The wake's canvas: the jump at light speed into the respawn, generated in code (lightSpeed.ts). It draws only
 * while the wake shows it, and is never set up with reduced motion (the scenes change without it).
 */
export const LightSpeedCanvas = ({
  reduced,
}: {
  /** null until the browser has been asked */
  reduced: boolean | null;
}) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduced !== false || !ref.current) return;
    return mountLightSpeed(ref.current);
  }, [reduced]);

  return <canvas className='hyper' ref={ref} aria-hidden='true' />;
};
