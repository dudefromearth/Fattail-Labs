/**
 * useIndicatorSettings - Hook for persisting indicator settings
 *
 * Stores settings in localStorage with the ability to:
 * - Load saved settings on mount
 * - Save current settings as defaults
 * - Reset to factory defaults
 *
 * Extensible for future backend persistence via API
 */

import { useState, useEffect, useCallback } from 'react';
import { defaultGexConfig, type GexConfig } from './GexSettings';
import { defaultVolumeProfileConfig, type VolumeProfileConfig } from './VolumeProfileSettings';

const STORAGE_KEY = 'marketswarm:indicator-settings';

export interface IndicatorSettings {
  gex: GexConfig;
  volumeProfile: VolumeProfileConfig;
  // Future settings can be added here
}

// Factory defaults - the hardcoded starting point
const factoryDefaults: IndicatorSettings = {
  gex: defaultGexConfig,
  volumeProfile: defaultVolumeProfileConfig,
};

function loadSettings(): IndicatorSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with factory defaults to handle new settings added later
      return {
        gex: { ...factoryDefaults.gex, ...parsed.gex },
        volumeProfile: { ...factoryDefaults.volumeProfile, ...parsed.volumeProfile },
      };
    }
  } catch (err) {
    console.error('[useIndicatorSettings] Failed to load settings:', err);
  }
  return factoryDefaults;
}

function saveSettings(settings: IndicatorSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('[useIndicatorSettings] Failed to save settings:', err);
  }
}

export function useIndicatorSettings() {
  const [settings, setSettings] = useState<IndicatorSettings>(loadSettings);
  const [savedDefaults, setSavedDefaults] = useState<IndicatorSettings>(loadSettings);

  // Load settings on mount
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setSavedDefaults(loaded);
  }, []);

  // Update GEX config
  const setGexConfig = useCallback((config: GexConfig | ((prev: GexConfig) => GexConfig)) => {
    setSettings(prev => ({
      ...prev,
      gex: typeof config === 'function' ? config(prev.gex) : config,
    }));
  }, []);

  // Update Volume Profile config
  const setVpConfig = useCallback((config: VolumeProfileConfig | ((prev: VolumeProfileConfig) => VolumeProfileConfig)) => {
    setSettings(prev => ({
      ...prev,
      volumeProfile: typeof config === 'function' ? config(prev.volumeProfile) : config,
    }));
  }, []);

  // Save current settings as the new defaults
  const saveAsDefault = useCallback(() => {
    saveSettings(settings);
    setSavedDefaults(settings);
    return true;
  }, [settings]);

  // Reset to saved defaults (user's saved preferences)
  const resetToSavedDefaults = useCallback(() => {
    setSettings(savedDefaults);
  }, [savedDefaults]);

  // Reset to factory defaults (hardcoded original values)
  const resetToFactoryDefaults = useCallback(() => {
    setSettings(factoryDefaults);
  }, []);

  // Check if current settings differ from saved defaults
  const hasUnsavedChanges = useCallback(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedDefaults);
  }, [settings, savedDefaults]);

  return {
    gexConfig: settings.gex,
    vpConfig: settings.volumeProfile,
    setGexConfig,
    setVpConfig,
    saveAsDefault,
    resetToSavedDefaults,
    resetToFactoryDefaults,
    hasUnsavedChanges,
    savedDefaults,
  };
}
