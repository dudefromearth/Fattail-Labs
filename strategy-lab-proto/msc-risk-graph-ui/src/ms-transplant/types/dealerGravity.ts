/**
 * Dealer Gravity types — Stub for transplant compilation
 */

export interface DGProfile {
  bins: number[];
  min: number;
  step: number;
}

export interface DGVolumeNode {
  price: number;
  color: string;
  weight: number;
}

export interface DGStructures {
  volumeNodes: DGVolumeNode[];
  volumeWells: [number, number][];
  crevasses: [number, number][];
}

export interface DGArtifact {
  profile?: DGProfile;
  structures?: DGStructures;
  meta?: { artifactVersion: string };
}

export interface DGContextSnapshot {
  regime: string;
}

export interface DealerGravityConfig {
  id: number;
  name: string;
  enabled: boolean;
  mode: string;
  widthPercent: number;
  rowsLayout: 'number_of_rows' | 'ticks_per_row';
  rowSize: number;
  cappingSigma: number;
  color: string;
  transparency: number;
  showVolumeNodes: boolean;
  showVolumeWells: boolean;
  showCrevasses: boolean;
  isDefault: boolean;
}

export type DealerGravityConfigUpdate = Partial<DealerGravityConfig>;

export interface GexPanelConfig {
  id: number;
  enabled: boolean;
  mode: string;
  callsColor: string;
  putsColor: string;
  widthPx: number;
  isDefault: boolean;
}

export type GexPanelConfigUpdate = Partial<GexPanelConfig>;

export interface DGAnalysisResult {
  id: string;
  timestamp?: string;
  spotPrice?: number;
}
