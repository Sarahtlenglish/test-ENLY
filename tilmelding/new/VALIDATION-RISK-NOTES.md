## Validation & Flow Risk Notes (frontend JS)

This checklist summarizes places in our JS that can influence step order, validation gating, or UI state and could cause users to be sent back to earlier steps or see missing cards.

1) `updateNextButtonState` (tilmelding/new/fastpris-flow.js)  
   - We recently simplified it to always enable the Next button (except special-case electrical/gas visibility). This reduces frontend gating; server now decides. Residual risk is low, but any future reintroduction of client-side disabling can reintroduce “stuck” states.

2) `group:loaded`-dependent initializers (fastpris-flow.js)  
   - Situation cards, gas cards, add-on organization, payment click tracking all initialize on `group:loaded`. If this event is not fired after HTML changes (e.g., server 422 reloads), UI widgets may not appear. Mitigation: we added a MutationObserver on `#group-container` for situation cards; similar patterns could be needed for other widgets if they ever fail to render after 422.

3) Hidden input toggling for electrical product (fastpris-flow.js)  
   - We disable all hidden electrical product inputs by default and re-enable the selected one. If the selection is not restored after a server roundtrip, the hidden input might remain disabled, potentially affecting server payload. Current logic re-enables on selection; ensure persisted selections are reapplied on load.

4) Add-on products converted to radios (fastpris-flow.js)  
   - We convert checkboxes to radios (`prospect[product_options_radio]`). This changes the form shape; if the server still expects the original checkbox array, it could reject or misinterpret the payload. Verify server accepts the radio name/value shape.

5) Auto-advance / hiding Next on gas step (fastpris-flow.js)  
   - Gas step hides Next and programmatically clicks it. If a required gas selection isn’t made or the server expects a different field name, the step could reappear or fail, possibly sending the user back.

6) Situation selector re-init (fastpris-flow.js)  
   - Cards rely on `initSituationSelector`; if DOM updates without mutation being observed, cards may disappear. We added a MutationObserver for situation. Other steps without observers could suffer similar issues if their DOM is replaced by server HTML after a 422.

7) Payment method click handling (fastpris-flow.js)  
   - We hide original inputs and drive selection by card clicks. If the selected input is not checked when the form posts, server validation may fail and push user back. Ensure the input remains checked after any re-render.

8) Price-card / localStorage selection (fastpris-flow.js)  
   - We store selected product in localStorage and rehydrate price card/summary. If the stored selection conflicts with server state, it shouldn’t break validation, but could show mismatched UI until server returns an error.

9) Event dispatch assumptions  
   - Many parts rely on `group:loaded` and `group:completed`. If server returns HTML without firing these, UI may not fully init. MutationObserver mitigates some of this but not all components.

10) No client-side validation gate now  
    - Because we relaxed client-side gating, server is authoritative. Any server-required fields (CPR, permissions, payment fields) must be present and correctly named; verify that our JS does not rename/remove required inputs unintentionally (see add-ons radios and payment inputs).

### Suggested minimal debug hooks (temporary)
- Add a fetch wrapper to log 422 responses (URL + response text) to identify exactly which field/group the server rejects. Remove after diagnosis.









