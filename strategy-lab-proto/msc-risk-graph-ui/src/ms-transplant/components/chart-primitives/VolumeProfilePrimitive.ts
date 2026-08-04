/**
 * VolumeProfilePrimitive — Stub for transplant compilation
 * (Requires lightweight-charts, not available in MSC)
 */

export type VolumeProfileDataPoint = {
  price: number;
  volume: number;
};

export type VolumeProfilePrimitiveOptions = {
  maxVolume: number;
  barHeight: number;
  maxBarWidthPercent: number;
  color: string;
  binSize?: number;
  numRows?: number;
};

export class VolumeProfilePrimitive {
  private _options: VolumeProfilePrimitiveOptions;
  constructor(options?: Partial<VolumeProfilePrimitiveOptions>) {
    this._options = {
      maxVolume: 1,
      barHeight: 4,
      maxBarWidthPercent: 30,
      color: '#9333ea',
      ...options,
    };
  }
  updateData(_data: VolumeProfileDataPoint[]): void {}
  updateOptions(options: Partial<VolumeProfilePrimitiveOptions>): void {
    this._options = { ...this._options, ...options };
  }
}
