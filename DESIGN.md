# DESIGN.md - Personal Finance Dashboard (Revolut & Stripe Inspired)

> Design System specification for AI coding agents and frontend implementation.
> Inspired by the precision, typography, and visual hierarchy of **Revolut** and **Stripe**.

---

## 1. Brand & Design Philosophy
- **Core Character**: Premium Digital Banking & Fintech Precision.
- **Visual Rhythm**: High breathing room, crisp 1px hairline borders, generous white space, and authoritative data hierarchy.
- **Density**: High clarity with balanced density; data points feel grounded, not crowded.

---

## 2. Design Tokens

### 2.1 Color Palette
- **Canvas Base**: `#F8FAFC` (Slate 50, crisp clean backdrop)
- **Card Surface**: `#FFFFFF` (Pure white) with 1px hairline border `rgba(226, 232, 240, 0.85)`
- **Ink Primary**: `#0F172A` (Slate 900 - high contrast, authoritative)
- **Ink Secondary**: `#475569` (Slate 600 - clear readability)
- **Ink Muted / Captions**: `#94A3B8` (Slate 400 - secondary cues)
- **Brand Accents**:
  - **Teal Emerald (Primary Active)**: `#0D9488` / `#00A87E`
  - **Cobalt Violet (Secondary Accent)**: `#4F46E5` / `#494FDF`
  - **Amber Warning (Large Expenses)**: `#F59E0B`
  - **Rose Negative (Expense Delta)**: `#E11D48`
  - **Emerald Positive (Savings Delta)**: `#059669`

### 2.2 Category Color Mapping
- **生活 (Life)**: `#0D9488` (Teal)
- **雜支 (Misc)**: `#64748B` (Slate)
- **娛樂 (Entertainment)**: `#F59E0B` (Amber)
- **家用 (Home)**: `#2563EB` (Royal Blue)
- **社交 (Social)**: `#EC4899` (Hot Pink)

### 2.3 Typography
- **Primary Font**: `Plus Jakarta Sans`, `Inter`, system-ui
- **Number Treatment**: `tabular-nums` (`font-variant-numeric: tabular-nums`) for jitter-free alignment.
- **Tracking**:
  - Display Numbers: `-0.03em` (`tracking-tight`)
  - Headings: `-0.015em`
  - Labels & Eyebrows: `0.05em` (`tracking-wider`, uppercase)

### 2.4 Surface & Elevation
- **Card Shadow**: `0 1px 3px 0 rgba(0,0,0,0.03), 0 6px 16px -4px rgba(15,23,42,0.04)`
- **Hover Elevation**: `0 8px 24px -4px rgba(15,23,42,0.08), 0 2px 6px -1px rgba(0,0,0,0.02)`
- **Border**: `1px solid rgba(226, 232, 240, 0.9)`
- **Border Radius**:
  - Metric Cards: `24px` (`rounded-3xl`)
  - Container / Charts: `24px` (`rounded-3xl`)
  - Pills & Badges: `9999px` (`rounded-full`)
  - Buttons & Inputs: `12px` (`rounded-xl`)

---

## 3. Micro-interactions
- **Active state**: `active:scale-[0.98]` on buttons and actionable cards.
- **Live Beacon**: Pulsing green dot with `box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2)`.
- **Chart Tooltip**: Glassmorphism (`backdrop-blur-md bg-slate-900/90 text-white border border-white/10 rounded-2xl`).
