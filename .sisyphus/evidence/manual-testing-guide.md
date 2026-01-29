# Manual Testing Guide for Lettura v0.1.22+

## 📋 Overview

This document provides step-by-step testing instructions for all new features implemented in the improvement plan.

**Total Manual Tests:** 2 remaining
1. All features tested manually
2. Ready for public release

---

## 🚀 Phase 1: Performance Testing

### Test 1.1: Virtual Scrolling Performance
**Goal:** Verify article lists handle 1000+ articles smoothly

**Steps:**
1. Start development server: `pnpm tauri dev`
2. Open a feed with 1000+ articles (or add test data)
3. Open DevTools Performance tab
4. Scroll through article list
5. Record metrics:
   - Initial render time (should be < 200ms)
   - FPS while scrolling (should be 60fps)
   - Memory usage before/after scrolling
6. Check for:
   - Smooth scrolling with no jank
   - Only visible items rendered (check Elements tab)
   - Virtual list working (see `data-virtual-item` attributes)

**Expected Results:**
- ✅ Initial render < 200ms
- ✅ Smooth scrolling at 60fps
- ✅ Only ~20 items rendered in DOM (virtualization working)
- ✅ Memory usage stable (no leaks)

**If Fails:**
- Check console for errors
- Verify ArticleListVirtual component is being used
- Check @tanstack/react-virtual version (should be 3.13.13+)

---

### Test 1.2: Image Lazy Loading
**Goal:** Verify images load lazily with placeholders

**Steps:**
1. Open an article with multiple embedded images
2. Open DevTools Network tab
3. Scroll through article
4. Observe:
   - Images show placeholder (gradient skeleton) initially
   - Images fade in (300ms transition) when entering viewport
   - Images load only when scrolled into view (10% threshold)
   - Broken images show fallback UI

**Expected Results:**
- ✅ All images start with placeholder
- ✅ Images load progressively as scrolling
- ✅ No blank spaces during loading
- ✅ Broken images show error fallback

**If Fails:**
- Check console for Intersection Observer errors
- Verify ImageLazyLoad component is being used
- Check react-intersection-observer version (should be 10.0.2+)

---

### Test 1.3: Database Query Performance
**Goal:** Verify database queries use indexes

**Steps:**
1. Enable SQLite query logging (if available)
2. Open DevTools Network tab
3. Perform operations:
   - Load article list (filter by unread)
   - Load articles from specific feed
   - Sort articles by date
4. Check query plans (if backend logging available)

**Expected Results:**
- ✅ Queries use indexes (no table scans)
- ✅ Filter by read_status uses idx_articles_read_status
- ✅ Filter by feed uses idx_articles_feed_uuid
- ✅ Sort by pub_date uses idx_articles_pub_date

**If Fails:**
- Run: `sqlite3 ~/lettura.db "EXPLAIN QUERY PLAN SELECT ..."`
- Verify indexes exist: `sqlite3 ~/lettura.db "PRAGMA index_list('articles');"`

---

## 🧪 Phase 2: Feature Testing

### Test 2.1: Auto-Sync Scheduler
**Goal:** Verify auto-sync scheduler runs in background

**Steps:**
1. Open Settings > General
2. Set sync interval to 5 minutes (for testing)
3. Start the scheduler (if UI control available)
4. Wait 5 minutes
5. Check that feeds were updated
6. Check console for scheduler logs
7. Stop the scheduler
8. Manually sync a feed to compare

**Expected Results:**
- ✅ Scheduler starts without errors
- ✅ Feeds auto-sync every 5 minutes
- ✅ Failed feeds use exponential backoff
- ✅ Scheduler can be started/stopped
- ✅ Console shows sync logs

**If Fails:**
- Check Rust backend logs in terminal
- Verify scheduler.rs was compiled
- Check Tauri commands: start_scheduler, stop_scheduler, is_scheduler_running
- Verify update_interval config value

---

### Test 2.2: OPML Import/Export
**Goal:** Verify OPML export generates valid XML and import creates feeds/folders

**Export Test:**
1. Open Settings > ImportAndExport
2. Click "Export OPML" button
3. Select save location
4. Open exported OPML file
5. Verify XML structure:
   ```xml
   <opml version="2.0">
     <head><title>Lettura Subscriptions</title></head>
     <body>
       <outline type="folder">
         <outline type="rss" xmlUrl="..." text="..."/>
       </outline>
     </body>
   </opml>
   ```

**Import Test:**
1. Clear some feeds (to test import)
2. Click "Import OPML" button
3. Select previously exported OPML file
4. Verify:
   - All folders created
   - All feeds created
   - Feeds correctly associated with folders
   - Import statistics shown (feeds created, folders created, failed imports)

**Expected Results:**
- ✅ Export generates valid OPML XML
- ✅ File dialog opens cross-platform
- ✅ Import creates feeds and folders correctly
- ✅ Import shows detailed statistics
- ✅ Toast notifications for success/failure

**If Fails:**
- Check console for XML parsing errors
- Verify Tauri commands: export_opml, import_opml
- Check dataAgent.ts: OpmlImportResult interface
- Verify OPML XML structure

---

### Test 2.3: Advanced Search Filters
**Goal:** Verify search supports date, feed, and advanced syntax filters

**Date Filter Test:**
1. Open Search page
2. Click filter toggle button
3. Set date range: Start date and End date
4. Enter search query
5. Verify results filtered by date range

**Feed Filter Test:**
1. Open Search page
2. Click filter toggle button
3. Select specific feed from dropdown
4. Enter search query
5. Verify results filtered by feed

