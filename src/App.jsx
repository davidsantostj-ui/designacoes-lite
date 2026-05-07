import React, { Suspense, lazy, useState, useEffect, useMemo, useRef, useCallback } from 'react';

import { Bell, Search, Settings, Eye, RefreshCw } from 'lucide-react';
import Toast from './components/Toast';

import AppHeader from './components/AppHeader';
import AdminModals from './components/AdminModals';
import { EXTERNAL_SELECTION } from './components/MeetingsImportPreviewModal';

import UserAvatar from './components/UserAvatar';

import BottomNav from './components/BottomNav';
import SkeletonBlock from './components/SkeletonBlock';

import OfflineBanner from './components/OfflineBanner';

import AuthScreen from './components/AuthScreen';

import GlobalModals from './components/GlobalModals';

import DashboardView from './components/views/DashboardView';

import ErrorBoundary from './components/ErrorBoundary';

import ReloadPrompt from './components/ReloadPrompt';

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  deleteUser,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';

import {
  collection,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  setDoc,
  serverTimestamp,
  deleteDoc,
  arrayUnion,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter
} from 'firebase/firestore';

import { auth, db, storage } from './services/firebase';

import { createAppApi } from './services/appApi';
import { sanitizeText } from './utils/textUtils';
import { useMonthlyAssignments } from './hooks/useMonthlyAssignments';

import {
  ADMIN_UIDS,
  ASSIGNMENT_TYPES,
  MECHANICAL_ASSIGNMENT_TYPES,
  STATUS_TYPES
} from './constants/appConstants';

import {
  formatAssignmentLabel,
  normalizeAssignmentType,
  getDefaultAssignmentCapabilities,
  getUserAssignmentCapabilities,
  canUserTakeAssignment,
  isMechanicalAssignment
} from './utils/assignmentUtils';
import { buildAutoAssignmentPreview } from './utils/autoAssignmentUtils';

import { CACHE_KEYS, getInitialCache } from './utils/cacheUtils';
import {
  formatDatePt,
  getDateDaysAgo,
  getMonthStartIso,
  getMonthBounds,
  getMonthDates,
  formatIsoDateLocal,
  getFriendlyTime,
  isPastDate
} from './utils/dateUtils';
import {
  CSV_TEMPLATE,
  MECHANICAL_ASSIGNMENTS_CSV_TEMPLATE,
  MEETINGS_CSV_TEMPLATE
} from './utils/csvUtils';
import * as meetingImportUtils from './utils/meetingImportUtils.js';

import { buildIcsContent } from './utils/icsUtils';

import {
  buildWhatsAppLink,
  deriveNameFromEmail,
  fixMojibake,
  getUserDisplayName,
  normalizePersonName
} from './utils/textUtils';
import { mergeCollectionById, patchCollectionItems } from './utils/dataStateUtils';
import { getViewFromPath, normalizeViewId } from './utils/viewRoutes';
import { withRetry } from './utils/asyncUtils';
import { selectAssignmentsByDate, selectAssignmentCountsByMonthUser } from './utils/selectors';

import { useSoundSettings } from './hooks/useSoundSettings';
import { useHistoryNavigation } from './hooks/useHistoryNavigation';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useToasts } from './hooks/useToasts';
import { useCacheSync } from './hooks/useCacheSync';
import { useDismissedPins } from './hooks/useDismissedPins';
import { useSearchFilters } from './hooks/useSearchFilters';
import { useAdminTabs } from './hooks/useAdminTabs';
import { useNotificationsState } from './hooks/useNotificationsState';
import { useReportsAnalytics } from './hooks/useReportsAnalytics';
import { usePinnedAnnouncement } from './hooks/usePinnedAnnouncement';
import { useWhatsAppReminder } from './hooks/useWhatsAppReminder';
import { useCalendarState } from './hooks/useCalendarState';
import { useBrowserNotifications } from './hooks/useBrowserNotifications';
import { useAdminSession } from './hooks/useAdminSession';
import { useAssignmentsImportActions } from './hooks/useAssignmentsImportActions';
import { useDashboardSummary } from './hooks/useDashboardSummary';
import {
  EMPTY_MEETINGS_IMPORT_PREVIEW,
  useMeetingsImportActions
} from './hooks/useMeetingsImportActions';
import { useMaintenanceActions } from './hooks/useMaintenanceActions';
import { useMeetingsBatchActions } from './hooks/useMeetingsBatchActions';
import { useMonthlyCleanupEffect } from './hooks/useMonthlyCleanupEffect';
import { useAssignmentActions } from './hooks/actions/useAssignmentActions';
import { useAdminUserActions } from './hooks/actions/useAdminUserActions';
import { useAnnouncementActions } from './hooks/actions/useAnnouncementActions';
import { useNotificationActions } from './hooks/actions/useNotificationActions';
import { useTalkActions } from './hooks/actions/useTalkActions';
import { useAppDataLoader } from './hooks/useAppDataLoader';
import { useDatabaseCleanup } from './hooks/actions/useDatabaseCleanup';
import { useAuthGuard } from './hooks/useAuthGuard';

const ASSIGNMENTS_PAGE_SIZE = 200;
const NOTIFICATIONS_PAGE_SIZE = 15;
const SearchView = lazy(() => import('./components/views/SearchView'));
const NoticesView = lazy(() => import('./components/views/NoticesView'));
const AdminView = lazy(() => import('./components/views/AdminView'));
const SecondaryViews = lazy(() => import('./components/views/SecondaryViews'));
const GuestView = lazy(() => import('./features/guest/GuestView'));

const ensureAuth = async () => {
  if (!auth.currentUser) throw new Error('not-authenticated');

  return auth.currentUser;
};

const isAdminUid = (uid) => ADMIN_UIDS.includes(uid);
const {
  isMeetingSyncableAssignmentType,
  isMeetingJewelsDesignation,
  getMeetingSectionMetaFromValue,
  getMeetingDesignationOrder
} = meetingImportUtils;
const EMPTY_MEETINGS_RECLASSIFY_STATE = {
  open: false,
  batchId: '',
  batchLabel: '',
  rows: []
};

const api = createAppApi({ auth, db, storage, ensureAuth, withRetry });

