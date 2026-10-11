import DimensionsLayout from '@/app/(dimensions)/layout';
import { NotFoundView } from '#/dimensions/NotFoundView';

/**
 * Lives outside the (dimensions) route group, so it brings the shell's pieces itself: the group's layout is
 * reused as it is (i18n boot, the dimension provider and its first-paint script, the cover, the page
 * transitions, the shell's styles), and the page puts the bar and the footer round the void.
 */
export default function NotFound() {
  return (
    <DimensionsLayout>
      <NotFoundView />
    </DimensionsLayout>
  );
}
