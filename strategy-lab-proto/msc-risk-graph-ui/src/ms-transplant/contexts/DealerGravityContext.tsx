/**
 * DealerGravityContext — Fetches VP artifact from dealer-gravity API
 * Config/analysis operations remain stubs (not needed on DudeTwo).
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

import type {
  DGArtifact,
  DGContextSnapshot,
  DealerGravityConfig,
  DealerGravityConfigUpdate,
  GexPanelConfig,
  GexPanelConfigUpdate,
  DGAnalysisResult,
} from '../types/dealerGravity';

interface DealerGravityContextValue {
  artifact: DGArtifact | null;
  structures: unknown | null;
  artifactVersion: string | null;
  contextSnapshot: DGContextSnapshot | null;
  config: DealerGravityConfig | null;
  configs: DealerGravityConfig[];
  gexConfig: GexPanelConfig | null;
  gexConfigs: GexPanelConfig[];
  analysisHistory: DGAnalysisResult[];
  analyzing: boolean;
  connected: boolean;
  loading: boolean;
  updateConfig: (updates: Partial<DealerGravityConfig>) => Promise<boolean>;
  createConfig: (config: Partial<DealerGravityConfig>) => Promise<number | null>;
  deleteConfig: (id: number) => Promise<boolean>;
  selectConfig: (id: number) => void;
  updateGexConfig: (updates: Partial<GexPanelConfig>) => Promise<boolean>;
  createGexConfigFn: (config: Partial<GexPanelConfig>) => Promise<number | null>;
  selectGexConfig: (id: number) => void;
  analyzeChart: (imageBase64: string, spotPrice: number) => Promise<DGAnalysisResult | null>;
  refreshArtifact: () => Promise<void>;
  refreshContext: () => Promise<void>;
}

const noop = () => {};
const noopAsync = async () => {};

const DealerGravityContext = createContext<DealerGravityContextValue>({
  artifact: null,
  structures: null,
  artifactVersion: null,
  contextSnapshot: null,
  config: null,
  configs: [],
  gexConfig: null,
  gexConfigs: [],
  analysisHistory: [],
  analyzing: false,
  connected: false,
  loading: false,
  updateConfig: async () => false,
  createConfig: async () => null,
  deleteConfig: async () => false,
  selectConfig: noop,
  updateGexConfig: async () => false,
  createGexConfigFn: async () => null,
  selectGexConfig: noop,
  analyzeChart: async () => null,
  refreshArtifact: noopAsync,
  refreshContext: noopAsync,
});

export function DealerGravityProvider({ children }: { children: ReactNode }) {
  const [artifact, setArtifact] = useState<DGArtifact | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchArtifact = useCallback(async () => {
    try {
      const res = await fetch('/api/dealer-gravity/artifact', { credentials: 'include' });
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !json.data) return;

      const d = json.data;
      const transformed: DGArtifact = {
        profile: d.profile ? {
          bins: d.profile.bins || [],
          min: d.profile.min ?? 2000,
          step: d.profile.step ?? 1,
        } : undefined,
        structures: d.structures ? {
          volumeNodes: (d.structures.volume_nodes || []).map((n: any) => ({
            price: typeof n === 'number' ? n : n.price,
            color: typeof n === 'number' ? '#ffff00' : (n.color || '#ffff00'),
            weight: typeof n === 'number' ? 1.5 : (n.weight || 1.5),
          })),
          volumeWells: (d.structures.volume_wells || []).map((w: any) =>
            Array.isArray(w) ? w : [w.low, w.high]
          ),
          crevasses: d.structures.crevasses || [],
        } : undefined,
        meta: d.meta ? { artifactVersion: d.meta.artifact_version || 'v1' } : undefined,
      };

      setArtifact(transformed);
    } catch (err) {
      console.error('[DealerGravityContext] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArtifact();

    // Listen for SSE-driven updates
    const handler = () => { fetchArtifact(); };
    window.addEventListener('dealer_gravity_artifact_updated', handler);
    return () => window.removeEventListener('dealer_gravity_artifact_updated', handler);
  }, [fetchArtifact]);

  const value: DealerGravityContextValue = {
    artifact,
    structures: artifact?.structures || null,
    artifactVersion: artifact?.meta?.artifactVersion || null,
    contextSnapshot: null,
    config: null,
    configs: [],
    gexConfig: null,
    gexConfigs: [],
    analysisHistory: [],
    analyzing: false,
    connected: !!artifact,
    loading,
    updateConfig: async () => false,
    createConfig: async () => null,
    deleteConfig: async () => false,
    selectConfig: noop,
    updateGexConfig: async () => false,
    createGexConfigFn: async () => null,
    selectGexConfig: noop,
    analyzeChart: async () => null,
    refreshArtifact: fetchArtifact,
    refreshContext: noopAsync,
  };

  return <DealerGravityContext.Provider value={value}>{children}</DealerGravityContext.Provider>;
}

export function useDealerGravity(): DealerGravityContextValue {
  return useContext(DealerGravityContext);
}

export default DealerGravityContext;