const App = () => {
  const initialCache = getInitialCache();

  const [user, setUser] = useState(null);

  const [viewState, setViewState] = useState(() => getViewFromPath(window.location.pathname));
  const view = normalizeViewId(viewState);
  const setView = useCallback((nextView) => {
    setViewState(normalizeViewId(nextView));
  }, []);

  const { adminTab, setAdminTab } = useAdminTabs();
  const [loginState, setLoginState] = useState('SIGNIN');
  const [authReady, setAuthReady] = useState(false);

  const isOnline = useNetworkStatus();
  const [confirmState, setConfirmState] = useState({ open: false, loading: false });
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setConfirmState({ open: true, loading: false, ...opts, resolve });
    });
  }, []);

  const closeConfirm = useCallback(() => {
    if (mountedRef.current && confirmState?.resolve) confirmState.resolve(false);
    setConfirmState({ open: false, loading: false });
  }, [confirmState]);

  const acceptConfirm = useCallback(() => {
    if (!confirmState?.resolve) return;
    setConfirmState((prev) => ({ ...prev, loading: true }));
    if (mountedRef.current) confirmState.resolve(true);
    setConfirmState({ open: false, loading: false });
  }, [confirmState]);

  const actionLocks = useRef(new Set());

  const [alertTab, setAlertTab] = useState('NOTIFICATIONS');

  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const [isLoading, setIsLoading] = useState(false);

  const { toasts, addToast, removeToast } = useToasts();
  const { fetchMonthlyAssignments } = useMonthlyAssignments();
  const [dataError, setDataError] = useState(null);

  const [updateAvailable, setUpdateAvailable] = useState(false);

  const [availableVersion, setAvailableVersion] = useState('');

  const [currentVersion, setCurrentVersion] = useState('');

  const [updateInfoOpen, setUpdateInfoOpen] = useState(false);

  const [updateProgress, setUpdateProgress] = useState(0);

  const [isUpdatingApp, setIsUpdatingApp] = useState(false);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [isFixingMojibake, setIsFixingMojibake] = useState(false);
  const [filters, setFilters] = useState({
    name: '',

    date: '',

    type: '',

    status: '',

    hasFiltered: false
  });

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const [selectedAdminUser, setSelectedAdminUser] = useState(null);

  const [reassigningId, setReassigningId] = useState(null);

  const [isChangingPass, setIsChangingPass] = useState(false);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [assignmentsHasMore, setAssignmentsHasMore] = useState(true);
  const [notificationsHasMore, setNotificationsHasMore] = useState(true);
  const [isLoadingMoreAssignments, setIsLoadingMoreAssignments] = useState(false);
  const [isLoadingMoreNotifications, setIsLoadingMoreNotifications] = useState(false);

  const { dismissedPinned, setDismissedPinned } = useDismissedPins(user?.id);
  const [openSwapLogId, setOpenSwapLogId] = useState(null);

  const [assignForm, setAssignForm] = useState({
    date: '',
    userId: '',
    type: '',
    publishToMeetings: false
  });
  const [autoAssignForm, setAutoAssignForm] = useState(() => ({
    month: formatIsoDateLocal(new Date()).slice(0, 7),
    selectedDates: [],
    selectedTypes: [...MECHANICAL_ASSIGNMENT_TYPES],
    publishToMeetings: true
  }));
  const autoAssignDatesKey = useMemo(
    () => autoAssignForm.selectedDates.join('|'),
    [autoAssignForm.selectedDates]
  );
  const autoAssignTypesKey = useMemo(
    () => autoAssignForm.selectedTypes.join('|'),
    [autoAssignForm.selectedTypes]
  );
  const [autoAssignPreview, setAutoAssignPreview] = useState(null);
  const [isGeneratingAutoAssignments, setIsGeneratingAutoAssignments] = useState(false);
  const [isSavingAutoAssignments, setIsSavingAutoAssignments] = useState(false);

  const [assignmentConflict, setAssignmentConflict] = useState(null);

  const [meetingsImportPreview, setMeetingsImportPreview] = useState(EMPTY_MEETINGS_IMPORT_PREVIEW);
  const [meetingsReclassifyState, setMeetingsReclassifyState] = useState(
    EMPTY_MEETINGS_RECLASSIFY_STATE
  );
  const isRegisteringRef = useRef(false);

  const { originalAdmin, setOriginalAdmin, hasAdminAccess, isImpersonating, isRealAdminUser } =
    useAdminSession({
      authReady,
      authUid: auth.currentUser?.uid,
      user,
      isAdminUid
    });

  useDatabaseCleanup({ db, isRealAdmin: isRealAdminUser });

  const {
    soundEnabled,
    toggleSoundNotifications,
    playNotificationSound,
    dndEnabled,

    setDndEnabled,

    dndFrom,

    setDndFrom,

    dndTo,

    setDndTo,
    isDndNow
  } = useSoundSettings({ userId: user?.id, addToast });

  const runExclusive = useCallback(async (key, fn) => {
    if (actionLocks.current.has(key)) return false;

    actionLocks.current.add(key);

    try {
      await fn();

      return true;
    } finally {
      actionLocks.current.delete(key);
    }
  }, []);

  const { guardAuth, guardAdminAction } = useAuthGuard({
    addToast,
    isRealAdminUser,
    ensureAuth
  });

  const { data, setData, dataReady, handleRefreshData, safeLoadSections, loadForView } =
    useAppDataLoader({
      initialData: initialCache.data,
      initialReady: initialCache.ready,
      db,
      withRetry,
      getDateDaysAgo,
      getMonthStartIso,
      isImpersonating,
      user,
      isRealAdminUser,
      authReady,
      guardAuth,
      addToast
    });

  useCacheSync(data);

  const closeMeetingsImportPreview = useCallback(() => {
    setMeetingsImportPreview(EMPTY_MEETINGS_IMPORT_PREVIEW);
  }, []);

  const closeMeetingsReclassify = useCallback(() => {
    setMeetingsReclassifyState(EMPTY_MEETINGS_RECLASSIFY_STATE);
  }, []);

  const {
    handleOpenLatestMeetingsReclassify,
    handleSaveMeetingsReclassify,
    handleShiftDate,
    handleUndoMeetingsImport,
    handleWipeMeetingsData,
    isSavingMeetingsReclassify,
    isUndoingMeetingsImport,
    isWipingMeetingsData,
    isShiftingDates,
    latestMeetingsImportBatch,
    setLastMeetingsImportResult
  } = useMeetingsBatchActions({
    addToast,
    assignments: data.assignments,
    meetings: data.meetings,
    closeMeetingsImportPreview,
    closeMeetingsReclassify,
    confirm,
    db,
    guardAdminAction,
    meetingsReclassifyState,
    setData,
    setMeetingsReclassifyState
  });

  const handleUpdateMeetingsReclassifyRow = useCallback((rowId, field, value) => {
    setMeetingsReclassifyState((prev) => {
      const rows = (prev.rows || []).map((row) => {
        if (row.id !== rowId) return row;
        if (field === 'sectionKey') {
          const sectionMeta = getMeetingSectionMetaFromValue(value, row.designation);
          return {
            ...row,
            sectionKey: sectionMeta.key,
            sectionLabel: sectionMeta.label,
            sectionOrder: sectionMeta.order,
            designationOrder: getMeetingDesignationOrder(
              row.designation,
              sectionMeta.key,
              row.importLine
            )
          };
        }
        if (field === 'designationOrder') {
          return {
            ...row,
            designationOrder: isMeetingJewelsDesignation(row.designation)
              ? 2
              : Math.max(1, Number(value || 1))
          };
        }
        return row;
      });
      rows.sort((a, b) => {
        const byDate = String(a.date || '').localeCompare(String(b.date || ''));
        if (byDate !== 0) return byDate;
        const bySection = Number(a.sectionOrder || 99) - Number(b.sectionOrder || 99);
        if (bySection !== 0) return bySection;
        const byOrder = Number(a.designationOrder || 999) - Number(b.designationOrder || 999);
        if (byOrder !== 0) return byOrder;
        return Number(a.importLine || 999) - Number(b.importLine || 999);
      });
      return { ...prev, rows };
    });
  }, []);

  const assignments = data.assignments || [];

  const assignmentsByDate = useMemo(() => selectAssignmentsByDate(assignments), [assignments]);

  const assignmentCountsByMonthUser = useMemo(
    () => selectAssignmentCountsByMonthUser(assignments),
    [assignments]
  );

  const getUserAssignmentsOnDate = useCallback(
    (userId, dateStr) => {
      if (!userId || !dateStr) return [];

      return (assignmentsByDate[dateStr] || []).filter((a) => a.usuario_id === userId);
    },

    [assignmentsByDate]
  );

  const getUserMechanicalAssignmentsOnDate = useCallback(
    (userId, dateStr) =>
      getUserAssignmentsOnDate(userId, dateStr).filter((entry) =>
        isMechanicalAssignment(entry?.tipo_designacao)
      ),
    [getUserAssignmentsOnDate]
  );

  const getUserSpiritualAssignmentsOnDate = useCallback(
    (userId, dateStr) =>
      getUserAssignmentsOnDate(userId, dateStr).filter(
        (entry) => !isMechanicalAssignment(entry?.tipo_designacao)
      ),
    [getUserAssignmentsOnDate]
  );

  const selectedUserAssignments = useMemo(() => {
    return getUserAssignmentsOnDate(assignForm.userId, assignForm.date);
  }, [assignForm.userId, assignForm.date, getUserAssignmentsOnDate]);

  const selectedMonthKey = assignForm.date ? assignForm.date.slice(0, 7) : '';

  const monthCountsForSelected = useMemo(
    () => assignmentCountsByMonthUser[selectedMonthKey] || {},

    [assignmentCountsByMonthUser, selectedMonthKey]
  );

  const freeUsersForSelectedDate = useMemo(() => {
    if (!assignForm.date) return [];
    const blockedMechanicalUsers = isMechanicalAssignment(assignForm.type)
      ? new Set(
          (assignmentsByDate[assignForm.date] || [])
            .filter((entry) => isMechanicalAssignment(entry?.tipo_designacao))
            .map((entry) => entry.usuario_id)
        )
      : new Set();

    return (data.users || [])

      .filter((u) => u.approved && !blockedMechanicalUsers.has(u.id))

      .filter((u) => !assignForm.type || canUserTakeAssignment(u, assignForm.type))

      .sort((a, b) => {
        const ca = monthCountsForSelected[a.id] || 0;

        const cb = monthCountsForSelected[b.id] || 0;

        if (ca !== cb) return ca - cb;

        return getUserDisplayName(a).localeCompare(getUserDisplayName(b));
      });
  }, [assignForm.date, assignForm.type, assignmentsByDate, data.users, monthCountsForSelected]);

  useEffect(() => {
    if (!assignForm.userId || !assignForm.type) return;

    const selectedUser = (data.users || []).find((entry) => entry.id === assignForm.userId);

    if (selectedUser && canUserTakeAssignment(selectedUser, assignForm.type)) return;

    setAssignForm((prev) => (prev.userId === assignForm.userId ? { ...prev, userId: '' } : prev));
  }, [assignForm.type, assignForm.userId, data.users]);

  useEffect(() => {
    setAutoAssignPreview(null);
  }, [autoAssignForm.month, autoAssignDatesKey, autoAssignTypesKey]);

  const conflictDate = assignmentConflict?.date || '';
  const conflictMonthCounts = useMemo(() => {
    if (!conflictDate) return {};
    const key = conflictDate.slice(0, 7);
    return assignmentCountsByMonthUser[key] || {};
  }, [assignmentCountsByMonthUser, conflictDate]);

  const freeUsersForConflictDate = useMemo(() => {
    if (!conflictDate) return [];
    const blockedMechanicalUsers = isMechanicalAssignment(assignmentConflict?.type)
      ? new Set(
          (assignmentsByDate[conflictDate] || [])
            .filter((entry) => isMechanicalAssignment(entry?.tipo_designacao))
            .map((entry) => entry.usuario_id)
        )
      : new Set();
    return (data.users || [])
      .filter((u) => u.approved && !blockedMechanicalUsers.has(u.id))
      .filter((u) => !assignmentConflict?.type || canUserTakeAssignment(u, assignmentConflict.type))
      .sort((a, b) => {
        const ca = conflictMonthCounts[a.id] || 0;
        const cb = conflictMonthCounts[b.id] || 0;
        if (ca !== cb) return ca - cb;
        return getUserDisplayName(a).localeCompare(getUserDisplayName(b));
      });
  }, [assignmentConflict?.type, assignmentsByDate, conflictDate, conflictMonthCounts, data.users]);

  const {
    handleCreateAssignment,
    handleAssignAnyway,
    handlePickAlternativeUser,
    handlePickNextAvailable,
    handleDeleteAssignment,
    handleUpdateAssignment,
    handleReassign,
    commitAssignmentsImport,
    commitMeetingsImport,
    handleAccept,
    handleSwapRequest,
    handleCancelSwap,
    handleAcceptSwap
  } = useAssignmentActions({
    db,
    user,
    data,
    setData,
    addToast,
    confirm,
    guardAuth,
    guardManageAssignments: guardAdminAction,
    canUserTakeAssignment,
    assignForm,
    setAssignForm,
    assignmentConflict,
    setAssignmentConflict,
    getUserAssignmentsOnDate,
    getUserMechanicalAssignmentsOnDate,
    getUserSpiritualAssignmentsOnDate,
    getUserDisplayName,
    freeUsersForSelectedDate,
    setReassigningId
  });

  const { handleCreateTalk, handleUpdateTalk, handleDeleteTalk } = useTalkActions({
    db,
    user,
    data,
    setData,
    addToast,
    confirm,
    guardManageTalks: guardAdminAction,
    canUserTakeAssignment,
    formatDatePt
  });

  const {
    handleUpdateApproval,
    handleApproveAll,
    handleApproveByDomain,
    handleImpersonate,
    stopImpersonating,
    handleToggleAdminRole,
    handleDeleteUser,
    handleAdminUpdateUserName,
    handleUpdateUserCapabilities,
    handleSendBroadcast,
    handleSendRecoveryEmail,
    handleTransferAssignments
  } = useAdminUserActions({
    auth,
    db,
    user,
    data,
    setData,
    setUser,
    originalAdmin,
    setOriginalAdmin,
    setView,
    addToast,
    confirm,
    assignmentTypes: ASSIGNMENT_TYPES
  });

  const {
    cleanupAssignments,
    cleanupNotifications,
    cleanupMonthLabel,
    handleCleanupAssignments,
    handleCleanupNotifications,
    handleWipeAssignments,
    isCleaningAssignments,
    isCleaningNotifications,
    isWipingAssignments
  } = useMaintenanceActions({
    db,
    addToast,
    confirm,
    guardAuth,
    isRealAdminUser,
    runExclusive,
    setData,
    getMonthStartIso
  });

  const handleLoadMoreAssignments = useCallback(async () => {
    if (isLoadingMoreAssignments || !assignmentsHasMore) return;
    if (!(await guardAuth())) return;
    const items = Array.isArray(data.assignments) ? data.assignments : [];
    if (items.length === 0) {
      setAssignmentsHasMore(false);
      return;
    }
    setIsLoadingMoreAssignments(true);
    try {
      const cutoffIso = getDateDaysAgo(0);
      const visibleItems = items.filter((entry) => entry?.date >= cutoffIso);
      if (visibleItems.length === 0) {
        setAssignmentsHasMore(false);
        return;
      }
      const last = visibleItems[visibleItems.length - 1];
      const lastSnap = await getDoc(doc(db, 'assignments', last.id));
      if (!lastSnap.exists()) {
        setAssignmentsHasMore(false);
        return;
      }
      const snap = await getDocs(
        query(
          collection(db, 'assignments'),
          where('date', '>=', cutoffIso),
          orderBy('date', 'desc'),
          startAfter(lastSnap),
          limit(ASSIGNMENTS_PAGE_SIZE)
        )
      );
      const nextItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (nextItems.length < ASSIGNMENTS_PAGE_SIZE) setAssignmentsHasMore(false);
      if (nextItems.length > 0) {
        setData((prev) =>
          mergeCollectionById(prev, 'assignments', nextItems, {
            sortFn: (a, b) => {
              if (a.date === b.date) return a.id > b.id ? -1 : 1;
              return a.date > b.date ? -1 : 1;
            }
          })
        );
      }
    } catch (e) {
      addToast('Erro ao carregar mais designações.', 'error');
    } finally {
      setIsLoadingMoreAssignments(false);
    }
  }, [
    addToast,
    assignmentsHasMore,
    data.assignments,
    guardAuth,
    isLoadingMoreAssignments,
    setData
  ]);

  const handleLoadMoreNotifications = useCallback(async () => {
    if (isLoadingMoreNotifications || !notificationsHasMore) return;
    if (!(await guardAuth())) return;
    const items = Array.isArray(data.notifications) ? data.notifications : [];
    if (items.length === 0) {
      setNotificationsHasMore(false);
      return;
    }
    setIsLoadingMoreNotifications(true);
    try {
      const last = items[items.length - 1];
      const lastSnap = await getDoc(doc(db, 'notifications', last.id));
      if (!lastSnap.exists()) {
        setNotificationsHasMore(false);
        return;
      }
      const snap = await getDocs(
        query(
          collection(db, 'notifications'),
          orderBy('created_at', 'desc'),
          startAfter(lastSnap),
          limit(NOTIFICATIONS_PAGE_SIZE)
        )
      );
      const nextItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (nextItems.length < NOTIFICATIONS_PAGE_SIZE) setNotificationsHasMore(false);
      if (nextItems.length > 0) {
        const toMillis = (value) => {
          if (!value) return 0;
          if (typeof value === 'number') return value;
          if (typeof value === 'string') {
            const parsed = Date.parse(value);
            return Number.isNaN(parsed) ? 0 : parsed;
          }
          if (typeof value.toMillis === 'function') return value.toMillis();
          if (typeof value.seconds === 'number') return value.seconds * 1000;
          return 0;
        };
        setData((prev) =>
          mergeCollectionById(prev, 'notifications', nextItems, {
            sortFn: (a, b) => toMillis(b.created_at) - toMillis(a.created_at)
          })
        );
      }
    } catch (e) {
      addToast('Erro ao carregar mais notificações.', 'error');
    } finally {
      setIsLoadingMoreNotifications(false);
    }
  }, [
    addToast,
    data.notifications,
    guardAuth,
    isLoadingMoreNotifications,
    notificationsHasMore,
    setData
  ]);

  const downloadCsv = useCallback((filename, rows) => {
    const content = rows
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    if (!updateInfoOpen || !isUpdatingApp) return undefined;

    setUpdateProgress(10);

    const tick = () => {
      setUpdateProgress((prev) => {
        if (prev >= 90) return prev;

        return Math.min(90, prev + Math.max(2, Math.round(Math.random() * 6)));
      });
    };

    const id = window.setInterval(tick, 450);

    return () => window.clearInterval(id);
  }, [updateInfoOpen, isUpdatingApp]);

  const renderSkeletonList = useCallback((count = 3, className = 'h-16 w-full') => {
    return Array.from({ length: count }).map((_, idx) => (
      <SkeletonBlock key={`sk-${idx}`} className={className} />
    ));
  }, []);

  useEffect(() => {
    let alive = true;

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!alive) return;

      if (!u) {
        setUser(null);

        setAuthReady(true);

        return;
      }

      setAuthReady(true);

      // Convidado anônimo: setar user minimal e parar.
      // NÃO criar documento em users/, NÃO disparar data loaders.
      if (u.isAnonymous) {
        setUser({ id: u.uid, isAnonymous: true });
        return;
      }

      if (isRegisteringRef.current) return;

      try {
        const refDoc = doc(db, 'users', u.uid);

        const snap = await getDoc(refDoc);

        if (!snap.exists()) {
          const display = u.displayName || '';

          const derived = display
            ? {
                name: display.split(' ')[0] || 'Usuário',

                surname: display.split(' ').slice(1).join(' ')
              }
            : deriveNameFromEmail(u.email || '');

          const name = derived.name || 'Usuário';

          const surname = derived.surname || '';

          const payload = {
            name,

            surname,

            phone: '',

            email: u.email || '',

            approved: isAdminUid(u.uid),

            isAdmin: isAdminUid(u.uid),

            assignmentCapabilities: getDefaultAssignmentCapabilities(),

            created_at: serverTimestamp(),

            last_active: serverTimestamp()
          };

          try {
            await setDoc(refDoc, payload, { merge: true });
            setUser({ id: u.uid, ...payload });
            if (!payload.isAdmin && !isRegisteringRef.current) {
              await signOut(auth);
              addToast('Aguardando aprovação do Admin.', 'info');
            }
            return;
          } catch (error) {
            addToast('Erro ao criar conta. Tente novamente.', 'error');
            return;
          }
        }

        const dataUser = snap.data() || {};

        const merged = {
          id: u.uid,

          ...dataUser,

          email: u.email || dataUser.email || '',

          isAdmin: isAdminUid(u.uid) || dataUser.isAdmin
        };

        if (!merged.name || !merged.surname) {
          const derived = u.displayName
            ? {
                name: u.displayName.split(' ')[0] || '',

                surname: u.displayName.split(' ').slice(1).join(' ')
              }
            : deriveNameFromEmail(merged.email || '');

          const nextName = merged.name || derived.name;

          const nextSurname = merged.surname || derived.surname;

          if (nextName || nextSurname) {
            try {
              await setDoc(
                doc(db, 'users', u.uid),
                { name: nextName, surname: nextSurname },
                { merge: true }
              );
              merged.name = nextName;
              merged.surname = nextSurname;
            } catch (error) {
              addToast('Erro ao atualizar nome.', 'error');
            }
          }
        }

        if (isAdminUid(u.uid)) {
          if (merged.approved !== true || merged.isAdmin !== true) {
            try {
              await setDoc(
                doc(db, 'users', u.uid),
                { approved: true, isAdmin: true },
                { merge: true }
              );
              merged.approved = true;
              merged.isAdmin = true;
            } catch (error) {
              addToast('Erro ao configurar permissões de admin.', 'error');
            }
          }
        }

        if (!merged.isAdmin && merged.approved === false && !isRegisteringRef.current) {
          await signOut(auth);

          addToast('Aguardando aprovação do Admin.', 'info');

          return;
        }

        setUser(merged);
      } catch (e) {
        addToast('Erro ao carregar perfil.', 'error');
      }
    });

    return () => {
      alive = false;

      unsub();
    };
  }, [addToast]);

  const handleForceUpdate = useCallback(async ({ hard } = {}) => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      await reg.update();
      if (hard && reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch (err) {}
  }, []);

  const clearClientCaches = useCallback(async () => {
    try {
      Object.values(CACHE_KEYS).forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      // ignore
    }
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleManualUpdate = useCallback(
    async ({ silent } = {}) => {
      if (isUpdatingApp) return;
      setIsUpdatingApp(true);
      if (!silent) {
        setUpdateInfoOpen(true);
        setUpdateProgress(15);
      }
      try {
        await handleForceUpdate({ hard: true });
        await clearClientCaches();
      } finally {
        setUpdateProgress(100);
        const delay = silent ? 150 : 300;
        window.setTimeout(() => {
          setIsUpdatingApp(false);
          if (!silent) setUpdateInfoOpen(false);
          window.location.reload();
        }, delay);
      }
    },
    [clearClientCaches, handleForceUpdate, isUpdatingApp]
  );

  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      if (isLoading) return;
      const form = e.target;
      const email = String(form.email?.value || '').trim();
      const password = String(form.password?.value || '');
      if (!email || !password) return;
      setIsLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        setLoginState('SIGNIN');
      } catch (err) {
        addToast('E-mail ou senha inválidos.', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [addToast, isLoading]
  );

  const handlePasswordReset = useCallback(
    async (e) => {
      e.preventDefault();
      if (isLoading) return;
      const form = e.target;
      const email = String(form.email?.value || '').trim();
      if (!email) return;
      setIsLoading(true);
      try {
        await sendPasswordResetEmail(auth, email);
        addToast('Link enviado para seu e-mail.', 'success');
        setLoginState('SIGNIN');
      } catch (err) {
        addToast('Erro ao enviar link.', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [addToast, isLoading]
  );

  const handleRegisterSelf = useCallback(
    async (e) => {
      e.preventDefault();
      if (isLoading) return;
      const form = e.target;
      const name = String(form.name?.value || '').trim();
      const surname = String(form.surname?.value || '').trim();
      const phone = String(form.phone?.value || '').trim();
      const email = String(form.email?.value || '').trim();
      const password = String(form.password?.value || '');
      const password2 = String(form.password2?.value || '');
      if (!name || !surname || !phone || !email || !password) return;
      if (password !== password2) {
        addToast('As senhas não conferem.', 'error');
        return;
      }
      setIsLoading(true);
      isRegisteringRef.current = true;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = `${name} ${surname}`.trim();
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName });
        }
        const payload = {
          name,
          surname,
          phone,
          email,
          approved: isAdminUid(cred.user.uid),
          isAdmin: isAdminUid(cred.user.uid),
          assignmentCapabilities: getDefaultAssignmentCapabilities(),
          created_at: serverTimestamp(),
          last_active: serverTimestamp()
        };
        await setDoc(doc(db, 'users', cred.user.uid), payload, { merge: true });
        if (!payload.isAdmin) {
          await signOut(auth);
          addToast('Cadastro enviado. Aguarde aprovação do Admin.', 'info');
          setLoginState('SIGNIN');
        } else {
          setUser({ id: cred.user.uid, ...payload });
        }
      } catch (err) {
        addToast('Erro ao criar cadastro.', 'error');
      } finally {
        isRegisteringRef.current = false;
        setIsLoading(false);
      }
    },
    [addToast, isLoading]
  );

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
    } finally {
      setOriginalAdmin(null);
      setUser(null);
    }
  }, [setOriginalAdmin]);

  const handleGuestLogin = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (err) {
      addToast('Erro ao entrar como convidado.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, isLoading]);

  const handleGuestLogout = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser?.isAnonymous) {
        await deleteUser(currentUser);
      } else {
        await signOut(auth);
      }
    } catch (err) {
      // Se deleteUser falhar (token expirado), tenta signOut
      try { await signOut(auth); } catch {}
    } finally {
      setUser(null);
    }
  }, []);

  const handleChangePassword = useCallback(
    async (e) => {
      e.preventDefault();
      const form = e.target;
      const current = String(form.current?.value || '');
      const n1 = String(form.n1?.value || '');
      const n2 = String(form.n2?.value || '');
      if (!current || !n1 || !n2) return;
      if (n1 !== n2) {
        addToast('As senhas não conferem.', 'error');
        return;
      }
      try {
        const currentUser = auth.currentUser;
        if (!currentUser?.email) throw new Error('missing-user');
        const cred = EmailAuthProvider.credential(currentUser.email, current);
        await reauthenticateWithCredential(currentUser, cred);
        await updatePassword(currentUser, n1);
        addToast('Senha atualizada.', 'success');
        form.reset();
        setIsChangingPass(false);
      } catch (err) {
        addToast('Erro ao atualizar senha.', 'error');
      }
    },
    [addToast]
  );

  const handleChangeDisplayName = useCallback(
    async (e) => {
      e.preventDefault();
      const form = e.target;
      const fullName = String(form.fullName?.value || '').trim();
      if (!fullName || !user?.id) return;
      const parts = fullName.split(/\s+/).filter(Boolean);
      const name = parts.shift() || '';
      const surname = parts.join(' ');
      try {
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: fullName });
        }
        await updateDoc(doc(db, 'users', user.id), { name, surname });
        setUser((prev) => (prev ? { ...prev, name, surname } : prev));
        addToast('Nome atualizado.', 'success');
      } catch (err) {
        addToast('Erro ao atualizar nome.', 'error');
      }
    },
    [addToast, user?.id]
  );

  const handleUpdatePreferences = useCallback(
    async (e) => {
      e.preventDefault();
      if (!user?.id) return;
      const form = e.target;
      const payload = {
        preferredLanguage: form.language?.value || 'pt-BR',
        hidePhone: !!form.hidePhone?.checked,
        availabilityFrom: form.availFrom?.value || '08:00',
        availabilityTo: form.availTo?.value || '20:00',
        availabilityNote: sanitizeText(form.availNote?.value || '', 500)
      };
      try {
        await updateDoc(doc(db, 'users', user.id), payload);
        setUser((prev) => (prev ? { ...prev, ...payload } : prev));
        addToast('Preferências atualizadas.', 'success');
      } catch (err) {
        addToast('Erro ao atualizar preferências.', 'error');
      }
    },
    [addToast, user?.id]
  );

  const handleDownloadAssignmentsTemplate = useCallback(() => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_designacoes.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    addToast('Template CSV baixado.', 'success');
  }, [addToast]);

  const handleDownloadMechanicalAssignmentsTemplate = useCallback(() => {
    const blob = new Blob([MECHANICAL_ASSIGNMENTS_CSV_TEMPLATE], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_designacoes_mecanicas.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    addToast('Modelo CSV de designações mecânicas baixado.', 'success');
  }, [addToast]);

  const handleDownloadMeetingsTemplate = useCallback(() => {
    const blob = new Blob([MEETINGS_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_reunioes.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    addToast('Modelo CSV de Reuniões baixado.', 'success');
  }, [addToast]);

  const buildAssignmentPayload = useCallback(
    (date, userId, type, status, options = {}) => {
      const payload = {
        date,
        usuario_id: userId,
        tipo_designacao: type,
        status: status || 'pendente',
        created_at: serverTimestamp(),
        created_by: user?.id || ''
      };
      if (options.showInMeetings === true && isMeetingSyncableAssignmentType(type)) {
        payload.show_in_meetings = true;
      }
      if (options.participantName) {
        payload.participant_name = options.participantName;
        payload.participant_name_norm = normalizePersonName(options.participantName);
      }
      return payload;
    },
    [user?.id, normalizePersonName]
  );

  const {
    handleConfirmMeetingsImport,
    handleImportMeetingsFile,
    handleSelectMeetingsPreviewUser,
    handleUpdateMeetingsPreviewAssignmentType,
    handleUpdateMeetingsPreviewOrder,
    handleUpdateMeetingsPreviewSection,
    isImportingMeetings
  } = useMeetingsImportActions({
    addToast,
    assignments: data.assignments,
    assignmentTypes: ASSIGNMENT_TYPES,
    buildAssignmentPayload,
    canUserTakeAssignment,
    closeMeetingsImportPreview,
    commitMeetingsImport,
    db,
    externalSelectionValue: EXTERNAL_SELECTION,
    getUserDisplayName,
    guardAdminAction,
    meetings: data.meetings,
    meetingsImportPreview,
    setMeetingsImportPreview,
    setLastMeetingsImportResult,
    userId: user?.id,
    users: data.users
  });

  const {
    assignmentsImportPreview,
    closeAssignmentsImportPreview,
    closeCsvResolve,
    csvResolveState,
    handleConfirmAssignmentsImport,
    handleConfirmCsvResolve,
    handleImportAssignmentsFile,
    handleToggleAssignmentsImportShowInMeetings,
    isImportingAssignments
  } = useAssignmentsImportActions({
    addToast,
    assignments: data.assignments,
    buildAssignmentPayload,
    commitAssignmentsImport,
    db,
    guardAdminAction,
    users: data.users
  });

  const activeLayerKey = useMemo(() => {
    if (meetingsReclassifyState?.open) return 'MEETINGS_RECLASSIFY';
    if (meetingsImportPreview?.open) return 'MEETINGS_IMPORT_PREVIEW';
    if (assignmentsImportPreview?.open) return 'ASSIGNMENTS_IMPORT_PREVIEW';
    if (csvResolveState?.open) return 'CSV_RESOLVE';
    if (isChangingPass) return 'ACCOUNT';
    if (isHelpOpen) return 'HELP';
    if (isAboutOpen) return 'ABOUT';
    if (isUserMenuOpen) return 'USER_MENU';
    return '';
  }, [
    assignmentsImportPreview?.open,
    csvResolveState?.open,
    isAboutOpen,
    isChangingPass,
    isHelpOpen,
    isUserMenuOpen,
    meetingsImportPreview?.open,
    meetingsReclassifyState?.open
  ]);

  const syncNavigationStateFromHistory = useCallback(
    (nextState = {}) => {
      const targetView = normalizeViewId(
        nextState?.view || getViewFromPath(window.location.pathname)
      );
      const targetLayer = nextState?.layer || '';

      if (targetLayer !== 'MEETINGS_RECLASSIFY') closeMeetingsReclassify();
      if (targetLayer !== 'MEETINGS_IMPORT_PREVIEW') closeMeetingsImportPreview();
      if (targetLayer !== 'ASSIGNMENTS_IMPORT_PREVIEW') closeAssignmentsImportPreview();
      if (targetLayer !== 'CSV_RESOLVE') closeCsvResolve();
      if (targetLayer !== 'ACCOUNT') setIsChangingPass(false);
      if (targetLayer !== 'HELP') setIsHelpOpen(false);
      if (targetLayer !== 'ABOUT') setIsAboutOpen(false);
      if (targetLayer !== 'USER_MENU') setIsUserMenuOpen(false);

      setView(targetView);
    },
    [
      closeAssignmentsImportPreview,
      closeCsvResolve,
      closeMeetingsImportPreview,
      closeMeetingsReclassify,
      setView
    ]
  );

  useHistoryNavigation({
    user,
    view,
    activeLayerKey,
    onPopNavigate: syncNavigationStateFromHistory
  });

  const navigateBack = useCallback(
    (fallbackView = 'DASHBOARD') => {
      const currentState = window.history.state || {};
      const stateMatchesCurrent =
        (currentState?.view || 'DASHBOARD') === (view || 'DASHBOARD') &&
        (currentState?.layer || '') === (activeLayerKey || '');

      if (user && window.history.length > 1 && stateMatchesCurrent) {
        window.history.back();
        return;
      }

      syncNavigationStateFromHistory({ view: fallbackView, layer: '' });
    },
    [activeLayerKey, syncNavigationStateFromHistory, user, view]
  );

  const dismissCsvResolve = useCallback(() => {
    if (csvResolveState?.open) {
      navigateBack('ADMIN');
      return;
    }
    closeCsvResolve();
  }, [closeCsvResolve, csvResolveState?.open, navigateBack]);

  const dismissAssignmentsImportPreview = useCallback(() => {
    if (assignmentsImportPreview?.open) {
      navigateBack('ADMIN');
      return;
    }
    closeAssignmentsImportPreview();
  }, [assignmentsImportPreview?.open, closeAssignmentsImportPreview, navigateBack]);

  const dismissMeetingsImportPreview = useCallback(() => {
    if (meetingsImportPreview?.open) {
      navigateBack('ADMIN');
      return;
    }
    closeMeetingsImportPreview();
  }, [closeMeetingsImportPreview, meetingsImportPreview?.open, navigateBack]);

  const dismissMeetingsReclassify = useCallback(() => {
    if (meetingsReclassifyState?.open) {
      navigateBack('ADMIN');
      return;
    }
    closeMeetingsReclassify();
  }, [closeMeetingsReclassify, meetingsReclassifyState?.open, navigateBack]);

  const dismissUserMenu = useCallback(() => {
    if (isUserMenuOpen) {
      navigateBack(view || 'DASHBOARD');
      return;
    }
    setIsUserMenuOpen(false);
  }, [isUserMenuOpen, navigateBack, view]);

  const dismissAccountModal = useCallback(() => {
    if (isChangingPass) {
      navigateBack(view || 'DASHBOARD');
      return;
    }
    setIsChangingPass(false);
  }, [isChangingPass, navigateBack, view]);

  const dismissHelpModal = useCallback(() => {
    if (isHelpOpen) {
      navigateBack(view || 'DASHBOARD');
      return;
    }
    setIsHelpOpen(false);
  }, [isHelpOpen, navigateBack, view]);

  const dismissAboutModal = useCallback(() => {
    if (isAboutOpen) {
      navigateBack(view || 'DASHBOARD');
      return;
    }
    setIsAboutOpen(false);
  }, [isAboutOpen, navigateBack, view]);

  const loadAssignmentsForMonth = useCallback(
    async (monthValue) => {
      const { start, end } = getMonthBounds(monthValue);
      if (!start || !end) return [];
      try {
        return await fetchMonthlyAssignments(start, end);
      } catch (err) {
        addToast(
          'Não foi possível consultar o mês inteiro no banco. Vou usar os dados já carregados.',
          'warn'
        );
        return (data.assignments || []).filter(
          (entry) => entry?.date >= start && entry?.date <= end
        );
      }
    },
    [addToast, data.assignments, fetchMonthlyAssignments]
  );

  const handleGenerateAutoAssignmentsPreview = useCallback(async () => {
    if (!(await guardAdminAction('Apenas administradores podem gerar designações automáticas.'))) {
      return;
    }
    if (!autoAssignForm.month) {
      addToast('Selecione um mês.', 'warn');
      return;
    }
    if (autoAssignForm.selectedDates.length === 0) {
      addToast('Selecione pelo menos uma data.', 'warn');
      return;
    }
    if (autoAssignForm.selectedTypes.length === 0) {
      addToast('Selecione pelo menos uma função.', 'warn');
      return;
    }

    const validMonthDates = new Set(getMonthDates(autoAssignForm.month));
    const selectedDates = autoAssignForm.selectedDates
      .filter((date) => validMonthDates.has(date))
      .sort((a, b) => a.localeCompare(b));

    if (selectedDates.length === 0) {
      addToast('As datas selecionadas não pertencem ao mês informado.', 'warn');
      return;
    }

    setIsGeneratingAutoAssignments(true);
    try {
      const existingAssignments = await loadAssignmentsForMonth(autoAssignForm.month);
      const preview = buildAutoAssignmentPreview({
        users: data.users || [],
        assignmentTypes: autoAssignForm.selectedTypes,
        dates: selectedDates,
        existingAssignments
      });

      setAutoAssignPreview({
        ...preview,
        month: autoAssignForm.month,
        publishToMeetings: autoAssignForm.publishToMeetings === true,
        saved: false
      });

      if (preview.suggestedAssignments.length === 0 && preview.unresolvedAssignments.length === 0) {
        addToast('Todas as funcoes selecionadas ja estavam preenchidas.', 'info');
        return;
      }

      addToast(
        `Prévia gerada com ${preview.suggestedAssignments.length} nova(s) designação(ões).`,
        'success'
      );
      if (preview.unresolvedAssignments.length > 0) {
        addToast(
          `Pendências encontradas: ${preview.unresolvedAssignments.length}. Revise antes de salvar.`,
          'warn'
        );
      }
    } catch (err) {
      addToast('Erro ao gerar a prévia automática.', 'error');
    } finally {
      setIsGeneratingAutoAssignments(false);
    }
  }, [addToast, autoAssignForm, data.users, guardAdminAction, loadAssignmentsForMonth]);

  const handleSaveAutoAssignments = useCallback(async () => {
    if (!autoAssignPreview || autoAssignPreview.suggestedAssignments.length === 0) {
      addToast('Não há designações automáticas prontas para salvar.', 'info');
      return;
    }
    if (autoAssignPreview.saved) {
      addToast('Essa prévia já foi salva.', 'info');
      return;
    }
    if (!(await guardAdminAction('Apenas administradores podem salvar designações automáticas.'))) {
      return;
    }

    const confirmed = await confirm({
      title: 'Salvar designações automáticas',
      message: `Isso criará ${autoAssignPreview.suggestedAssignments.length} designação(ões) pendente(s).`,
      confirmText: 'Salvar'
    });
    if (!confirmed) return;

    setIsSavingAutoAssignments(true);
    try {
      const freshAssignments = await loadAssignmentsForMonth(autoAssignPreview.month);
      const usedDateTypeKeys = new Set(
        freshAssignments.map(
          (entry) => `${entry.date}|${normalizeAssignmentType(entry.tipo_designacao || '')}`
        )
      );
      const usedMechanicalUserKeys = new Set(
        freshAssignments
          .filter((entry) => isMechanicalAssignment(entry?.tipo_designacao))
          .map((entry) => `${entry.date}|${entry.usuario_id}`)
      );
      const plannedTypeKeys = new Set();
      const plannedMechanicalUserKeys = new Set();
      const safeAssignments = [];
      let skipped = 0;

      autoAssignPreview.suggestedAssignments.forEach((entry) => {
        const dateTypeKey = `${entry.date}|${entry.tipo_designacao}`;
        const dateUserKey = `${entry.date}|${entry.usuario_id}`;
        if (
          usedDateTypeKeys.has(dateTypeKey) ||
          (isMechanicalAssignment(entry.tipo_designacao) &&
            usedMechanicalUserKeys.has(dateUserKey)) ||
          plannedTypeKeys.has(dateTypeKey) ||
          (isMechanicalAssignment(entry.tipo_designacao) &&
            plannedMechanicalUserKeys.has(dateUserKey))
        ) {
          skipped += 1;
          return;
        }
        safeAssignments.push(
          buildAssignmentPayload(
            entry.date,
            entry.usuario_id,
            entry.tipo_designacao,
            entry.status,
            {
              showInMeetings:
                autoAssignPreview.publishToMeetings === true &&
                isMeetingSyncableAssignmentType(entry.tipo_designacao)
            }
          )
        );
        plannedTypeKeys.add(dateTypeKey);
        if (isMechanicalAssignment(entry.tipo_designacao)) {
          plannedMechanicalUserKeys.add(dateUserKey);
        }
      });

      if (safeAssignments.length === 0) {
        addToast('A prévia ficou desatualizada. Gere novamente antes de salvar.', 'warn');
        return;
      }

      const perUserCounts = new Map();
      safeAssignments.forEach((entry) => {
        perUserCounts.set(entry.usuario_id, (perUserCounts.get(entry.usuario_id) || 0) + 1);
      });

      await commitAssignmentsImport(safeAssignments, perUserCounts);
      setAutoAssignPreview((prev) =>
        prev
          ? {
              ...prev,
              suggestedAssignments: safeAssignments,
              saved: true
            }
          : prev
      );
      addToast(`Designações automáticas salvas: ${safeAssignments.length}.`, 'success');
      if (autoAssignPreview.publishToMeetings) {
        const meetingsCount = safeAssignments.filter(
          (entry) => entry.show_in_meetings === true
        ).length;
        if (meetingsCount > 0) {
          addToast(
            `${meetingsCount} designacao(oes) tambem aparecerao em Reunioes.`,
            'info'
          );
        }
      }
      if (skipped > 0) {
        addToast(`Itens ignorados por conflito recente: ${skipped}.`, 'info');
      }
    } catch (err) {
      addToast('Erro ao salvar designações automáticas.', 'error');
    } finally {
      setIsSavingAutoAssignments(false);
    }
  }, [
    addToast,
    autoAssignPreview,
    buildAssignmentPayload,
    commitAssignmentsImport,
    confirm,
    guardAdminAction,
    loadAssignmentsForMonth
  ]);

  const handleExportBackup = useCallback(async () => {
    if (!(await guardAuth())) return;
    try {
      const payload = await api.exportData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_minhas_designacoes_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      addToast('Backup exportado.', 'success');
    } catch (err) {
      addToast('Erro ao exportar backup.', 'error');
    }
  }, [addToast, guardAuth]);

  const handleImportBackup = useCallback(
    async (file) => {
      if (!file) return;
      if (!(await guardAuth())) return;
      const confirmed = await confirm({
        title: 'Importar backup',
        message: 'Isso pode sobrescrever dados existentes. Deseja continuar?',
        confirmText: 'Importar'
      });
      if (!confirmed) return;
      try {
        const text = await file.text();
        const payload = JSON.parse(text);
        await api.importData(payload);
        await handleRefreshData({ silent: true });
        addToast('Backup importado.', 'success');
      } catch (err) {
        addToast('Erro ao importar backup.', 'error');
      }
    },
    [addToast, confirm, guardAuth, handleRefreshData]
  );

  const downloadIcs = useCallback((assignment) => {
    if (!assignment?.date) return;
    const title = formatAssignmentLabel(assignment.tipo_designacao || 'Designação');
    const description = `Designação em ${formatDatePt(assignment.date)}`;
    const content = buildIcsContent({ title, dateStr: assignment.date, description });
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `designacao_${assignment.date}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, []);
  const assignmentsCount = (data.assignments || []).length;
  const notificationsCount = (data.notifications || []).length;

  useEffect(() => {
    if (!user || !authReady) return;

    setDataError(null);

    handleRefreshData({ silent: true });
  }, [user, authReady, handleRefreshData, isImpersonating]);

  useEffect(() => {
    if (!user || !authReady) return;
    loadForView(view);
  }, [authReady, loadForView, user, view]);

  useEffect(() => {
    if (!user || !authReady) return;
    if (view === 'ADMIN' && !isRealAdminUser) {
      setView('DASHBOARD');
    }
  }, [authReady, isRealAdminUser, user, view, setView]);

  useEffect(() => {
    if (!user || !authReady) return;
    setAssignmentsHasMore(true);
    setNotificationsHasMore(true);
  }, [user, authReady, isImpersonating]);

  useEffect(() => {
    if (!dataReady.assignments) return;
    if (assignmentsCount < ASSIGNMENTS_PAGE_SIZE) {
      setAssignmentsHasMore(false);
    }
  }, [assignmentsCount, dataReady.assignments]);

  useEffect(() => {
    if (!dataReady.notifications) return;
    if (notificationsCount < NOTIFICATIONS_PAGE_SIZE) {
      setNotificationsHasMore(false);
    }
  }, [dataReady.notifications, notificationsCount]);

  useEffect(() => {
    if (!authReady || isImpersonating) return;

    const authUid = auth.currentUser?.uid;

    if (!authUid) return;

    const latest = data.users.find((u) => u.id === authUid);

    if (!latest) return;

    if (
      !user ||
      user.id !== authUid ||
      user.isAdmin !== latest.isAdmin ||
      user.approved !== latest.approved ||
      user.name !== latest.name ||
      user.surname !== latest.surname
    ) {
      setUser(latest);
    }
  }, [authReady, data.users, isImpersonating, user]);

  useEffect(() => {
    if (!originalAdmin?.id || !isImpersonating) return;

    const latest = data.users.find((u) => u.id === originalAdmin.id);

    if (!latest) return;

    const hasChanged =
      latest.isAdmin !== originalAdmin.isAdmin ||
      latest.approved !== originalAdmin.approved ||
      latest.name !== originalAdmin.name ||
      latest.surname !== originalAdmin.surname;

    if (hasChanged) {
      setOriginalAdmin(latest);
    }
  }, [data.users, isImpersonating, originalAdmin, setOriginalAdmin]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);

    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const {
    selectedDate,
    setSelectedDate,
    setCalendarDate,
    monthWeeks,
    monthLabel,
    myAssignmentsByDate,
    dayAssignments,
    myAssignmentsCount,
    handleCalendarNavigate
  } = useCalendarState({
    assignments: data.assignments,
    user,
    formatAssignmentLabel,
    formatDatePt
  });

  const { waReminder } = useWhatsAppReminder({
    assignments: data.assignments,
    user,
    isPastDate
  });
  const sendWhatsAppReminder = useCallback(
    (assignment) => {
      if (!assignment || !user) return;
      const message = `Lembrete: sua designação "${assignment.tipo_designacao}" é em ${formatDatePt(assignment.date)}.`;
      const link = buildWhatsAppLink(user.phone || '', message);
      window.open(link, '_blank', 'noopener');
      if (assignment.id) {
        localStorage.setItem(`wa_reminder_${user.id}_${assignment.id}`, 'sent');
      }
      addToast('Lembrete enviado.', 'success');
    },
    [user, addToast]
  );

  useEffect(() => {
    if (!user || !authReady) return;

    const tomorrowKey = (a) => `internal_reminder_${user.id}_${a.id}`;

    const now = new Date();

    data.assignments

      .filter((a) => a.usuario_id === user.id && a.status !== 'confirmado')

      .forEach(async (a) => {
        const targetDate = new Date(`${a.date}T12:00:00`);

        const diffDays = Math.floor((targetDate - now) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          const key = tomorrowKey(a);

          if (localStorage.getItem(key)) return;

          try {
            await addDoc(collection(db, 'notifications'), {
              text: `Lembrete: sua designação "${a.tipo_designacao}" é amanhã (${formatDatePt(a.date)}).`,
              authorId: user.id,
              created_at: serverTimestamp(),
              type: 'reminder',
              targetView: 'ASSIGNMENTS_MONTH',
              read_by: []
            });

            localStorage.setItem(key, 'sent');
          } catch (e) {
            // noop
          }
        }
      });
  }, [data.assignments, user, authReady]);

  const refreshDashboardCounters = useCallback(async () => {
    // Disabled to reduce Firestore reads on free tier.

    return;
  }, []);

  const {
    notificationsForUser,
    unreadNotificationsCount,
    unreadAnnouncementsCount,
    totalAlertsCount
  } = useNotificationsState({
    notifications: data.notifications,
    announcements: data.announcements,
    user
  });

  const { searchFilters, setSearchFilters, searchResults } = useSearchFilters({
    assignments: data.assignments,
    users: data.users,
    notifications: notificationsForUser,
    formatDatePt
  });

  const {
    notificationsSupported,
    notificationPermission,
    desktopNotificationsEnabled,
    toggleDesktopNotifications
  } = useBrowserNotifications({
    user,
    dataReady,
    notifications: notificationsForUser,
    announcements: data.announcements,
    assignments: data.assignments,
    formatDatePt,
    formatAssignmentLabel,
    soundEnabled,
    isDndNow,
    playNotificationSound,
    addToast
  });

  const filteredAssignments = useMemo(() => {
    if (!filters.hasFiltered) return [];
    return data.assignments.filter((a) => {
      if (filters.name && a.usuario_id != filters.name) return false;
      if (filters.date && a.date != filters.date) return false;
      if (filters.status && a.status != filters.status) return false;
      if (filters.type && a.tipo_designacao != filters.type) return false;
      return true;
    });
  }, [data.assignments, filters]);

  const { activePinnedAnnouncement } = usePinnedAnnouncement({
    announcements: data.announcements,
    dismissedPinned
  });

  const resolveNotificationTarget = useCallback((n) => {
    if (!n) return 'NOTICES';
    if (n.targetView) return normalizeViewId(n.targetView);
    if (n.type === 'announcement') return 'NOTICES';
    if (n.type === 'reminder' || n.type === 'assignment_import') return 'ASSIGNMENTS_MONTH';
    return 'NOTICES';
  }, []);

  const {
    handleCreateAnnouncement,
    handleDeleteAnnouncement,
    handleMarkAnnouncementRead,
    handleDismissPinned,
    handleOpenPinned,
    handleClearReadAnnouncements
  } = useAnnouncementActions({
    api,
    db,
    user,
    addToast,
    confirm,
    runExclusive,
    guardAuth,
    setDismissedPinned,
    setView,
    setAlertTab,
    data,
    collection,
    addDoc,
    serverTimestamp,
    deleteDoc,
    doc,
    updateDoc,
    arrayUnion
  });

  const { handleClearNotifications, handleOpenNotification } = useNotificationActions({
    db,
    user,
    addToast,
    confirm,
    runExclusive,
    guardAuth,
    setUser,
    setData,
    data,
    resolveNotificationTarget,
    setView,
    setAlertTab,
    doc,
    updateDoc,
    arrayUnion,
    serverTimestamp
  });

  const swapLogsByAssignment = useMemo(() => {
    const map = {};

    (data.swapLogs || []).forEach((l) => {
      if (!l.assignmentId) return;

      if (!map[l.assignmentId]) map[l.assignmentId] = [];

      map[l.assignmentId].push(l);
    });

    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || a.createdAt || 0;

        const tb = b.createdAt?.toMillis?.() || b.createdAt || 0;

        return tb - ta;
      })
    );

    return map;
  }, [data.swapLogs]);

  const { assignmentReport } = useReportsAnalytics({
    assignments: data.assignments,
    formatAssignmentLabel
  });

  const adminUserId = originalAdmin?.id || auth.currentUser?.uid || user?.id;
  const adminUser =
    data.users.find((u) => u.id === adminUserId) ||
    (adminUserId === user?.id ? user : originalAdmin);
  const isAdmin = Boolean(
    hasAdminAccess || (adminUser && (adminUser.isAdmin || isAdminUid(adminUser.id)))
  );
  const isRealAdmin = isAdmin && !isImpersonating;

  const handleFixMojibake = useCallback(async () => {
    if (isFixingMojibake) return;
    if (!isAdmin) {
      addToast('Apenas administradores podem executar a limpeza.', 'warn');
      return;
    }
    const confirmed = await confirm({
      title: 'Corrigir acentuação',
      message:
        'Essa rotina corrige textos com caracteres quebrados (mojibake). Ela atualiza os documentos carregados no app.',
      confirmText: 'Corrigir'
    });
    if (!confirmed) return;
    setIsFixingMojibake(true);
    try {
      const updatesByCollection = new Map();
      const queueUpdate = (collectionName, id, changes) => {
        if (!updatesByCollection.has(collectionName)) {
          updatesByCollection.set(collectionName, new Map());
        }
        updatesByCollection.get(collectionName).set(id, changes);
      };
      const collect = (collectionName, items, fields) => {
        (items || []).forEach((item) => {
          if (!item?.id) return;
          const changes = {};
          fields.forEach((field) => {
            if (typeof item[field] !== 'string') return;
            const fixed = fixMojibake(item[field]);
            if (fixed !== item[field]) {
              changes[field] = fixed;
            }
          });
          if (Object.keys(changes).length > 0) {
            queueUpdate(collectionName, item.id, changes);
          }
        });
      };

      collect('users', data.users, ['name', 'surname', 'displayName']);
      collect('assignments', data.assignments, ['tipo_designacao', 'status', 'location']);
      collect('notifications', data.notifications, ['text']);
      collect('announcements', data.announcements, ['title', 'message']);

      const entries = [];
      updatesByCollection.forEach((map, collectionName) => {
        map.forEach((changes, id) => {
          entries.push({ collectionName, id, changes });
        });
      });

      if (entries.length === 0) {
        addToast('Nenhum texto com problema encontrado.', 'info');
        return;
      }

      for (let i = 0; i < entries.length; i += 400) {
        const batch = writeBatch(db);
        entries.slice(i, i + 400).forEach((entry) => {
          batch.update(doc(db, entry.collectionName, entry.id), entry.changes);
        });
        await batch.commit();
      }

      setData((prev) =>
        ['users', 'assignments', 'notifications', 'announcements'].reduce((nextState, key) => {
          return patchCollectionItems(nextState, key, updatesByCollection.get(key));
        }, prev)
      );

      addToast(`Correção concluída. ${entries.length} item(s) atualizados.`, 'success');
    } catch (err) {
      addToast('Erro ao corrigir acentuação.', 'error');
    } finally {
      setIsFixingMojibake(false);
    }
  }, [addToast, confirm, data, isAdmin, isFixingMojibake, setData]);

  const handleRefreshAll = useCallback(async () => {
    if (isRefreshingAll) return;
    setIsRefreshingAll(true);
    try {
      await handleRefreshData();
      await refreshDashboardCounters();
      setAssignmentsHasMore(true);
      setNotificationsHasMore(true);
    } finally {
      setIsRefreshingAll(false);
    }
  }, [handleRefreshData, isRefreshingAll, refreshDashboardCounters]);

  useMonthlyCleanupEffect({
    addToast,
    authReady,
    cleanupAssignments,
    cleanupNotifications,
    db,
    isRealAdminUser,
    setData,
    setUser,
    user
  });

  const handleOpenNotices = useCallback(
    (tab = 'NOTIFICATIONS') => {
      setAlertTab(tab);
      setView('NOTICES');
    },
    [setView]
  );

  const handleOpenAdminProgramming = useCallback(
    (tab = 'PROG_OVERVIEW') => {
      setAdminTab(tab);
      if (isImpersonating) {
        stopImpersonating('ADMIN');
        return;
      }
      setView('ADMIN');
    },
    [isImpersonating, setAdminTab, setView, stopImpersonating]
  );

  const {
    adminProgrammingSummary,
    myPendingAssignmentsCount,
    nextAssignment,
    todayAssignments,
    swapMarketplaceCount,
    weekAssignments
  } = useDashboardSummary({
    assignments: data.assignments,
    userId: user?.id,
    latestMeetingsImportBatch
  });

  const dashboardProps = {
    waReminder,
    sendWhatsAppReminder,
    activePinnedAnnouncement,
    handleOpenPinned,
    handleDismissPinned,
    setView,
    dataReady,
    unreadAnnouncementsCount,
    unreadNotificationsCount,
    totalAlertsCount,
    handleCalendarNavigate,
    monthLabel,
    monthWeeks,
    myAssignmentsByDate,
    selectedDate,
    setSelectedDate,
    setCalendarDate,
    formatAssignmentLabel,
    formatDatePt,
    dayAssignments,
    renderSkeletonList,
    myAssignmentsCount,
    isPastDate,
    nextAssignment,
    todayAssignments,
    weekAssignments,
    myPendingAssignmentsCount,
    swapMarketplaceCount,
    hasAdminAccess,
    isImpersonating,
    isRealAdmin,
    adminProgrammingSummary,
    onOpenNotices: handleOpenNotices,
    onOpenAdminProgramming: handleOpenAdminProgramming,
    specialEvents: data.specialEvents || []
  };

  const adminViewProps = {
    setView,
    adminTab,
    setAdminTab,
    data,
    assignForm,
    setAssignForm,
    autoAssignForm,
    setAutoAssignForm,
    autoAssignPreview,
    isGeneratingAutoAssignments,
    isSavingAutoAssignments,
    handleGenerateAutoAssignmentsPreview,
    handleSaveAutoAssignments,
    handleCreateAssignment,
    getUserAssignmentsOnDate,
    formatAssignmentLabel,
    ASSIGNMENT_TYPES,
    canUserTakeAssignment,
    selectedUserAssignments,
    handlePickNextAvailable,
    freeUsersForSelectedDate,
    formatDatePt,
    monthCountsForSelected,
    getUserDisplayName,
    handleDownloadAssignmentsTemplate,
    handleDownloadMechanicalAssignmentsTemplate,
    isImportingAssignments,
    handleImportAssignmentsFile,
    isImportingMeetings,
    handleDownloadMeetingsTemplate,
    handleImportMeetingsFile,
    latestMeetingsImportBatch,
    handleOpenLatestMeetingsReclassify,
    handleUndoMeetingsImport,
    handleWipeMeetingsData,
    isUndoingMeetingsImport,
    isWipingMeetingsData,
    isSavingMeetingsReclassify,
    handleShiftDate,
    isShiftingDates,
    reassigningId,
    setReassigningId,
    handleDeleteAssignment,
    handleUpdateAssignment,
    handleReassign,
    filters,
    setFilters,
    STATUS_TYPES,
    filteredAssignments,
    handleUpdateApproval,
    handleApproveAll,
    handleApproveByDomain,
    user,
    isAdminUid,
    handleImpersonate,
    selectedAdminUser,
    setSelectedAdminUser,
    handleToggleAdminRole,
    handleDeleteUser,
    handleAdminUpdateUserName,
    getUserAssignmentCapabilities,
    handleUpdateUserCapabilities,
    handleSendBroadcast,
    handleSendRecoveryEmail,
    handleTransferAssignments,
    assignmentReport,
    downloadCsv,
    handleExportBackup,
    handleImportBackup,
    handleFixMojibake,
    isFixingMojibake,
    handleCleanupAssignments,
    handleCleanupNotifications,
    isCleaningAssignments,
    isCleaningNotifications,
    handleWipeAssignments,
    isWipingAssignments,
    cleanupMonthLabel,
    getFriendlyTime,
    addToast,
    confirm,
    loadSections: safeLoadSections
  };

  const secondaryViewProps = {
    view,
    data,
    dataReady,
    user,
    getFriendlyTime,
    renderSkeletonList,
    formatDatePt,
    formatAssignmentLabel,
    isPastDate,
    handleAccept,
    handleSwapRequest,
    handleCancelSwap,
    downloadIcs,
    openSwapLogId,
    setOpenSwapLogId,
    swapLogsByAssignment,
    getUserDisplayName,
    handleAcceptSwap,
    isRealAdmin,
    canUserTakeAssignment,
    handleCreateTalk,
    handleUpdateTalk,
    handleDeleteTalk,
    handleUpdateAssignment,
    onLoadMoreAssignments: handleLoadMoreAssignments,
    hasMoreAssignments: assignmentsHasMore,
    isLoadingMoreAssignments
  };
  const lazyViewFallback = (
    <div className="page-shell space-y-4">{renderSkeletonList(4, 'h-24 w-full rounded-4xl')}</div>
  );
  if (user?.isAnonymous) {
    return (
      <ErrorBoundary>
        <Suspense fallback={lazyViewFallback}>
          <GuestView
            onLogout={handleGuestLogout}
            onRegister={() => {
              handleGuestLogout();
              setLoginState('REGISTER');
            }}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (!user) {
    return (
      <AuthScreen
        toasts={toasts}
        onCloseToast={removeToast}
        loginState={loginState}
        setLoginState={setLoginState}
        isLoading={isLoading}
        onLogin={handleLogin}
        onResetPassword={handlePasswordReset}
        onRegister={handleRegisterSelf}
        onGuestLogin={handleGuestLogin}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
      {toasts.map((t) => (
        <Toast key={t.id} msg={t.msg} type={t.type} onClose={() => removeToast(t.id)} />
      ))}

      <OfflineBanner isOnline={isOnline} />

      <ReloadPrompt />

      {dataError && (
        <div className="bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest text-center py-2">
          {dataError}
        </div>
      )}

      <AdminModals
        confirmState={confirmState}
        closeConfirm={closeConfirm}
        acceptConfirm={acceptConfirm}
        assignmentConflict={assignmentConflict}
        setAssignmentConflict={setAssignmentConflict}
        handleAssignAnyway={handleAssignAnyway}
        handlePickAlternativeUser={handlePickAlternativeUser}
        freeUsersForConflictDate={freeUsersForConflictDate}
        conflictMonthCounts={conflictMonthCounts}
        formatDatePt={formatDatePt}
        formatAssignmentLabel={formatAssignmentLabel}
        getUserDisplayName={getUserDisplayName}
        csvResolveState={csvResolveState}
        dismissCsvResolve={dismissCsvResolve}
        handleConfirmCsvResolve={handleConfirmCsvResolve}
        assignmentsImportPreview={assignmentsImportPreview}
        dismissAssignmentsImportPreview={dismissAssignmentsImportPreview}
        handleConfirmAssignmentsImport={handleConfirmAssignmentsImport}
        handleToggleAssignmentsImportShowInMeetings={handleToggleAssignmentsImportShowInMeetings}
        meetingsImportPreview={meetingsImportPreview}
        dismissMeetingsImportPreview={dismissMeetingsImportPreview}
        handleConfirmMeetingsImport={handleConfirmMeetingsImport}
        handleSelectMeetingsPreviewUser={handleSelectMeetingsPreviewUser}
        handleUpdateMeetingsPreviewSection={handleUpdateMeetingsPreviewSection}
        handleUpdateMeetingsPreviewOrder={handleUpdateMeetingsPreviewOrder}
        handleUpdateMeetingsPreviewAssignmentType={handleUpdateMeetingsPreviewAssignmentType}
        ASSIGNMENT_TYPES={ASSIGNMENT_TYPES}
        meetingsReclassifyState={meetingsReclassifyState}
        dismissMeetingsReclassify={dismissMeetingsReclassify}
        handleSaveMeetingsReclassify={handleSaveMeetingsReclassify}
        handleUpdateMeetingsReclassifyRow={handleUpdateMeetingsReclassifyRow}
        isSavingMeetingsReclassify={isSavingMeetingsReclassify}
      />

      {originalAdmin && user.id !== originalAdmin.id && (
        <div className="bg-orange-600 text-white py-2 px-4 text-[9px] font-black uppercase tracking-widest flex justify-between items-center z-[200] shadow-xl sticky top-0 animate-fade-in">
          <span className="flex items-center gap-2">
            <Eye size={12} /> Visualizando como: {user.name}
          </span>

          <button
            onClick={stopImpersonating}
            className="bg-white text-orange-600 px-3 py-1 rounded-xl"
          >
            VOLTAR AO ADMIN
          </button>
        </div>
      )}

      <AppHeader
        user={user}
        getUserDisplayName={getUserDisplayName}
        setIsUserMenuOpen={setIsUserMenuOpen}
        setView={setView}
        handleManualUpdate={handleManualUpdate}
        updateAvailable={updateAvailable}
        isUpdatingApp={isUpdatingApp}
        handleOpenNotices={handleOpenNotices}
        totalAlertsCount={totalAlertsCount}
        hasAdminAccess={hasAdminAccess}
        handleOpenAdminProgramming={handleOpenAdminProgramming}
        isImpersonating={isImpersonating}
        view={view}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar pb-40">
        <GlobalModals
          user={user}
          currentVersion={currentVersion}
          isRefreshingAll={isRefreshingAll}
          isDark={isDark}
          setIsDark={setIsDark}
          handleRefreshAll={handleRefreshAll}
          isUserMenuOpen={isUserMenuOpen}
          setIsUserMenuOpen={setIsUserMenuOpen}
          isChangingPass={isChangingPass}
          setIsChangingPass={setIsChangingPass}
          dismissUserMenu={dismissUserMenu}
          handleLogout={handleLogout}
          handleChangePassword={handleChangePassword}
          handleChangeDisplayName={handleChangeDisplayName}
          handleUpdatePreferences={handleUpdatePreferences}
          dismissAccountModal={dismissAccountModal}
          soundEnabled={soundEnabled}
          toggleSoundNotifications={toggleSoundNotifications}
          dndEnabled={dndEnabled}
          setDndEnabled={setDndEnabled}
          dndFrom={dndFrom}
          setDndFrom={setDndFrom}
          dndTo={dndTo}
          setDndTo={setDndTo}
          notificationsSupported={notificationsSupported}
          notificationPermission={notificationPermission}
          desktopNotificationsEnabled={desktopNotificationsEnabled}
          toggleDesktopNotifications={toggleDesktopNotifications}
          isHelpOpen={isHelpOpen}
          setIsHelpOpen={setIsHelpOpen}
          dismissHelpModal={dismissHelpModal}
          isAboutOpen={isAboutOpen}
          setIsAboutOpen={setIsAboutOpen}
          dismissAboutModal={dismissAboutModal}
        />

        {view === 'DASHBOARD' && (
          <ErrorBoundary>
            <DashboardView {...dashboardProps} />
          </ErrorBoundary>
        )}

        {view !== 'DASHBOARD' && (
          <Suspense fallback={lazyViewFallback}>
            {view === 'SEARCH' && (
              <ErrorBoundary>
                <SearchView
                  searchFilters={searchFilters}
                  setSearchFilters={setSearchFilters}
                  data={data}
                  searchResults={searchResults}
                  ASSIGNMENT_TYPES={ASSIGNMENT_TYPES}
                  STATUS_TYPES={STATUS_TYPES}
                  onClose={() => navigateBack('DASHBOARD')}
                  formatDatePt={formatDatePt}
                  formatAssignmentLabel={formatAssignmentLabel}
                  getUserDisplayName={getUserDisplayName}
                  getFriendlyTime={getFriendlyTime}
                />
              </ErrorBoundary>
            )}

            {view === 'NOTICES' && (
              <NoticesView
                isRealAdmin={isRealAdmin}
                dataReady={dataReady}
                data={data}
                user={user}
                notificationsForUser={notificationsForUser}
                alertTab={alertTab}
                setAlertTab={setAlertTab}
                handleOpenNotification={handleOpenNotification}
                handleMarkAnnouncementRead={handleMarkAnnouncementRead}
                handleClearNotifications={handleClearNotifications}
                handleClearReadAnnouncements={handleClearReadAnnouncements}
                handleCreateAnnouncement={handleCreateAnnouncement}
                handleDeleteAnnouncement={handleDeleteAnnouncement}
                getFriendlyTime={getFriendlyTime}
                unreadNotificationsCount={unreadNotificationsCount}
                unreadAnnouncementsCount={unreadAnnouncementsCount}
                renderSkeletonList={renderSkeletonList}
                onBack={() => navigateBack('DASHBOARD')}
                onLoadMoreNotifications={handleLoadMoreNotifications}
                notificationsHasMore={notificationsHasMore}
                isLoadingMoreNotifications={isLoadingMoreNotifications}
              />
            )}

            {view === 'ADMIN' && isRealAdmin && (
              <ErrorBoundary>
                <AdminView {...adminViewProps} />
              </ErrorBoundary>
            )}
            <SecondaryViews {...secondaryViewProps} onBack={() => navigateBack('DASHBOARD')} />
          </Suspense>
        )}
      </main>

      <BottomNav
        view={view}
        unreadNoticesCount={totalAlertsCount}
        onNavigate={(next) => {
          if (normalizeViewId(next) === 'NOTICES') {
            handleOpenNotices('NOTIFICATIONS');
            return;
          }
          setView(next);
        }}
      />
    </div>
  );
};

export default App;
