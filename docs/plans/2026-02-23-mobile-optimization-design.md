# Mobile Optimization Design - ViTrack

**Date:** 2026-02-23
**Scope:** Complete mobile UX/UI optimization + profile accessibility

## Problem

1. Profile page (`/dashboard/profile`) is unreachable on mobile — only linked from desktop Sidebar
2. Touch targets across the app are inconsistent (some too small)
3. Some layouts don't fully leverage mobile screen real estate
4. Input fields and interactive elements need mobile-optimized sizing

## Solution

### 1. MobileHeader Component (New)

A fixed top header visible only on mobile (`md:hidden`):

```
┌──────────────────────────────────┐
│  Page Title           [Avatar]   │
└──────────────────────────────────┘
```

- Left: page title (dynamic per route)
- Right: user avatar (photo or initials) linking to `/dashboard/profile`
- Fixed positioning with backdrop blur
- All pages get `pt-14` to offset the fixed header

### 2. Page-by-Page Optimizations

#### Dashboard (`/dashboard`)
- Ensure ring chart is centered with adaptive sizing
- Cards with min 44px touch targets
- Generous spacing between sections

#### Meals (`/dashboard/meals`)
- Quick-add pills: smooth horizontal scroll, larger touch areas
- MealCard: bigger tap areas for expand/collapse
- FAB positioned above bottom nav (bottom-24)

#### Workouts (`/dashboard/workouts`)
- Tab switcher with full-width touch areas (min-h-11)
- Calendar with scroll snap
- Exercise cards with proper spacing

#### Stats (`/dashboard/stats`)
- Single column grid on mobile (not 2-col)
- Full-width stat cards for readability
- Charts with adequate fixed height

#### Profile (`/dashboard/profile`)
- Hero avatar section (centered, larger)
- Input fields min-h-12 (48px) for touch
- Sticky save button at bottom
- Collapsible form sections

#### Settings (`/dashboard/settings`)
- Card sections with mobile-friendly spacing
- Touch-friendly toggles and buttons

### 3. Cross-cutting UX Improvements

- All touch targets minimum 44x44px
- All input fields minimum 48px height
- Active states with scale animation feedback
- Consistent `px-4` mobile padding
- Smooth page transitions (already using PageTransition)

## Implementation Approach

1. Create `MobileHeader` component
2. Integrate MobileHeader in dashboard layout
3. Optimize each page sequentially (dashboard → meals → workouts → stats → profile → settings)
4. Validate with build
