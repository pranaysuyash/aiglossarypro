# 📋 Phase 1 Testing Checklist

## **🌐 Access the Application**
Open: http://localhost:5173/

## **🎯 1. Dynamic Pricing System Testing**

### **A. Check Current Pricing Phase**
- [ ] Look at the pricing section on the landing page
- [ ] Verify the price displayed matches the current phase:
  - **Beta**: $124 (50% off)
  - **Early**: $162 (35% off) ← Default
  - **Launch**: $199 (20% off)
  - **Regular**: $249 (0% off)

### **B. Verify Phase Details**
- [ ] Check for phase-specific messaging (e.g., "Early bird discount - Limited to first 300 customers")
- [ ] Look for slots remaining counter (e.g., "50/200 claimed")
- [ ] Confirm discount percentage is displayed
- [ ] Verify strikethrough original price ($249)

### **C. Test Phase Switching (Environment Variable)**
1. Stop the dev server (Ctrl+C)
2. Set different phase:
   ```bash
   NEXT_PUBLIC_PRICING_PHASE=beta pnpm dev
   ```
3. Refresh and verify price changes to $124
4. Try other phases: `launch`, `regular`

## **🚪 2. Exit-Intent Popup Testing**

### **A. Desktop Testing**
- [ ] Move mouse to top of browser window (exit motion)
- [ ] Wait 5 seconds after page load before testing
- [ ] Verify popup appears with:
  - [ ] Phase-aware pricing (extra discount)
  - [ ] Countdown timer (for urgency variant)
  - [ ] Proper discount calculation
  - [ ] Working CTA button

### **B. Mobile Testing** 
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select a mobile device
4. Test:
   - [ ] Rapid upward scroll (scroll velocity trigger)
   - [ ] Browser back button
   - [ ] Verify popup is mobile-optimized

### **C. Frequency Capping**
- [ ] Close the popup
- [ ] Try to trigger it again - should NOT appear
- [ ] Check localStorage for `exitIntentShown` timestamp
- [ ] Clear localStorage and verify it works again

### **D. Exit-Intent Pricing Verification**
Check that exit-intent shows extra discount:
- Beta phase: Extra 10% off (total ~60% off)
- Early phase: Extra 15% off (total ~50% off)
- Launch phase: Extra 20% off (total ~40% off)
- Regular phase: 25% off

## **🧪 3. A/B Testing Experiments**

### **A. Check Active Experiments**
Open browser console and run:
```javascript
// Check PostHog is loaded
window.posthog

// Get current experiments
window.posthog.getFeatureFlag('landingPageHeadline')
window.posthog.getFeatureFlag('exitIntentVariant')
window.posthog.getFeatureFlag('pricingDisplay')
window.posthog.getFeatureFlag('socialProofPlacement')
window.posthog.getFeatureFlag('landingPageCTA')
```

### **B. Verify Tracking**
1. Open Network tab in DevTools
2. Filter by "posthog" or "ph"
3. Perform actions:
   - [ ] Page load - should track experiment exposure
   - [ ] Click CTA buttons - should track conversion
   - [ ] Trigger exit-intent - should track variant

### **C. Test Different Variants**
- [ ] Clear cookies/localStorage
- [ ] Reload page multiple times
- [ ] You should see different variants randomly

## **🔌 4. API Endpoints Testing**

### **A. Pricing Phase Status**
```bash
curl http://localhost:3000/api/pricing/phase-status
```
Expected response:
```json
{
  "success": true,
  "data": {
    "currentPhase": "early",
    "totalSales": 0,
    "phaseHistory": {},
    "timestamp": "2025-08-01T..."
  }
}
```

### **B. Sales Count**
```bash
curl http://localhost:3000/api/pricing/sales-count
```

### **C. Manual Phase Setting (Admin)**
```bash
curl -X POST http://localhost:3000/api/pricing/set-phase \
  -H "Content-Type: application/json" \
  -d '{"phase": "launch"}'
```

## **🎨 5. Visual Testing**

### **A. Pricing Display**
- [ ] Original price with strikethrough
- [ ] Current phase price prominently displayed
- [ ] Discount badge/percentage
- [ ] "Lifetime access" messaging
- [ ] Competitor comparison ($300+/year)

### **B. Exit-Intent Popup Design**
- [ ] Centered modal with backdrop
- [ ] Close button (X) in top-right
- [ ] Icon animation (clock, shield, or zap)
- [ ] Clear CTA button
- [ ] Responsive on mobile

### **C. Progress Indicators**
- [ ] Slots remaining counter
- [ ] Progress bar (if implemented)
- [ ] Urgency messaging

## **🐛 6. Edge Cases & Error Handling**

### **A. Phase Transitions**
- [ ] What happens when slots run out?
- [ ] Does it auto-transition to next phase?
- [ ] Error handling for API failures

### **B. Exit-Intent Edge Cases**
- [ ] Multiple rapid mouse movements
- [ ] Page refresh after showing
- [ ] Different browser tabs

### **C. Mobile Specific**
- [ ] iOS safe areas
- [ ] Android back button
- [ ] Touch target sizes (≥44x44px)

## **✅ Testing Summary**

### **Working Features:**
- [ ] Dynamic pricing displays correctly
- [ ] Exit-intent popup triggers properly
- [ ] A/B tests are tracking
- [ ] API endpoints respond
- [ ] Mobile detection works

### **Issues Found:**
1. _List any bugs discovered_
2. _Note any UX improvements needed_
3. _Document any console errors_

### **Performance Notes:**
- Page load time: ___
- Time to interactive: ___
- Any lag or jank: ___

## **🚀 Ready for Production?**

If all tests pass:
1. ✅ Pricing system works perfectly
2. ✅ Exit-intent converts visitors
3. ✅ A/B tests are collecting data
4. ✅ Mobile experience is smooth
5. ✅ No critical errors

**Next Step**: Move to Phase 2 (UI/UX Polish) or deploy to staging!

---

**Testing Date**: ___________
**Tested By**: ___________
**Environment**: Development / Staging / Production