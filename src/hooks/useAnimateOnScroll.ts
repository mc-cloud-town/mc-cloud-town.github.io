import React, { useEffect, useState, useRef } from 'react';

/**
 * This hook is used to animate a component when it is scrolled into view.
 * and on every scroll event.
 * @returns {Object{ animate: boolean, ref: React.RefObject<HTMLDivElement> }} The animate state and the ref to the component.
 */
const useAnimateOnScroll = (): {
  animate: boolean;
  ref: React.RefObject<HTMLDivElement>;
} => {
  const [animate, setAnimate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkIfInView = () => {
      if (ref.current) {
        const sectionPos = ref.current.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;

        if (sectionPos < windowHeight / 1.25) {
          setAnimate(true);
        }
      }
    };

    // Check immediately if the component is in view
    checkIfInView();

    // Add event listener for scroll events
    window.addEventListener('scroll', checkIfInView);

    // Cleanup function to remove the event listener
    return () => window.removeEventListener('scroll', checkIfInView);
  }, []);

  return { animate, ref };
};

export default useAnimateOnScroll;
