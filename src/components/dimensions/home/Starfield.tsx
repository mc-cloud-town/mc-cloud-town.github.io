'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import gsap from 'gsap';
import { STAR_DRIFT } from '@/constants/starfield';

const LAYERS = [
  { size: 512, dur: 90, opacity: 0.9 },
  { size: 820, dur: 60, opacity: 0.6 },
  { size: 1300, dur: 40, opacity: 0.45 },
];
const COLOURS = ['#9fe8d8', '#c9a7ff', '#6fb7ff', '#ffffff', '#58d6b0'];

/**
 * One generated tile of specks, used at three depths that drift slowly.
 * The drift runs only while the scene that holds the stars is switched on.
 */
export const Starfield = ({ reduced }: { reduced: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d');
    if (!x) return;
    for (let i = 0; i < 150; i++) {
      x.fillStyle = COLOURS[i % COLOURS.length];
      x.globalAlpha = Math.random() * 0.8 + 0.2;
      const s = Math.random() < 0.12 ? 3 : Math.random() < 0.4 ? 2 : 1;
      x.fillRect(
        Math.floor(Math.random() * 512),
        Math.floor(Math.random() * 512),
        s,
        s,
      );
    }
    const url = c.toDataURL();
    const layers = [...host.children] as HTMLElement[];
    layers.forEach((l) => (l.style.backgroundImage = `url(${url})`));
    if (reduced) return;
    const tweens = layers.map((l, i) =>
      gsap.to(l, {
        x: i % 2 ? STAR_DRIFT.x : -STAR_DRIFT.x,
        y: -STAR_DRIFT.y,
        duration: LAYERS[i].dur,
        ease: 'none',
        repeat: -1,
        yoyo: true,
        paused: true,
      }),
    );
    // The scene changes switch the layer on and off through its inline visibility (GSAP autoAlpha);
    // the stylesheet keeps it hidden until then. Three screen-sized layers do not move behind the rest of the page.
    const scene = host.closest<HTMLElement>('.scene');
    const sync = () => {
      // Not while the scene is still fading in either: the layers hold still through the scene change
      // (a drift of a few pixels a second cannot be seen there) and that change costs fewer late frames.
      const v = scene?.style.visibility;
      const o = scene?.style.opacity;
      const on =
        !scene || (v !== '' && v !== 'hidden' && (o === '' || o === '1'));
      tweens.forEach((t) => t.paused(!on));
    };
    const watch = new MutationObserver(sync);
    if (scene)
      watch.observe(scene, { attributes: true, attributeFilter: ['style'] });
    sync();
    return () => {
      watch.disconnect();
      tweens.forEach((t) => t.kill());
    };
  }, [reduced]);

  return (
    <div
      className='starfield'
      ref={ref}
      // the stylesheet makes each layer this much larger than the screen, so the drift never uncovers an edge
      style={
        {
          '--drift-x': `${STAR_DRIFT.x}px`,
          '--drift-y': `${STAR_DRIFT.y}px`,
        } as CSSProperties
      }
    >
      {LAYERS.map((l) => (
        <i
          key={l.size}
          style={{ backgroundSize: `${l.size}px`, opacity: l.opacity }}
        />
      ))}
    </div>
  );
};
