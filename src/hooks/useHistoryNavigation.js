import { useEffect, useRef } from 'react';
import { getPathForView, getViewFromPath, normalizeViewId } from '../utils/viewRoutes';

const INITIAL_STATE = { view: 'DASHBOARD', layer: '' };

const buildHistoryKey = (state = INITIAL_STATE) =>
  `${normalizeViewId(state?.view || INITIAL_STATE.view)}|${state?.layer || ''}`;

export const useHistoryNavigation = ({ user, view, activeLayerKey = '', onPopNavigate }) => {
  const historyReadyRef = useRef(false);
  const skipNextPushRef = useRef(false);
  const lastStateKeyRef = useRef(buildHistoryKey(INITIAL_STATE));

  useEffect(() => {
    if (!user) {
      historyReadyRef.current = false;
      skipNextPushRef.current = false;
      lastStateKeyRef.current = buildHistoryKey(INITIAL_STATE);
      return;
    }

    const nextState = {
      view: normalizeViewId(view || getViewFromPath(window.location.pathname)),
      layer: activeLayerKey || ''
    };
    const nextStateKey = buildHistoryKey(nextState);
    const nextPath = getPathForView(nextState.view);

    if (!historyReadyRef.current) {
      window.history.replaceState(nextState, '', nextPath);
      historyReadyRef.current = true;
      lastStateKeyRef.current = nextStateKey;
      return;
    }

    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      lastStateKeyRef.current = nextStateKey;
      return;
    }

    if (nextStateKey === lastStateKeyRef.current) return;

    window.history.pushState(nextState, '', nextPath);
    lastStateKeyRef.current = nextStateKey;
  }, [activeLayerKey, user, view]);

  useEffect(() => {
    if (!user) return undefined;

    const handleBackButton = (event) => {
      skipNextPushRef.current = true;
      const nextState = {
        view: getViewFromPath(window.location.pathname),
        layer:
          event.state && typeof event.state === 'object'
            ? event.state.layer || ''
            : INITIAL_STATE.layer
      };
      lastStateKeyRef.current = buildHistoryKey(nextState);
      if (typeof onPopNavigate === 'function') {
        onPopNavigate(nextState);
      }
    };

    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [onPopNavigate, user]);
};
