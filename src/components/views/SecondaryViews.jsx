import React from 'react';
import AssignmentsMonth from '../../features/assignments/AssignmentsMonth';
import MeetingsView from '../../features/meetings/MeetingsView';
import SwapMarket from '../../features/assignments/SwapMarket';
import TalksView from '../../features/talks/TalksView';
import SpecialEventsView from '../../features/events/SpecialEventsView';
import ErrorBoundary from '../ErrorBoundary';

const SecondaryViews = ({
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
  onBack,
  onLoadMoreAssignments,
  hasMoreAssignments,
  isLoadingMoreAssignments,
  isRealAdmin,
  canUserTakeAssignment,
  handleCreateTalk,
  handleUpdateTalk,
  handleDeleteTalk,
  handleUpdateAssignment
}) => {
  if (!['ASSIGNMENTS_MONTH', 'MEETINGS', 'SWAP_MARKET', 'TALKS', 'SPECIAL_EVENTS'].includes(view)) return null;

  return (
    <div className="page-shell space-y-6 animate-fade-in">
      {view === 'MEETINGS' && (
        <ErrorBoundary>
          <MeetingsView
            data={data}
            dataReady={dataReady}
            user={user}
            onBack={onBack}
            formatDatePt={formatDatePt}
            formatAssignmentLabel={formatAssignmentLabel}
            renderSkeletonList={renderSkeletonList}
            getUserDisplayName={getUserDisplayName}
            canUserTakeAssignment={canUserTakeAssignment}
            handleUpdateAssignment={handleUpdateAssignment}
          />
        </ErrorBoundary>
      )}

      {view === 'ASSIGNMENTS_MONTH' && (
        <ErrorBoundary>
          <AssignmentsMonth
            data={data}
            dataReady={dataReady}
            user={user}
            onBack={onBack}
            renderSkeletonList={renderSkeletonList}
            formatDatePt={formatDatePt}
            formatAssignmentLabel={formatAssignmentLabel}
            handleAccept={handleAccept}
            handleSwapRequest={handleSwapRequest}
            handleCancelSwap={handleCancelSwap}
            downloadIcs={downloadIcs}
            openSwapLogId={openSwapLogId}
            setOpenSwapLogId={setOpenSwapLogId}
            swapLogsByAssignment={swapLogsByAssignment}
            getUserDisplayName={getUserDisplayName}
            getFriendlyTime={getFriendlyTime}
            onLoadMore={onLoadMoreAssignments}
            hasMore={hasMoreAssignments}
            isLoadingMore={isLoadingMoreAssignments}
          />
        </ErrorBoundary>
      )}

      {view === 'SWAP_MARKET' && (
        <ErrorBoundary>
          <SwapMarket
            data={data}
            user={user}
            onBack={onBack}
            formatDatePt={formatDatePt}
            formatAssignmentLabel={formatAssignmentLabel}
            isPastDate={isPastDate}
            handleAcceptSwap={handleAcceptSwap}
            getUserDisplayName={getUserDisplayName}
          />
        </ErrorBoundary>
      )}

      {view === 'TALKS' && (
        <ErrorBoundary>
          <TalksView
            data={data}
            dataReady={dataReady}
            user={user}
            onBack={onBack}
            renderSkeletonList={renderSkeletonList}
            formatDatePt={formatDatePt}
            isRealAdmin={isRealAdmin}
            canUserTakeAssignment={canUserTakeAssignment}
            handleCreateTalk={handleCreateTalk}
            handleUpdateTalk={handleUpdateTalk}
            handleDeleteTalk={handleDeleteTalk}
          />
        </ErrorBoundary>
      )}

      {view === 'SPECIAL_EVENTS' && (
        <ErrorBoundary>
          <SpecialEventsView
            specialEvents={data.specialEvents || []}
            dataReady={dataReady}
            onBack={onBack}
            formatDatePt={formatDatePt}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

export default SecondaryViews;
