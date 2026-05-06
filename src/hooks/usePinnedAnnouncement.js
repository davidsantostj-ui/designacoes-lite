import { useMemo } from 'react';

export const usePinnedAnnouncement = ({ announcements, dismissedPinned }) => {
  const pinnedAnnouncement = useMemo(() => {
    return announcements.find((a) => a.pinned === true) || null;
  }, [announcements]);

  const activePinnedAnnouncement = useMemo(() => {
    if (!pinnedAnnouncement) return null;
    if (dismissedPinned.includes(pinnedAnnouncement.id)) return null;
    return pinnedAnnouncement;
  }, [pinnedAnnouncement, dismissedPinned]);

  return { pinnedAnnouncement, activePinnedAnnouncement };
};
