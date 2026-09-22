# 3Common mobile UI

The supplied web palette was visually derived, not an official token export. The dark palette is a mobile adaptation. Colors live exclusively in src/global.css as semantic Uniwind theme variables; no per-screen dark palette is needed. Themes follow the system by default. There is no persisted theme override.

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

## Navigation integration

The previous design showcase has been removed. Home, Profile, AI, Settings, Help, and About are feature-owned placeholders using PlaceholderContent. Screen accepts an edges array; tab pages use left/right edges because their header and bottom bar own the remaining safe areas. Utility pages also retain the bottom edge.

Shared UI behavior tests and router integration tests cover the active app. Browser checks additionally cover drawer dismissal/focus, tab history, direct links, themes, and large text. Native device testing is still required separately from bundle exports.

## References

- https://docs.uniwind.dev/theming/global-css
- https://docs.expo.dev/versions/v57.0.0/sdk/font/
