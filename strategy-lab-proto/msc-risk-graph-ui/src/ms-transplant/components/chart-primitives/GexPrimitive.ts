/**
 * GexPrimitive — Stub for transplant compilation
 * (Requires lightweight-charts, not available in MSC)
 */

export type GexDataPoint = {
  strike: number;
  calls: number;
  puts: number;
};

export type GexPrimitiveOptions = {
  mode: 'combined' | 'net';
  maxGex: number;
  maxNetGex: number;
  barHeight: number;
  callColor: string;
  putColor: string;
  transparency: number;
};

export class GexPrimitive {
  private _options: GexPrimitiveOptions;
  constructor(options?: Partial<GexPrimitiveOptions>) {
    this._options = {
      mode: 'combined',
      maxGex: 1,
      maxNetGex: 1,
      barHeight: 400,
      callColor: '#22c55e',
      putColor: '#ef4444',
      transparency: 0,
      ...options,
    };
  }
  updateData(_data: GexDataPoint[]): void {}
  updateOptions(options: Partial<GexPrimitiveOptions>): void {
    this._options = { ...this._options, ...options };
  }
}