**Advanced Syntax Test:**
1. Test exact phrase: `"react hooks"`
2. Test AND: `react AND hooks`
3. Test OR: `react OR hooks`
4. Test NOT: `react NOT hooks`
5. Verify each operator works correctly

**Filter Chips Test:**
1. Apply multiple filters (date + feed)
2. Verify filter chips show
3. Click X on individual chip to remove
4. Click "Clear filters" to reset all

**Expected Results:**
- ✅ Date filter works (start_date, end_date)
- ✅ Feed filter works (feed_uuid)
- ✅ Advanced syntax works (AND, OR, NOT, exact phrase)
- ✅ Filter chips display active filters
- ✅ Individual remove buttons work
- ✅ Clear filters button works
- ✅ Filter metadata shows above results

**If Fails:**
- Check Search page console for errors
- Verify backend /api/search endpoint accepts filter parameters
- Check src/layout/Search/index.tsx for filter UI
- Verify global_search() in src-tauri/src/core/common.rs

---

## 🔔 Phase 3: Error Handling Testing

### Test 3.1: Error Notifications
**Goal:** Verify all error paths show user notifications

**Network Error Test:**
1. Disconnect from internet
2. Try to sync feeds
3. Verify toast notification appears with user-friendly message

**Sync Failure Test:**
1. Add invalid feed URL
2. Try to sync
3. Verify error toast shows

**Validation Error Test:**
1. Add feed with missing required fields
2. Try to subscribe
3. Verify validation error shows

**Other Error Paths:**
1. Test each API call scenario:
   - Search with no results
   - Add folder with duplicate name
   - Delete non-existent feed
   - Update article read status
   - OPML import with invalid XML

**Expected Results:**
- ✅ All errors show toast notifications
- ✅ Error messages are user-friendly (no technical details)
- ✅ Console still logs errors for debugging
- ✅ Sonner Toaster is visible and styled correctly
- ✅ Toast auto-dismisses after reasonable time

**If Fails:**
- Check src/helpers/errorHandler.ts for all API calls
- Verify showErrorToast() is being called
- Check Toaster component in App.tsx is uncommented
- Check console for errors

---

## 📏 Phase 4: Production Build Test

### Test 4.1: Production Build
**Goal:** Verify app builds successfully for production

**Steps:**
1. Stop development server
2. Run production build: `pnpm tauri build`
3. Wait for build to complete
4. Check for build errors
5. Navigate to build output directory
6. Verify app bundle created

**Expected Results:**
- ✅ Build completes without errors
- ✅ App bundle created in `src-tauri/target/release/`
- ✅ No TypeScript errors during build
- ✅ No Rust errors during build
- ✅ App can be launched from build output

**If Fails:**
- Check terminal for specific error messages
- Run `tsc --noEmit` to check TypeScript errors
- Run `cd src-tauri && cargo build` to check Rust errors
- Verify all dependencies are installed

---

## ✅ Test Completion Checklist

After completing all manual tests, check:

**Phase 1 - Performance:**
- [ ] Article lists handle 1000+ articles smoothly
- [ ] Images load lazily with placeholders
- [ ] Database queries use indexes
- [ ] No noticeable lag when scrolling

**Phase 2 - Features:**
- [ ] Auto-sync scheduler runs in background
- [ ] OPML export generates valid XML
- [ ] OPML import creates feeds and folders
- [ ] Search supports date and feed filters
- [ ] Advanced search syntax works
- [ ] Filter chips work correctly

**Phase 3 - Error Handling:**
- [ ] All error paths show notifications
- [ ] Error messages are user-friendly
- [ ] Toaster displays correctly

**Phase 4 - Production:**
- [ ] App builds successfully
- [ ] No build errors
- [ ] App launches from build output

**Final Sign-off:**
- [ ] All manual tests passed
- [ ] Ready for public release

---

## 📝 Test Results Template

```markdown
## Test Results - [Date]

### Phase 1: Performance
- Test 1.1 (Virtual Scrolling): PASS / FAIL - Notes: ...
- Test 1.2 (Image Lazy Loading): PASS / FAIL - Notes: ...
- Test 1.3 (Database Performance): PASS / FAIL - Notes: ...

### Phase 2: Features
- Test 2.1 (Auto-Sync Scheduler): PASS / FAIL - Notes: ...
- Test 2.2 (OPML Import/Export): PASS / FAIL - Notes: ...
- Test 2.3 (Advanced Search): PASS / FAIL - Notes: ...

### Phase 3: Error Handling
- Test 3.1 (Error Notifications): PASS / FAIL - Notes: ...

### Phase 4: Production
- Test 4.1 (Production Build): PASS / FAIL - Notes: ...

### Summary
- Total Tests: X / Y passed
- Blocking Issues: [list]
- Ready for Release: YES / NO
```

---

## 🎯 Next Steps After Testing

1. **If All Tests Pass:**
   - Update plan file: mark "All features tested manually" as [x]
   - Update plan file: mark "Ready for public release" as [x]
   - Create release notes
   - Tag version for release

2. **If Tests Fail:**
   - Document failures in .sisyphus/notepads/lettura-improvement/issues.md
   - Fix issues and re-test
   - Mark fixed issues as resolved

---

## 📚 References

- Performance testing: https://web.dev/performance/
- Tauri build: https://tauri.app/v1/guides/building/
- Manual testing guide: https://www.guru99.com/software-testing/manual-testing-guide
- OPML specification: http://dev.opml.org/spec2.html
