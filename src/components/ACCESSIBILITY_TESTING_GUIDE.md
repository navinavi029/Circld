# Accessibility Testing Guide for Multi-Card Swipe Interface

This guide provides instructions for manually testing the accessibility features of the multi-card swipe interface.

## Requirements Coverage

This testing guide validates the following requirements:
- **Requirement 10.1**: Keyboard controls for swiping when card is focused
- **Requirement 10.2**: Left arrow key for "pass" action
- **Requirement 10.3**: Right arrow key for "like" action
- **Requirement 10.4**: Screen reader announcements for swipe actions
- **Requirement 10.5**: Appropriate ARIA labels on all interactive elements

## Keyboard-Only Navigation Testing

### Test 1: Tab Navigation Through Cards

**Steps:**
1. Navigate to the swipe trading page
2. Press `Tab` key repeatedly to move through the interface
3. Verify that focus moves through all interactive elements in logical order:
   - Trade anchor display
   - Tips button
   - Each card in the grid (left to right, top to bottom)
   - Change anchor button (if visible)

**Expected Result:**
- All interactive elements should be reachable via Tab key
- Focus indicator should be clearly visible on each element
- Tab order should follow visual layout

**Status:** ✅ Pass / ❌ Fail

---

### Test 2: Arrow Key Navigation Between Cards

**Steps:**
1. Tab to focus on the first card in the grid
2. Press `Right Arrow` key
3. Verify focus moves to the card on the right
4. Press `Down Arrow` key
5. Verify focus moves to the card below
6. Press `Left Arrow` key
7. Verify focus moves to the card on the left
8. Press `Up Arrow` key
9. Verify focus moves to the card above

**Expected Result:**
- Arrow keys should navigate between cards in a grid pattern
- Focus should not move beyond grid boundaries
- Navigation should work on all viewport sizes (desktop, tablet, mobile)

**Status:** ✅ Pass / ❌ Fail

---

### Test 3: Swipe Actions with Arrow Keys

**Steps:**
1. Tab to focus on any card
2. Press `Right Arrow` key while focused on the card
3. Verify the card swipes right (like action)
4. Tab to focus on another card
5. Press `Left Arrow` key while focused on the card
6. Verify the card swipes left (pass action)

**Expected Result:**
- Right arrow key triggers "like" action (card swipes right)
- Left arrow key triggers "pass" action (card swipes left)
- Card animates off screen smoothly
- New card appears to replace the swiped card

**Status:** ✅ Pass / ❌ Fail

---

### Test 4: Keyboard Navigation in Compact Mode

**Steps:**
1. Resize browser window to tablet size (768-1280px)
2. Repeat Tests 1-3
3. Resize to mobile size (<640px)
4. Repeat Tests 1-3

**Expected Result:**
- All keyboard navigation should work identically across viewport sizes
- Grid navigation should adapt to different column layouts
- Focus indicators should remain visible in compact mode

**Status:** ✅ Pass / ❌ Fail

---

## Screen Reader Testing

### Test 5: Card ARIA Labels

**Screen Reader:** NVDA (Windows) / JAWS (Windows) / VoiceOver (Mac)

**Steps:**
1. Start screen reader
2. Navigate to swipe trading page
3. Tab through cards and listen to announcements

**Expected Announcements:**
- "Card [number] of [total]: [item title] by [owner name], article"
- Example: "Card 1 of 5: Vintage Camera by John Doe, article"

**Status:** ✅ Pass / ❌ Fail

---

### Test 6: Swipe Action Announcements

**Screen Reader:** NVDA (Windows) / JAWS (Windows) / VoiceOver (Mac)

**Steps:**
1. Start screen reader
2. Focus on a card
3. Press `Right Arrow` to swipe right
4. Listen for announcement
5. Focus on another card
6. Press `Left Arrow` to swipe left
7. Listen for announcement

**Expected Announcements:**
- After right swipe: "[Item title] liked. [N] cards remaining."
- After left swipe: "[Item title] passed. [N] cards remaining."
- Example: "Vintage Camera liked. 4 cards remaining."

**Status:** ✅ Pass / ❌ Fail

---

### Test 7: Card Grid ARIA Structure

**Screen Reader:** NVDA (Windows) / JAWS (Windows) / VoiceOver (Mac)

**Steps:**
1. Start screen reader
2. Navigate to the card grid area
3. Listen for group announcement

**Expected Announcement:**
- "Swipeable item cards, group"

**Status:** ✅ Pass / ❌ Fail

---

### Test 8: Interactive Element Labels

**Screen Reader:** NVDA (Windows) / JAWS (Windows) / VoiceOver (Mac)

**Steps:**
1. Start screen reader
2. Navigate through all interactive elements
3. Verify each element has a descriptive label

**Expected Labels:**
- Tips button: "Show tips, button"
- Close tips button: "Close tips, button"
- Change anchor button: "Change Trade Anchor, button"
- Image navigation: "Previous image, button" / "Next image, button"
- Image dots: "Go to image [N], button"

**Status:** ✅ Pass / ❌ Fail

