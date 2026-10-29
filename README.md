# ACare — Simple Personal AC Management Website

> **Architecture**: Client-side Single Page Application (SPA) with browser `localStorage` persistence. No external backend or database is configured.

---

## 1. Project Overview

**ACare** is a clean, practical, personal air conditioning management system built for homeowners and apartment residents to track their air conditioning assets, schedule recurring maintenance, record servicing history, monitor true total cost of ownership (TCO), estimate electricity bills, and size new ACs using standard engineering rules of thumb.

### Key Capabilities

1. **Dashboard**: High-level household overview displaying total registered AC units, total purchase & installation expenditure, itemized maintenance expenses, upcoming services, and immediate alerts for overdue maintenance.
2. **My ACs**: Inventory of all household ACs with detailed specification tracking (tonnage, inverter technology, refrigerant type, location, rated wattage, purchase details, and warranty milestones).
3. **Maintenance & Service History**: Scheduled filter cleanings, coil inspections, refrigerant top-ups, technician contacts, and cost logging with automatic recurring intervals.
4. **Ownership Costs**: Accurate tracking of capital expenditure (purchase + installation) vs. operational expenditure (maintenance, parts, and repairs) in Indian Rupees (₹) without double counting.
5. **Energy Cost Calculator**: Interactive energy consumption and electricity cost estimation using rated input power, daily usage hours, operational days, and local tariff rates.
6. **AC Buying Assistant**: Guided room cooling load estimator that factors in room dimensions (area and volume), occupant loads, window glazing, solar exposure, floor level, and additional sensible heat sources. Includes a comparative matrix of market specifications.
7. **Account & Data Management**: Create an account, manage personal AC records, and clear saved application data.

---

## 2. Technology Stack

