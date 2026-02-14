# Task List for Manoeuvreerspel (TypeScript Migration)

## Completed Tasks
- [x] Analyze existing codebase
    - [x] `index.html` structure
    - [x] External JS files
- [x] Create Implementation Plan for Sprint 1
    - [x] Define directory structure
    - [x] Define build tools (Vite + TS)
    - [x] Define migration strategy
- [x] Migrate Code
    - [x] Extract CSS to `src/style.css`
    - [x] Convert Harbors data to `src/data/harbors.ts`
    - [x] Create core modules (`Constants`, `types`, `Input`, `GameState`)
    - [x] Create physics module (`src/sim/Physics.ts`, `src/sim/Boat.ts`)
    - [x] Create rendering module (`src/ui/Render.ts`)
    - [x] Create main entry point (`src/main.ts`)
    - [x] Update `index.html` to use new modules
- [x] Execute Sprint 1 (Refactoring to TS + Vite)
    - [x] Initialize Vite project
    - [x] Set up TypeScript configuration
    - [x] Create folder structure
    - [x] Migrate code to modules
        - [x] Core
        - [x] Simulation
        - [x] Models
        - [x] UI
    - [x] Verify functionality
- [x] Sprint 2: Verify and Test
    - [x] Verify Physics Parity
    - [x] Verify UI Functionality

## Stabilization Phase
- [x] Test and Fix Game Functionality
    - [x] Test Menus (Settings, Help)
    - [x] Test Steering (Throttle, Rudder, Bow Thruster)
    - [x] Fix identified errors

## Upcoming Tasks (To Do)
- [x] Add Wave Drawing Logic (Perpendicular to Wind)
- [x] Align Physics and Rendering (Detailed Boat, Propwash, Wind HUD)
- [x] Deep Physics Alignment (Line breaking force-based fixed)
- [x] Refine Tutorial System (7 interactive steps implemented)
- [x] Polish UI (Settings visible, flat jetties, responsive line tension visuals)
## Upcoming Tasks (To Do)
- [ ] **See `PROJECT_STATUS.md` for the full roadmap.** <!-- id: 100 -->
- [ ] **Next Step:** Begin Phase 1 (Harbor Editor UI). <!-- id: 101 -->
