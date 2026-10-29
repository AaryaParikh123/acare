import type { EnergyCalcInput, EnergyCalcResult } from '../types';

/**
 * Energy cost estimation.
 * Energy (kWh) = Power (W) / 1000 × Hours/day × Days
 * Cost = Energy × Tariff (₹/kWh)
 *
 * Results are estimates. Actual inverter AC consumption varies
 * significantly with ambient temperature, thermostat setpoint,
 * insulation and usage patterns.
 */
export function calcEnergy(input: EnergyCalcInput): EnergyCalcResult {
  const energyKwh = (input.powerWatts / 1000) * input.hoursPerDay * input.daysUsed;
  const estimatedCost = energyKwh * input.tariffPerKwh;
  return { energyKwh, estimatedCost };
}

/**
 * Indicative cooling capacity range for a room.
 *
 * Assumptions (documented):
 * - Base: 0.0667 TR per m² (≈ 600 BTU/hr per m², standard rule of thumb)
 * - Ceiling height factor: multiply by (height / 2.7) when height > 2.7 m
 * - Each additional occupant beyond 2: add 0.05 TR
 * - High sun exposure: add 10 % to tonnage
 * - Medium sun exposure: add 5 %
 * - Top floor: add 10 %
 * - Large windows (≥4, non-double-glazed): add 5 %
 * - Kitchen / server room heat source: add 0.25 TR
 *
 * These are engineering rules of thumb for guidance only and
 * do not replace a proper HVAC load calculation.
 */
export function calcCoolingLoad(params: {
  lengthM: number;
  widthM: number;
  heightM: number;
  occupants: number;
  windows: number;
  windowType: 'single' | 'double' | 'none';
  sunExposure: 'low' | 'medium' | 'high';
  floorLevel: 'ground' | 'middle' | 'top';
  heatSources: string;
}): { minTons: number; maxTons: number; areaSqm: number; volumeCubicM: number } {
  const area = params.lengthM * params.widthM;
  const volume = area * params.heightM;

  // Base tonnage
  let base = area * 0.0667;

  // Height correction
  if (params.heightM > 2.7) base *= params.heightM / 2.7;

  // Occupant correction (base: 2 people)
  const extraOccupants = Math.max(0, params.occupants - 2);
  base += extraOccupants * 0.05;

  // Sun exposure
  if (params.sunExposure === 'high') base *= 1.10;
  else if (params.sunExposure === 'medium') base *= 1.05;

  // Floor
  if (params.floorLevel === 'top') base *= 1.10;

  // Windows
  if (params.windows >= 4 && params.windowType !== 'double') base *= 1.05;

  // Heat sources
  const hs = params.heatSources.toLowerCase();
  if (hs.includes('kitchen') || hs.includes('server') || hs.includes('equipment')) base += 0.25;

  // Round to nearest 0.25 TR for AC selection guidance
  const roundedMin = Math.floor(base / 0.25) * 0.25;
  const roundedMax = Math.ceil((base * 1.1) / 0.25) * 0.25;

  return {
    minTons: Math.max(0.75, roundedMin),
    maxTons: Math.max(1, roundedMax),
    areaSqm: area,
    volumeCubicM: volume,
  };
}
