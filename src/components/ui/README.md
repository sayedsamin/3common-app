# Shared UI

The app uses a restrained navy/green design with neutral surfaces, consistent light/dark tokens in `src/global.css`, and Inter typography. The sidebar toggle changes the current Uniwind theme; it does not persist a preference.

## Foundation

- Typography: title 24/30, heading 18/24, row title 16/22, body and muted 15/22, label 14/20, caption 12/16. Inputs stay at 16/24. Font scaling remains enabled.
- Spacing follows a 4-point scale. Phone gutters are 16; wider screens use 24. Screen content is centered with a maximum width of 1120; sign-in uses 440.
- Controls have at least 48-point touch targets. Compact size reduces padding without reducing touch targets.
- Neutral surfaces establish hierarchy. Focus and validation add stronger borders. Theme colors belong in semantic tokens, not feature screens.
- Screen uses non-shrinking content for scrolling pages and a bounded flex layout for FlashList. Headers own the top safe area when present.

## Public primitives

Import from `@/components/ui`.

- **Button**: existing variants plus `size="compact" | "default" | "large"`, `leadingIcon`, and `trailingIcon`. Explicit accessible names exclude decorative icons. Disabled/loading prevents activation.
- **IconButton**: required `label` and typed `icon`, optional secondary surface, active state, and loading.
- **Input**: accessible `label`, optional `hideLabel`, `leadingIcon`, and `onClear`/`clearLabel`. Focus, errors, disabled state, and caller event handlers are preserved.
- **SearchInput**: labeled search input with magnifier and clear action. Feature hooks own debounce and fetching.
- **Card**: `variant="surface" | "muted" | "outline"` and `padding="default" | "none"`.
- **Badge**: compact status label with semantic neutral/success/warning/danger/insight treatment.
- **OptionSheet**: controlled `visible`, `title`, `onClose`, optional `footer`, and children. React Native Modal supplies native dismissal and web focus trapping/restoration. Phone sheets align to the bottom; at 768 points they become centered dialogs. Reduced motion disables transition animation.
- **Section**: titled group of fields or content, optionally `collapsible` with `defaultExpanded`.
- **DetailRow**: stacked, full-width labels and selectable values, with long-word wrapping, explicit boolean display, and missing-value fallback. It does not impose minimum column widths.
- **EmptyState**, **ErrorState**, **LoadingState**, and **PlaceholderContent** share theme tokens and typography. Placeholder pages describe their purpose without repeating the navigation title.

## Screen conventions

My Events has one navigation title and a compact search/filter/sort toolbar. Rows use 64-point thumbnails, two-line titles, one-line locations, and short dates; full values remain in details. Pull-to-refresh and backend pagination are preserved.

Event details measure their available content width and split into two explicitly sized columns only at 760 content points or more and a font scale no greater than 1.2. Narrow screens and larger native fonts use full-width sections with natural content height; flex-based height constraints are avoided inside the scroll view. Description, schedule, and location remain expanded; checkout and record metadata are expandable. Invalid images and external URLs retain safe fallbacks.

Native device behavior should still be checked in a running build. Browser screenshots and component tests complement, rather than replace, native checks.
