# Mystic Garden Pro - Monetization Strategy

## Revenue Streams

### 1. In-App Purchases (Primary Revenue)
Our core monetization model with 6 carefully designed products:

#### Gem Packs
- **100 Gems** ($0.99) - Entry-level impulse purchase
  - Target: 30% conversion rate
  - Expected ARPPU: $0.99
  
- **550 Gems** ($4.99) - Best value ratio (5.5 gems/$)
  - Target: 50% of gem purchases
  - Expected ARPPU: $4.99
  
- **1200 Gems** ($9.99) - Whale-tier offering
  - Target: 20% of gem purchases
  - Expected ARPPU: $9.99

#### Lives & Boosters
- **Unlimited Lives (1h)** ($1.99)
  - Frustration-based conversion
  - Expected purchase when users stuck on hard levels
  - Target: 10% conversion on level failures
  
- **Starter Pack** ($2.99) - 60% OFF value bundle
  - First-time buyer incentive
  - Contains: 200 gems + 5 lives + 3 power-ups
  - Target: 15% of new users within first 3 days

#### Subscription
- **Garden Pass Monthly** ($9.99/month)
  - Daily rewards: 50 gems
  - Monthly value: 1500 gems ($15 retail value)
  - Target: 5% of active users
  - Retention boost: +40% D30 retention

## Projected Revenue (Year 1)

### Conservative Estimates
- DAU: 10,000 (avg)
- Paying users: 3% = 300/day
- ARPPU: $5.50
- Daily revenue: $1,650
- **Monthly revenue: ~$50,000**
- **Annual revenue: ~$600,000**

### Optimistic Scenario
- DAU: 50,000 (after marketing)
- Paying users: 5% = 2,500/day
- ARPPU: $7.00
- Daily revenue: $17,500
- **Monthly revenue: ~$525,000**
- **Annual revenue: ~$6,300,000**

## Ad Monetization (Secondary)

### Rewarded Video Ads
- **Use cases:**
  - Continue after level failure (no lives)
  - Get +1 life when at 0 lives
  - Double level rewards
  
- **Expected metrics:**
  - 60% of users will watch ads
  - 5 ads per user per day (avg)
  - eCPM: $15
  - Daily ad revenue (10k DAU): $750
  - **Monthly ad revenue: ~$22,500**

### Interstitial Ads (Optional)
- Show after every 3 levels completed
- Frequency cap: max 1 per 5 minutes
- eCPM: $8
- Expected additional revenue: +30%

## Implementation Roadmap

### Phase 1: Setup (Week 1-2)
1. Integrate Google Play Billing Library
   ```bash
   npm install @capacitor/google-play-billing
   ```
2. Configure products in Google Play Console
3. Implement purchase flow with receipt validation
4. Test with Google Play sandbox accounts

### Phase 2: Ad Integration (Week 3-4)
1. Integrate AdMob SDK
   ```bash
   npm install @capacitor-community/admob
   ```
2. Create ad units in AdMob dashboard:
   - Rewarded Video: `ca-app-pub-XXXXX/YYYYY1`
   - Interstitial: `ca-app-pub-XXXXX/YYYYY2`
3. Implement ad loading/showing logic
4. Add frequency capping

### Phase 3: Analytics (Week 5)
1. Firebase Analytics integration
2. Track key events:
   - `purchase_initiated`
   - `purchase_completed`
   - `ad_watched`
   - `level_completed`
   - `level_failed`
3. Set up conversion funnels
4. A/B test pricing

## Conversion Optimization

### Psychology Tactics
1. **Scarcity**: Limited-time offers (48h starter pack)
2. **Value perception**: Show "60% OFF" badges
3. **Loss aversion**: "Continue with ad" vs "Give up"
4. **Progress investment**: Players more likely to pay after level 10
5. **Social proof**: "Join 50k players with Garden Pass"

### Price Points by Region
- **Tier 1** (US, UK, CA, AU): Full price
- **Tier 2** (EU, JP, KR): -10%
- **Tier 3** (BR, MX, IN): -40%

Use Google Play pricing templates for automatic localization.

## Key Metrics to Track

### Acquisition
- CPI (Cost Per Install): Target <$0.50
- Install to Registration: >80%

### Engagement
- D1 Retention: >40%
- D7 Retention: >20%
- D30 Retention: >10%
- Session Length: >8 minutes
- Sessions/day: >3

### Monetization
- Paying User Rate: 3-5%
- ARPPU: $5-10
- ARPU: $0.15-0.50
- LTV (90 days): $1.50-3.00

### Ad Performance
- Ad Fill Rate: >95%
- Ad Watch Rate: >60%
- eCPM: >$12

## Next Steps

1. ✅ Complete game mechanics
2. ⏳ Set up Google Play Console
3. ⏳ Configure In-App Products
4. ⏳ Integrate billing library
5. ⏳ Add AdMob
6. ⏳ Implement analytics
7. ⏳ Soft launch (1 country)
8. ⏳ Optimize based on data
9. ⏳ Global launch

## Legal Requirements

- [ ] Privacy Policy (GDPR compliant)
- [ ] Terms of Service
- [ ] Age gate (COPPA compliance)
- [ ] Parental gate for purchases
- [ ] Refund policy
- [ ] Data retention policy

## Resources

- [Google Play Billing Library](https://developer.android.com/google/play/billing)
- [AdMob Best Practices](https://admob.google.com/home/resources/)
- [Firebase Analytics](https://firebase.google.com/products/analytics)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
