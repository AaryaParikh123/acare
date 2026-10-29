// ─── Core Domain Types ───────────────────────────────────────────────────────

export type ACType = 'split' | 'window' | 'cassette' | 'portable' | 'central';
export type InverterType = 'inverter' | 'non-inverter';
export type SunExposure = 'low' | 'medium' | 'high';
export type RecurrenceUnit = 'days' | 'weeks' | 'months';
export type TaskStatus = 'pending' | 'completed' | 'overdue';
export type ExpenseCategory = 'purchase' | 'installation' | 'maintenance' | 'repair' | 'parts' | 'other';

// ─── AC Unit ─────────────────────────────────────────────────────────────────

export interface ACUnit {
  id: string;
  name: string;
  brand: string;
  model: string;
  serialNumber?: string;
  capacityTons: number;
  inverterType: InverterType;
  acType: ACType;
  refrigerant?: string;
  location: string;
  purchaseDate: string;       // ISO date string YYYY-MM-DD
  purchasePrice: number;
  installationCost: number;
  warrantyStart?: string;
  warrantyEnd?: string;
  ratedPowerWatts?: number;
  notes?: string;
  createdAt: string;
}

// ─── Maintenance Task ────────────────────────────────────────────────────────

export interface MaintenanceTask {
  id: string;
  acId: string;
  title: string;
  description?: string;
  dueDate: string;            // ISO date YYYY-MM-DD
  status: TaskStatus;
  recurrence?: {
    interval: number;
    unit: RecurrenceUnit;
  };
  completedDate?: string;
  createdAt: string;
}

// ─── Service Record ──────────────────────────────────────────────────────────

export interface ServiceRecord {
  id: string;
  acId: string;
  serviceDate: string;        // ISO date YYYY-MM-DD
  technicianName?: string;
  technicianContact?: string;
  serviceType: string;        // e.g. "Annual service", "Gas top-up", "Repair"
  notes?: string;
  labourCost: number;
  partsCost: number;
  otherCost: number;
  taskId?: string;            // link to the task that triggered this
  createdAt: string;
}

// ─── Expense Record ──────────────────────────────────────────────────────────

export interface ExpenseRecord {
  id: string;
  acId: string;
  date: string;               // ISO date YYYY-MM-DD
  category: ExpenseCategory;
  description: string;
  amount: number;
  serviceRecordId?: string;   // if linked to a service record
  createdAt: string;
}

// ─── Auth / User ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  /** Password is currently stored by the client-side authentication flow. */
  passwordHash: string;
  tariffPerKwh: number;       // default electricity tariff
  createdAt: string;
}

// ─── Buying Assistant Types ──────────────────────────────────────────────────

export interface RoomProfile {
  lengthM: number;
  widthM: number;
  heightM: number;
  occupants: number;
  windows: number;
  windowType: 'single' | 'double' | 'none';
  sunExposure: SunExposure;
  floorLevel: 'ground' | 'middle' | 'top';
  heatSources: string;
  budgetMin: number;
  budgetMax: number;
  expectedHoursPerDay: number;
  tariffPerKwh: number;
}

export interface ACSpec {
  id: string;
  brand: string;
  model: string;
  capacityTons: number;
  inverterType: InverterType;
  ratedPowerWatts: number;
  price: number;
  starRating?: number;
  iseel?: number;             // ISEER value if available
  notes?: string;
  isSample: boolean;
}

// ─── Energy Calculation ──────────────────────────────────────────────────────

export interface EnergyCalcInput {
  powerWatts: number;
  hoursPerDay: number;
  daysUsed: number;
  tariffPerKwh: number;
}

export interface EnergyCalcResult {
  energyKwh: number;
  estimatedCost: number;
}
