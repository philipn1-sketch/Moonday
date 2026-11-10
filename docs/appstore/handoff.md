# Moonday: steps for a session on Philip's Mac (driving Chrome)

The code is finished and on main. These steps need Philip's signed in accounts, so they run in a
Claude session on his Mac with Chrome. Do them in order. Do not touch anything belonging to QuickQuote
beyond what is listed.

## 1. GitHub Pages (privacy and support site)
1. github.com/philipn1-sketch/Moonday, Settings, General. If the repo is private, make it public
   (Danger Zone, Change visibility). Nuzzle was done the same way.
2. Settings, Pages, Source: GitHub Actions.
3. Actions tab, workflow "Website", Run workflow on main. Check
   https://philipn1-sketch.github.io/Moonday/privacy/ and /support/ load.

## 2. Supabase database
1. supabase.com, project dfpfjivvcqxrjeolkhpo (shared with Nuzzle), SQL Editor.
2. Paste all of supabase/migrations/20261110000000_moonday_vault.sql and Run. Expect Success.
   It only adds the moonday_vaults table and the moonday_get, moonday_put and moonday_delete functions.

## 3. Apple Developer (developer.apple.com, team 9QLBWXC74X)
1. Identifiers, App Groups: add group.com.quickquotegroup.moonday.
2. Identifiers, App IDs: com.philipnader.moonday with HealthKit and App Groups (the group above) on.
   Also com.philipnader.moonday.widgets and com.philipnader.moonday.watch, each with App Groups on.

## 4. App Store Connect (appstoreconnect.apple.com)
1. Apps, New App: iOS, name "Moonday: Period Tracker", primary language English (Australia),
   bundle ID com.philipnader.moonday, SKU moonday.
2. Monetization, In App Purchases:
   * Non consumable, Moonday Plus for Life, com.philipnader.moonday.plus.lifetime, A$14.99, Family Sharing on.
3. Subscriptions: group "Moonday Plus", auto renewable, Moonday Plus Monthly,
   com.philipnader.moonday.plus.monthly, one month, A$2.99, Family Sharing on.
4. App information and the version page: paste from docs/appstore/listing.md for each language
   (name, subtitle, promotional text, keywords, description, URLs, category, age rating, review notes,
   App Privacy: Data Not Collected).
5. Screenshots: docs/appstore/screenshots/<language>/01.jpg to 06.jpg, for the 6.9 inch iPhone.

## 5. Build and upload
In the Moonday folder: npm ci, npx expo prebuild --platform ios, open ios/Moonday.xcworkspace,
select the team, Product, Archive, Distribute to App Store Connect. Then add the build to the version
and Submit for Review.
