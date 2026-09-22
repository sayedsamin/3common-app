# 3Common mobile UI

The supplied web palette was visually derived, not an official token export. The dark palette is a mobile adaptation. Colors live exclusively in src/global.css as semantic Uniwind theme variables; no per-screen dark palette is needed. Themes follow the system by default. The home showcase can temporarily override them, without persistence.

## Tokens and typography

Use background, surface, surface-subtle, surface-muted, foreground, body, muted, border, primary/on-primary, accent/on-accent, and the success/warning/danger/insight pairs. The border token is decorative; control-border provides stronger contrast for input/control boundaries. Focus uses a darker accessible green in light mode. Bright emerald buttons use ink text. Danger-accent preserves the supplied coral; danger is the accessible text/button color.

Inter regular, medium, semibold, and bold are bundled by @expo-google-fonts/inter (SIL Open Font License in the package). Expo Font loads these at startup, holding the splash screen until loading finishes or fails. Typography falls back to system fonts on failure. Use Text variants rather than font-bold overrides, since each Inter weight has an explicit family.

| Text variant | Size / line height | Weight |
| --- | --- | --- |
| title | 28 / 34 | bold |
| heading | 22 / 28 | semibold |
| cardTitle | 18 / 24 | semibold |
| body, muted | 16 / 24 | regular |
| label | 14 / 20 | medium |
| caption | 12 / 16 | regular |

Spacing uses 4-point increments. Screen/card padding is 16, section gaps are 24, control radius is 8, and card radius is 12. Text remains scalable; controls use minimum rather than fixed heights. No decorative motion or elevated shadows are required.

## Public components

Import components from @/components/ui.

- Text: native Text props plus variant; className/style overrides remain available.
- Button: label, primary/positive/secondary/ghost/destructive variant, loading, and native Pressable props. Loading and disabled prevent activation. Minimum target is 48 by 48; labels wrap. Keyboard focus and pressed states are visible.
- Input: native TextInput props plus label, helperText, error, disabled. editable=false also disables it. Error text takes precedence over helper text; caller focus/blur/change handlers are preserved. Placeholder and selection colors track theme unless overridden.
- Screen: children, className, scrollable (default true). Use scrollable=false for FlashList so virtualized lists are not nested in ScrollView. Includes safe areas and iOS keyboard avoidance.
- Card: native View props and className; bordered surface with 16-point padding.
- Badge: label and neutral/success/warning/danger/insight variant. Labels carry meaning independently of color.
- Icon: typed MaterialCommunityIcons name, size (default 20), semantic tone, optional accessibilityLabel. Omit the label for decorative icons. Use outline glyphs where available. Wrap actionable icons in a labeled 48-point target.
- EmptyState, ErrorState, LoadingState: shared typography and semantic colors. LoadingState includes a themed activity indicator and busy state.

## Replacing the showcase

HomeScreen in the home module is a temporary review surface, not a product page. Replace its content when the home product feature is ready, retaining the thin route adapter. Remove the appearance preview controls when they are no longer needed; the app will still follow device appearance. No demo controls send requests or write persistent data.

## Validation

Verified TypeScript, lint, 11 component/showcase behavior tests, all 21 Expo Doctor checks,
and Android/iOS/web exports. Browser checks verified live light/dark/system switching,
keyboard focus, editable sample input, no horizontal overflow at 320px, wrapping at
200% text size, Inter loading, and system-font fallback with font downloads blocked.
The documented text/background pairs exceed 4.5:1 contrast in both themes.
Native device font scaling, keyboard behavior, and screen-reader navigation still need
device verification; successful exports are not native runtime tests.

## References

- https://docs.uniwind.dev/theming/global-css
- https://docs.expo.dev/versions/v57.0.0/sdk/font/
