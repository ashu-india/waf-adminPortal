# WAF Admin Dashboard Design Guidelines

## Design Approach
**System**: Carbon Design System (IBM) - Enterprise-grade data application framework
**Rationale**: Purpose-built for data-dense enterprise applications with proven patterns for complex information hierarchies, real-time monitoring, and security interfaces.

## Layout Architecture

**Shell Structure**:
- Fixed left sidebar (256px) with collapsible option to 48px icon-only mode
- Top header bar (48px) spanning full width for global context
- Main content area with scrollable panels
- Use Carbon's grid system: 16-column layout with 16px gutters

**Spacing System**:
Tailwind units: 2, 4, 6, 8, 12, 16 (p-4, m-8, gap-6, etc.)
Section padding: py-8 px-6 for main content containers
Card spacing: p-6 for card interiors, gap-6 between cards

## Typography Hierarchy

**Fonts**: IBM Plex Sans (primary), IBM Plex Mono (code/data)
- Page titles: text-2xl font-semibold (32px)
- Section headers: text-xl font-medium (24px)
- Card titles: text-lg font-medium (20px)
- Body text: text-base (16px)
- Labels/metadata: text-sm (14px)
- Metrics/data: text-sm font-mono for numbers

## Component Library

**Navigation**:
- Sidebar: Tenant switcher at top (dropdown with org icons), main navigation with icons, collapsed state shows only icons with tooltips
- Top header: Breadcrumbs (left), real-time status indicator (center), user profile + notifications (right)

**Dashboard Cards** (primary content unit):
- Outlined cards with subtle borders
- Card header: Title + action menu (3-dot)
- Card body: Data visualization or table
- Card footer: Metadata (last updated, refresh controls)
- Heights: Auto-fit content, min-h-64 for visualization cards

**Data Visualization Components**:
- Traffic overview: Line chart (requests/sec over time) with gradient fill
- Security events: Stacked bar chart showing threat types
- Geographic heatmap: World map with hotspot indicators
- Real-time feed: Scrolling log with severity color coding
- Policy status: Donut charts showing active/inactive rules
- Top attacks: Horizontal bar chart with threat counts

**Tables**:
- Sticky headers with sort indicators
- Row actions on hover (view, edit, disable)
- Expandable rows for detailed policy rules
- Pagination with items-per-page selector
- Density toggle (compact/regular/comfortable)

**Forms & Inputs**:
- Policy editor: Multi-step wizard with progress indicator
- Rule builder: Tag-based condition builder with AND/OR logic
- Inline editing for quick policy adjustments
- Validation states with icon indicators

**Status Indicators**:
- Real-time pulse animation for live data
- Health badges: Critical (red), Warning (amber), Healthy (green), Info (blue)
- Severity levels for security events with consistent color coding

**Modals & Overlays**:
- Policy detail drawer (slides from right, 480px width)
- Confirmation dialogs for destructive actions
- Toast notifications (top-right) for system messages

## Dark Mode Specifications

**Background Layers**:
- Base: bg-gray-950
- Elevated cards: bg-gray-900 with border-gray-800
- Header/sidebar: bg-gray-900

**Text Hierarchy**:
- Primary: text-gray-100
- Secondary: text-gray-400
- Disabled: text-gray-600

**Interactive Elements**:
- Primary buttons: bg-blue-600 hover:bg-blue-500
- Borders: border-gray-800
- Focus rings: ring-blue-500

**Data Visualization Colors** (dark-optimized):
- Success metrics: Emerald scale (emerald-400 to emerald-600)
- Warning/anomalies: Amber scale
- Critical threats: Red scale
- Info/neutral: Blue scale
- Multi-series charts: Use distinct hues with sufficient contrast

## Page Layouts

**Overview Dashboard**:
Grid: 3 columns on desktop, 1 on mobile
Row 1: KPI cards (4 metrics: Total Requests, Blocked Threats, Active Policies, Uptime)
Row 2: Traffic chart (full width)
Row 3: Security events chart (2/3) + Real-time feed (1/3)
Row 4: Geographic distribution map (full width)

**Policy Management**:
Left panel (1/3): Policy list with search/filter
Right panel (2/3): Selected policy details with rule table and configuration

**Traffic Monitoring**:
Top: Time range selector + filters
Main: Large real-time line chart with scrubber
Bottom: Request detail table with expandable rows

**Tenant Switcher**:
Dropdown showing organization name, logo placeholder, member count
Quick switch between tenants with recent list

## Icons
Use Carbon Design Icons via CDN (official icon set)
Consistent 20px size for navigation, 16px for inline elements

## Images
**No hero images** - Dashboard prioritizes immediate data access
**Use cases**:
- Empty states: Illustrative SVGs for "No policies configured" or "No threats detected"
- Onboarding: Tutorial screenshots for first-time setup
- Org logos: 32px circular avatars in tenant switcher

## Animation Guidelines
**Real-time updates**: Subtle fade-in for new log entries (200ms)
**Loading states**: Skeleton screens for card content, linear progress bars
**Transitions**: Drawer slide (300ms ease-out), modal fade (200ms)
**Avoid**: Flashy effects - maintain professional, focused experience