- **Framework**: [React 18](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool / Bundler**: [Vite 5](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **Persistence**: Browser `localStorage` with resilient JSON serialization and fallback handlers

---

## 3. Folder Structure

```
acare/
├── index.html                    # Single page HTML entry point
├── package.json                  # Dependencies and execution scripts
├── postcss.config.js             # PostCSS configuration for Tailwind
├── tailwind.config.js            # Tailwind theme colors and utility setup
├── tsconfig.json                 # TypeScript compiler configuration
├── tsconfig.node.json            # Node/Vite specific TS configuration
├── vite.config.ts                # Vite build and plugin setup
├── public/
│   └── favicon.svg               # Application icon
└── src/
    ├── main.tsx                  # Application bootstrap
    ├── App.tsx                   # Route definitions and auth protection
    ├── index.css                 # Global CSS and reusable Tailwind component classes
    ├── types/
    │   └── index.ts              # Core TypeScript data contracts (ACUnit, Task, Service, Expense, etc.)
    ├── context/
    │   ├── AuthContext.tsx       # Local session authentication provider
    │   └── DataContext.tsx       # Global reactive data store for ACs, tasks, and costs
    ├── utils/
    │   ├── calculations.ts       # Cooling load and energy calculation algorithms
    │   ├── format.ts             # Date, currency (₹), and relative time formatters
    │   ├── storage.ts            # LocalStorage abstraction with error resilience
    │   └── uuid.ts               # Unique identifier generation utility
    ├── components/
    │   ├── Layout.tsx            # Navigation header, responsive mobile drawer, footer
    │   ├── ConfirmDialog.tsx     # Reusable confirmation modal before record deletion
    │   ├── EmptyState.tsx        # Informative placeholder when lists are empty
    │   ├── Modal.tsx             # Generic dialog container
    │   └── Toast.tsx             # Self-dismissing action feedback banner
    └── pages/
        ├── LoginPage.tsx         # Account sign-in screen
        ├── RegisterPage.tsx      # Account registration screen
        ├── DashboardPage.tsx     # Executive summary, alerts, and quick actions
        ├── ACListPage.tsx        # Inventory list with live search and inverter filter
        ├── ACDetailPage.tsx      # Comprehensive AC specifications and linked history
        ├── ACFormPage.tsx        # Add / Edit AC unit form with validation
        ├── MaintenancePage.tsx   # Tasks, service records, and expense ledger
        ├── TaskFormPage.tsx      # Schedule new or recurring maintenance tasks
        ├── ServiceFormPage.tsx   # Record maintenance visits and technician costs
        ├── ExpenseFormPage.tsx   # Standalone expense recording
        ├── BuyingAssistantPage.tsx # Cooling load calculator and AC comparison
        └── SettingsPage.tsx      # Energy calculator, preferences, and data management
```

---

## 4. Setup & Running Instructions

### Prerequisites
- Node.js (version 18.0.0 or higher recommended)
- npm (version 9.0.0 or higher)

### Installation Steps

1. **Navigate to the project directory**:
   ```bash
   cd acare
   ```

2. **Install dependencies**:
   ```bash
   npm.cmd install
   ```

3. **Start the local development server**:
   ```bash
   npm.cmd run dev
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:5173`.

5. **Create an account**: On the sign-in page, select **Register** and enter your name, email, and password. Sign in with that account on later visits.

6. **Production Build**:
   ```bash
   npm.cmd run build
   npm.cmd run preview
   ```

---

## 5. Technical Explanations

### A. How Local Data Storage Works (`src/utils/storage.ts`)
- **Independent Collections**: Data is separated into distinct browser `localStorage` keys:
  - `acare_ac_units`: Inventory of air conditioning units.
  - `acare_tasks`: Maintenance tasks with due dates and recurrence settings.
  - `acare_service_records`: Logged physical service events and technician observations.
  - `acare_expenses`: Granular ledger entries (purchase, installation, maintenance, parts, repairs).
  - `acare_users` & `acare_current_user`: Account records and the current session ID.
- **Resilience**: The `safeRead` function wraps `JSON.parse` inside a `try/catch` block, automatically falling back to an empty collection `[]` if the stored data is malformed, corrupted, or absent.
- **Relational Integrity**: Deleting an AC unit cascades to clean up associated maintenance tasks, service history, and expense entries.
- **Double-Count Prevention**: When recording a service in `ServiceFormPage`, expense entries for labour, parts, and misc costs are generated with an explicit `serviceRecordId` link, ensuring the service history and expense tab remain synchronized without duplicating costs.
- **Browser Boundary**: The app currently stores records and account data in this browser; it does not sync them to other devices. Passwords are stored as plain text, so add server-side authentication and password hashing before using real credentials or deploying for production.

### B. Engineering & Energy Calculations (`src/utils/calculations.ts`)

#### 1. Energy Consumption & Cost Calculation (Section 8)
$$\text{Energy (kWh)} = \frac{\text{Rated Power (Watts)}}{1000} \times \text{Daily Operating Hours} \times \text{Days of Use}$$

$$\text{Estimated Running Cost (₹)} = \text{Energy (kWh)} \times \text{Electricity Tariff (₹/kWh)}$$

*Engineering Note*: Inverter air conditioners continuously modulate their compressor speed via variable frequency drives (VFD) once the room reaches the setpoint temperature. Therefore, rated input power reflects nominal or peak load; actual seasonal energy consumption is typically 20% to 50% lower under partial load conditions.

#### 2. Indicative Cooling Load Calculation (`calcCoolingLoad`)
The sizing tool utilizes standard Indian RAC / Bureau of Energy Efficiency (BEE) rules of thumb:
1. **Base Sizing**: $0.0667\text{ TR per m}^2$ (equivalent to approximately $600\text{ BTU/hr}\cdot\text{m}^2$).
2. **Ceiling Height Factor**: If ceiling height exceeds standard $2.7\text{ m}$, tonnage is scaled proportionally: $\text{Base} \times (\text{Height} / 2.7)$.
3. **Occupancy Load**: Sensible and latent heat from occupants is factored by adding $0.05\text{ TR}$ for each occupant beyond 2 individuals.
4. **Solar Radiation (Sun Exposure)**:
   - High exposure (West/South facing walls/windows): $+10\%$
   - Medium exposure: $+5\%$
5. **Roof Thermal Transmission**: Top floors experience direct solar roof heat gain; an additional $+10\%$ is applied.
6. **Fenestration Factor**: $\ge 4$ single-glazed windows add $+5\%$ due to solar radiation and conductive transmission.
7. **Internal Heat Gains**: Equipment (kitchen appliances, servers) adds $+0.25\text{ TR}$.
8. **Selection Guidance**: Outputs a practical selection range (e.g., $1.25\text{ to }1.5\text{ TR}$) rounded to commercially available split AC capacities ($0.75, 1.0, 1.5, 2.0\text{ TR}$).

---

## 6. Project Compliance Checklist

- [x] Responsive design with clean Tailwind components (no neon/excessive animations)
- [x] Zero external databases (Supabase, Firebase, PostgreSQL omitted)
- [x] Responsive layout tested for both laptop and mobile viewport widths
- [x] Complete CRUD for ACs with detailed specification cards and individual detail views
- [x] Dynamic calculation of upcoming vs. overdue maintenance tasks based on live system date
- [x] Automatic scheduling of next occurrence for recurring maintenance tasks upon completion
- [x] Accurate cost calculations with clear itemized totals in Indian Rupees (₹)
- [x] AC Buying Assistant with documented engineering assumptions and disclaimers
- [x] Standalone Energy Cost Calculator with parameter inputs and formula explanation
- [x] Local storage reset
- [x] Comprehensive error handling and deletion confirmation dialogs
