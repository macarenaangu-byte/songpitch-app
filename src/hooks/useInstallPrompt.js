import { useState, useEffect } from 'react';

/**
 * Captures the browser's PWA install prompt so we can show
 * a custom "Download the App" button instead of the default browser UI.
 *
 * Returns:
 *   canInstall  — true when the browser is ready and app is not yet installed
 *   isInstalled — true when running in standalone (already installed)
 *   install     — call this to trigger the install prompt
 */
export function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  );

  useEffect(() => {
    if (isInstalled) return;

    const onBeforeInstall = (e) => {
      e.preventDefault(); // suppress browser's default prompt
      setPrompt(e);
    };

    const onInstalled = () => {
      setPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [isInstalled]);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setPrompt(null);
      setIsInstalled(true);
    }
  };

  return { canInstall: !!prompt && !isInstalled, isInstalled, install };
}
