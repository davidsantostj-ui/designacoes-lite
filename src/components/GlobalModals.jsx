import React from 'react';
import UserMenuModal from './UserMenuModal';
import AccountModal from './AccountModal';
import HelpModal from './HelpModal';
import AboutModal from './AboutModal';
import { getUserDisplayName } from '../utils/textUtils';

const GlobalModals = ({
  user,
  currentVersion,
  isRefreshingAll,
  isDark,
  setIsDark,
  handleRefreshAll,
  isUserMenuOpen,
  setIsUserMenuOpen,
  isChangingPass,
  setIsChangingPass,
  dismissUserMenu,
  handleLogout,
  handleChangePassword,
  handleChangeDisplayName,
  handleUpdatePreferences,
  dismissAccountModal,
  soundEnabled,
  toggleSoundNotifications,
  dndEnabled,
  setDndEnabled,
  dndFrom,
  setDndFrom,
  dndTo,
  setDndTo,
  notificationsSupported,
  notificationPermission,
  desktopNotificationsEnabled,
  toggleDesktopNotifications,
  isHelpOpen,
  setIsHelpOpen,
  dismissHelpModal,
  isAboutOpen,
  setIsAboutOpen,
  dismissAboutModal
}) => {
  return (
    <>
      <UserMenuModal
        open={isUserMenuOpen}
        user={user}
        displayName={getUserDisplayName(user)}
        currentVersion={currentVersion}
        isRefreshing={isRefreshingAll}
        onToggleDark={() => setIsDark(!isDark)}
        onRefresh={handleRefreshAll}
        onOpenAccount={() => {
          setIsChangingPass(true);
          setIsUserMenuOpen(false);
        }}
        onOpenHelp={() => {
          setIsHelpOpen(true);
          setIsUserMenuOpen(false);
        }}
        onOpenAbout={() => {
          setIsAboutOpen(true);
          setIsUserMenuOpen(false);
        }}
        onLogout={handleLogout}
        onClose={dismissUserMenu}
      />
      
      <AccountModal
        open={isChangingPass}
        user={user}
        displayName={getUserDisplayName(user)}
        onClose={dismissAccountModal}
        onChangePassword={handleChangePassword}
        onChangeDisplayName={handleChangeDisplayName}
        onUpdatePreferences={handleUpdatePreferences}
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
      />

      <HelpModal open={isHelpOpen} onClose={dismissHelpModal} />

      <AboutModal
        open={isAboutOpen}
        onClose={dismissAboutModal}
        currentVersion={currentVersion}
      />
    </>
  );
};

export default GlobalModals;