---

### Test 9: Live Region Updates

**Screen Reader:** NVDA (Windows) / JAWS (Windows) / VoiceOver (Mac)

**Steps:**
1. Start screen reader
2. Focus on any element (not a card)
3. Use mouse to swipe a card
4. Listen for announcement without moving focus

**Expected Result:**
- Screen reader should announce swipe action even when focus is elsewhere
- Announcement should be polite (not interrupt current reading)
- Live region should have `aria-live="polite"` and `aria-atomic="true"`

**Status:** ✅ Pass / ❌ Fail

---

### Test 10: Empty State Accessibility

**Screen Reader:** NVDA (Windows) / JAWS (Windows) / VoiceOver (Mac)

**Steps:**
1. Start screen reader
2. Navigate to swipe page with no available items
3. Listen to empty state message
4. Tab to "Change Trade Anchor" button

**Expected Result:**
- Empty state heading and message should be announced
- Button should be keyboard accessible and properly labeled

**Status:** ✅ Pass / ❌ Fail

---

## Visual Accessibility Testing

### Test 11: Focus Indicators

**Steps:**
1. Navigate through interface using Tab key
2. Observe focus indicators on each element

**Expected Result:**
- Focus indicators should be clearly visible
- Indicators should have sufficient contrast (3:1 minimum)
- Indicators should not be obscured by other elements

**Status:** ✅ Pass / ❌ Fail

---

### Test 12: High Contrast Mode

**Steps:**
1. Enable Windows High Contrast mode (or equivalent)
2. Navigate through the interface
3. Verify all elements are visible and usable

**Expected Result:**
- All text should be readable
- All interactive elements should be visible
- Focus indicators should be clearly visible

**Status:** ✅ Pass / ❌ Fail

---

### Test 13: Reduced Motion

**Steps:**
1. Enable "Reduce Motion" in OS settings
2. Navigate to swipe trading page
3. Swipe cards using keyboard or mouse

**Expected Result:**
- Animations should be reduced or removed
- Functionality should remain intact
- No jarring transitions

**Status:** ✅ Pass / ❌ Fail

---

### Test 14: Zoom Level Testing

**Steps:**
1. Set browser zoom to 200%
2. Navigate through the interface
3. Verify all content is accessible

**Expected Result:**
- All content should remain visible
- No horizontal scrolling required
- Text should remain readable
- Interactive elements should remain usable

**Status:** ✅ Pass / ❌ Fail

---

## Mobile Accessibility Testing

### Test 15: Mobile Screen Reader (iOS VoiceOver)

**Steps:**
1. Enable VoiceOver on iOS device
2. Navigate to swipe trading page
3. Swipe through cards using VoiceOver gestures
4. Test swipe actions

**Expected Result:**
- All cards should be announced with proper labels
- Swipe actions should be accessible via VoiceOver
- Custom actions should be available for like/pass

**Status:** ✅ Pass / ❌ Fail

---

### Test 16: Mobile Screen Reader (Android TalkBack)

**Steps:**
1. Enable TalkBack on Android device
2. Navigate to swipe trading page
3. Swipe through cards using TalkBack gestures
4. Test swipe actions

**Expected Result:**
- All cards should be announced with proper labels
- Swipe actions should be accessible via TalkBack
- Custom actions should be available for like/pass

**Status:** ✅ Pass / ❌ Fail

---

## Automated Testing Results

### Unit Tests
- ✅ CardGrid accessibility tests: 7/7 passing
- ✅ SwipeCard accessibility tests: 2/2 passing
- ✅ Total accessibility tests: 9/9 passing

### Test Coverage
- ✅ ARIA labels on card grid
- ✅ ARIA labels on individual cards
- ✅ Keyboard focusability
- ✅ Screen reader announcements for swipe actions
- ✅ Live region for announcements
- ✅ Remaining card count in announcements

---

## Testing Checklist Summary

- [ ] Test 1: Tab Navigation Through Cards
- [ ] Test 2: Arrow Key Navigation Between Cards
- [ ] Test 3: Swipe Actions with Arrow Keys
- [ ] Test 4: Keyboard Navigation in Compact Mode
- [ ] Test 5: Card ARIA Labels
- [ ] Test 6: Swipe Action Announcements
- [ ] Test 7: Card Grid ARIA Structure
- [ ] Test 8: Interactive Element Labels
- [ ] Test 9: Live Region Updates
- [ ] Test 10: Empty State Accessibility
- [ ] Test 11: Focus Indicators
- [ ] Test 12: High Contrast Mode
- [ ] Test 13: Reduced Motion
- [ ] Test 14: Zoom Level Testing
- [ ] Test 15: Mobile Screen Reader (iOS VoiceOver)
- [ ] Test 16: Mobile Screen Reader (Android TalkBack)

---

## Known Issues

None at this time.

---

## Notes

- All automated tests are passing
- Manual testing should be performed by QA team or accessibility specialist
- Screen reader testing requires actual screen reader software
- Mobile testing requires physical devices or emulators with accessibility features enabled

---

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
