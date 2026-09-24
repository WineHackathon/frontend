import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ScannerView from './components/ScannerView';
import SommelierChat from './components/SommelierChat';
import WineDetailModal from './components/WineDetailModal';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import {
  getStoredUser,
  getGuestScansRemaining,
  setStoredUser,
  api
} from './services/api';

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [remainingScans, setRemainingScans] = useState(getGuestScansRemaining());
  
  // Modals & Drawers
  const [isSommelierOpen, setIsSommelierOpen] = useState(false);
  const [sommelierPrompt, setSommelierPrompt] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('cellar');
  const [selectedWine, setSelectedWine] = useState(null);

  const handleOpenProfile = (tab = 'cellar') => {
    setProfileTab(tab);
    setIsProfileOpen(true);
  };

  useEffect(() => {
    const currentUser = getStoredUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const handleScanComplete = (updatedRemaining) => {
    if (updatedRemaining !== null && updatedRemaining !== undefined) {
      setRemainingScans(updatedRemaining);
    } else {
      setRemainingScans(getGuestScansRemaining());
    }
  };

  const handleOpenAuth = (prompt = null) => {
    setAuthPrompt(prompt);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setStoredUser(authenticatedUser);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  const handleAskSommelierFromWine = (wine, prompt) => {
    setSelectedWine(null);
    setSommelierPrompt(prompt);
    setIsSommelierOpen(true);
  };

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-black text-[#2c2a28] flex flex-col font-sans selection:bg-[#8f3d42] selection:text-white relative">
      
      {/* Top Floating Pill Header (vino-svoe.ru style) */}
      <Header
        user={user}
        remainingScans={remainingScans}
        onOpenAuth={() => handleOpenAuth({
          title: 'Добро пожаловать в «Своё Вино»',
          subtitle: 'Авторизуйтесь, чтобы разблокировать безлимитный сканер, сохранять вина в личный погреб и общаться с AI-сомелье!'
        })}
        onOpenProfile={(tab = 'cellar') => handleOpenProfile(tab)}
        onOpenWishlist={() => handleOpenProfile('wishlist')}
        onOpenSommelier={() => {
          setSommelierPrompt('');
          setIsSommelierOpen(true);
        }}
      />

      {/* Main Scanner View (Full Screen Viewport) */}
      <main className="w-full h-full relative overflow-hidden flex-1">
        <ScannerView
          remainingScans={remainingScans}
          onScanComplete={handleScanComplete}
          onOpenSommelier={() => {
            setSommelierPrompt('');
            setIsSommelierOpen(true);
          }}
          onOpenAuth={handleOpenAuth}
          onSelectWine={(wine) => setSelectedWine(wine)}
          isAuth={!!user}
        />
      </main>

      {/* Sommelier Modal (Wireframe Screen 2 / Image 2 & 3) */}
      <SommelierChat
        isOpen={isSommelierOpen}
        onClose={() => {
          setIsSommelierOpen(false);
          setSommelierPrompt('');
        }}
        onOpenAuth={handleOpenAuth}
        onSelectWine={(wine) => setSelectedWine(wine)}
        initialPrompt={sommelierPrompt}
      />

      {/* Wine Detail Modal (vino-svoe.ru exact layout & 4D Taste Matrix) */}
      <WineDetailModal
        wine={selectedWine}
        onClose={() => setSelectedWine(null)}
        onOpenAuth={handleOpenAuth}
        onAskSommelier={handleAskSommelierFromWine}
      />

      {/* Auth Modal (Login / Registration / Paywall) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        initialPrompt={authPrompt}
      />

      {/* Profile & Cellar Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onLogout={handleLogout}
        onSelectWine={(wine) => setSelectedWine(wine)}
        initialTab={profileTab}
      />

    </div>
  );
}
