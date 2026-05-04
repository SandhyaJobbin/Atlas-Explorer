# Map Explorer UI Redesign Plan

This plan addresses three key UI/UX improvements for the Map Explorer (Zone 1):

1. **Zone 1 Intro Screen:** Add a playful introduction screen before jumping directly into the map.
2. **Scrollable/Stretchable Map:** Update the map container to allow scrolling/panning within a defined window, removing the strict fit-to-width limitation.
3. **Floating State Card:** Remove the fixed right sidebar and instead display the state information as a floating, dismissible card over the map when a region is clicked.

## User Review Required

> [!IMPORTANT]
> - Since we are avoiding new heavy libraries (sticking to the vanilla CSS/JS constraint), the "scrollable/stretchable" map will be implemented using a CSS `overflow: auto` container with a larger minimum width for the SVG map, allowing standard scrollbars or touch panning. Is this acceptable, or did you want a full drag-to-pan implementation (which might require custom JS logic)?
> - For the Zone 1 Intro, I will create a simple overlay with a "Start Mission" button, utilizing the `travel-stickers.png` or other existing assets for decoration. Let me know if you have specific assets in mind for this intro.

## Proposed Changes

### UI Components

#### [MODIFY] MapExplorerPage.tsx
- **Add Intro State:** Introduce a `hasStarted` boolean state. If false, display an engaging "Zone 1: Map Explorer" intro screen with a "Start" button.
- **Remove Sidebar:** Delete the right-side layout (`w-full lg:w-80`) containing the `StateInfoPanel`.
- **Add Floating Modal:** Render `StateInfoPanel` inside a dismissible floating card positioned over the map when a state is selected.

#### [MODIFY] InteractiveMap.tsx
- **Scrollable Container:** Change the wrapper classes from `overflow-hidden` to `overflow-auto`.
- **Stretchable Map:** Update the `[&_svg]` styles to have a `min-width` (e.g., `min-w-[800px]` or `1200px`) so that it overflows and becomes scrollable within its defined container, rather than strictly shrinking to fit.

#### [MODIFY] StateInfoPanel.tsx
- **Refactor for Modal Use:** Adjust the layout to work as a floating card (e.g., adding a close 'X' button, rounded corners, shadow).
- **Remove Placeholder State:** Since the card will only render when a state is selected, remove the "Click a state or province on the map" placeholder text.

## Verification Plan

### Automated Tests
- Build the app to ensure no TypeScript errors (`npm run build`).

### Manual Verification
- **Intro Screen:** Verify that visiting `/train` or Zone 1 first shows the new Intro screen.
- **Map Interaction:** Verify that clicking "Start" dismisses the intro, and the map can be scrolled horizontally and vertically on smaller screens.
- **Popup Card:** Click on a state and verify the floating card appears instead of a sidebar. Check that clicking the "Close" button on the card hides it.
