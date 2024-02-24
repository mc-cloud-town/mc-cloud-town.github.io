import React, { useEffect, useState, useRef } from 'react';

/**
 * This hook is used to animate a component when it is scrolled into view.
 * @returns {Object{boolean, React.RefObject<HTMLDivElement>}} - Animate state and ref object
 */
const useAnimateOnScroll = (): {
  animate: boolean,
  ref: React.RefObject<HTMLDivElement>
} => {
  const [animate, setAnimate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const sectionPos = ref.current.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;

        if (sectionPos < windowHeight / 1.25) {
          setAnimate(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { animate, ref };
};

export default useAnimateOnScroll;
