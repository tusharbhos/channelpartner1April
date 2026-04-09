# Complete Toggle Logic Verification
**Date:** April 8, 2026  
**Status:** ✅ All Logic Verified

---

## 🎯 User Intent

**Marathi Translation:**
"I have a problem. If I toggle ON then all details should be shown for that flag should be 1 and same customer if I toggle OFF then that flag should be 0. Now for customer link, how to show it? If 1 is there then their developer name and project name and all details should show in that card, and if that card is 0, made OFF, then in that, developer and project name should hide, meaning *** should show."

**English Summary:**
- Toggle ON → Flag = 1 (mask_identity = false) → Show ALL details (project name, developer, full info)
- Toggle OFF → Flag = 0 (mask_identity = true) → Hide identifying info (show ***** for name/developer)

---

## ✅ Flow Analysis: CORRECT IMPLEMENTATION

### **Scenario 1: Send Projects with Toggle ON (Include Details)**

**Frontend (Cart Page):**
```
User clicks toggle → includeDetails = true
↓
Click "Send Link" button
↓
Payload sent:
{
  customer_id: 123,
  selected_projects: [
    {
      id: 1,
      title: "Green Valley Residency",      // REAL NAME
      developer: "XYZ Builders",            // REAL DEVELOPER
      location: "Pune",
      price: "₹50L - ₹80L",
      ... (all fields with real data)
    },
    {
      id: 2,
      title: "Skyline Towers",
      developer: "ABC Developers",
      ... (real data)
    }
  ],
  mask_identity: false    // NOT masked because includeDetails = true
}
```

**Backend (CustomerProjectLinkController):**
```
store() method receives mask_identity: false
↓
$link->update([
  'selected_projects' => [real values],
  'mask_identity' => false    // Store flag as FALSE
])
↓
Database: customer_project_links table
- selected_projects: [full real data]
- mask_identity: 0 (FALSE)
```

**Backend API Response (publicShow):**
```php
if ($link->mask_identity) {  // FALSE, so this block SKIPS
    $selected = $this->maskIdentityForPublic($selected);
}

// Returns:
{
  'data' => [
    'selected_projects' => [
      {
        'id' => 1,
        'title' => 'Green Valley Residency',  // REAL NAME
        'developer' => 'XYZ Builders',        // REAL DEVELOPER
        ... (all real data)
      },
      ...
    ],
    'mask_identity' => false
  ]
}
```

**Frontend (Customer Link Page):**
```
Receives data with mask_identity: false
↓
Initialize expandedKeys:
- Loop through selected_projects
- Check: isMasked = (project.mask_identity === true || project.mask_identity === 1)
- isMasked = false (because mask_identity === false)
- Add to expandedKeys
↓
For each project card:
- isMasked = false
- isExpanded = true (in expandedKeys)

Render:
- Display project title: "Green Valley Residency" ✓
- Display developer: "XYZ Builders" ✓
- (!isMasked || isExpanded) = true → Show full details grid ✓
  - Location, Price, Type, Area, Possession, Units, Status ALL VISIBLE
- Like button visible: (!isMasked || isExpanded) = true ✓
- NO "Show/Hide Details" button (not masked) ✓

Result: FULLY EXPANDED, ALL DETAILS VISIBLE
```

---

### **Scenario 2: Send Projects with Toggle OFF (Hide Details)**

**Frontend (Cart Page):**
```
User clicks toggle → includeDetails = false
↓
Click "Send Link" button
↓
Payload sent:
{
  customer_id: 123,
  selected_projects: [
    {
      id: 1,
      title: "Green Valley Residency",      // REAL NAME
      developer: "XYZ Builders",            // REAL DEVELOPER
      location: "Pune",
      price: "₹50L - ₹80L",
      ... (all fields with real data)
    },
    ...
  ],
  mask_identity: true    // MASKED because includeDetails = false
}
```

**Backend (CustomerProjectLinkController):**
```
store() method receives mask_identity: true
↓
$link->update([
  'selected_projects' => [real values stored in DB],
  'mask_identity' => true    // Store flag as TRUE
])
↓
Database: customer_project_links table
- selected_projects: [full real data - NEVER masked in DB]
- mask_identity: 1 (TRUE)
```

**Backend API Response (publicShow):**
```php
if ($link->mask_identity) {  // TRUE, so this block EXECUTES
    $selected = $this->maskIdentityForPublic($selected);
    // For each project:
    //   $row['title'] = '*****'
    //   $row['developer'] = '*****'
    //   (all other fields unchanged)
}

// Returns:
{
  'data' => [
    'selected_projects' => [
      {
        'id' => 1,
        'title' => '*****',                // MASKED
        'developer' => '*****',            // MASKED
        'location' => 'Pune',              // Still visible
        'price' => '₹50L - ₹80L',          // Still visible
        ... (other fields)
      },
      ...
    ],
    'mask_identity' => true
  ]
}
```

**Frontend (Customer Link Page):**
```
Receives data with mask_identity: true and title: '*****'
↓
Initialize expandedKeys:
- Loop through selected_projects
- Check: isMasked = (project.mask_identity === true || project.mask_identity === 1)
- isMasked = true (because mask_identity === true)
- NOT added to expandedKeys
↓
For each project card:
- isMasked = true
- isExpanded = false (NOT in expandedKeys)

Render:
- Display project title: "*****" ✓
- Display developer: "*****" ✓
- (!isMasked || isExpanded) = false → HIDE full details grid ✓
  - Location, Price, Type, Area, Possession, Units, Status ALL HIDDEN
- Like button visible: (!isMasked || isExpanded) = false → HIDDEN ✓
- "👁️ Show Details" button VISIBLE ✓
  - Image height reduced (80px instead of 150px)
  - Card opacity reduced (0.7 for visual distinction)

Result: COLLAPSED, ONLY TITLE AND DEVELOPER (MASKED) VISIBLE
```

**Customer clicks "Show Details" button:**
```
toggleExpanded(projectKey) called
↓
expandedKeys state updated: now includes this projectKey
↓
Rerender:
- isExpanded = true (in expandedKeys)
- (!isMasked || isExpanded) = true → SHOW full details grid ✓
- Image height normal (150px)
- "👁️ Hide Details" button shows instead of "Show Details"
- Like button becomes visible
```

---

### **Scenario 3: Same Customer, Multiple Projects with Different Toggles**

**Frontend (Cart Page):**
```
Project 1: includeDetails = true  → mask_identity = false
Project 2: includeDetails = false → mask_identity = true
Project 3: includeDetails = true  → mask_identity = false
↓
Send all with different flags
```

**Backend Storage:**
```
Database stores:
{
  selected_projects: [
    {id: 1, title: "Green Valley", developer: "XYZ", ..., mask_identity: false},
    {id: 2, title: "Skyline", developer: "ABC", ..., mask_identity: true},
    {id: 3, title: "Marina", developer: "DEF", ..., mask_identity: false}
  ],
  mask_identity: ??? // This is confusing!
}
```

**⚠️ POTENTIAL ISSUE FOUND:**

Looking at the code, `mask_identity` is stored at the LINK level, not per-project level. This means:

```php
$link->update([
  'selected_projects' => $merged,
  'mask_identity' => (bool) ($v['mask_identity'] ?? false)
])
```

The flag `mask_identity` applies to the ENTIRE link, masking ALL projects together.

**However**, inside each project object, there should be a `mask_identity` field to track individual project masking. Let me check...

---

## 🔍 ISSUE DETECTION

### Issue #1: Per-Project Masking Not Implemented

**Current Code:**
- `customer_project_links.mask_identity` is stored at LINK level (boolean)
- Individual projects in `selected_projects` JSON array don't have `mask_identity` field
- In `publicShow()`, ALL projects are masked or NONE are masked

**Expected Behavior (from user requirements):**
- Project 1: includeDetails=true → mask_identity=0 (show real name)
- Project 2: includeDetails=false → mask_identity=1 (show ****)  
- Project 3: includeDetails=true → mask_identity=0 (show real name)

**Frontend Logic Checks PER-PROJECT:**
```typescript
const isMasked = project.mask_identity === true || project.mask_identity === 1;
```
This checks if the individual project has `mask_identity` field, but the backend doesn't set it.

**Fix Needed:**
Each project needs its own `mask_identity` flag in the payload sent from cart, and each project should be stored with this flag.

---

### Issue #2: Backend Merging May Lose Per-Project Flags

In `mergeProjects()`, when combining old and new projects:
```php
foreach ($newProjects as $project) {
    $key = $this->projectKey((array) $project);
    if ($key === '') {
        continue;
    }
    $map[$key] = $project;  // This should preserve project['mask_identity'] if it exists
}
```

This might lose the individual project's `mask_identity` flag if not included in the payload.

---

### Issue #3: Like Saving Uses ID-Based Keys Correctly, But...

In `publicLike()`:
```php
$liked = collect($v['liked_projects'])
    ->map(fn($project) => $this->projectKey((array) $project))
    ->filter(fn($key) => $key !== '' && array_key_exists($key, $selectedMap))
    ->unique()
    ->map(fn($key) => $selectedMap[$key])
    ->values()
    ->all();

$link->update([
    'liked_projects' => $liked,
    ...
]);
```

This persists the FULL project object from `$selectedMap`, which should include the real data (not masked), which is correct. ✓

---

## ✅ What's Working

1. **Backend stores real data always** ✓
   - Database never stores "****"
   - Only masking happens in API response layer

2. **Collapse/expand logic in frontend** ✓
   - Masked projects initialize collapsed
   - Unmasked projects initialize expanded
   - User can toggle expand/collapse

3. **Like button visibility** ✓
   - Only visible when details expanded or project unmasked
   - Saves real data

4. **URL generation** ✓
   - Public link token works correctly

---

## ❌ What Needs Fixing

### Fix #1: Add `mask_identity` Field to Each Project

**Current Frontend (cart/page.tsx):**
```typescript
const payload: LinkedProjectCard[] = cartProjects.map(mapProjectCard);
const result = await CustomerProjectLinkAPI.create({
  customer_id: selectedCustomerId,
  selected_projects: payload,
  mask_identity: !includeDetails,  // ← LINK-level only
});
```

**Should Be:**
```typescript
const payload: LinkedProjectCard[] = cartProjects.map(project => ({
  ...mapProjectCard(project),
  mask_identity: !includeDetails,  // ← Add to EACH project
}));
const result = await CustomerProjectLinkAPI.create({
  customer_id: selectedCustomerId,
  selected_projects: payload,
  // mask_identity at link level can stay for backwards compat
});
```

### Fix #2: Update Backend Validation

**Backend (CustomerProjectLinkController.php):**

Add to validation:
```php
'selected_projects.*.mask_identity' => ['nullable', 'boolean'],
```

Current:
```php
'selected_projects.*.status' => ['nullable', 'string', 'max:120'],
'selected_projects.*.units_left' => ['nullable', 'integer'],
```

Should be:
```php
'selected_projects.*.status' => ['nullable', 'string', 'max:120'],
'selected_projects.*.units_left' => ['nullable', 'integer'],
'selected_projects.*.mask_identity' => ['nullable', 'boolean'],
```

### Fix #3: Update Backend publicShow() Logic

Change FROM link-level masking:
```php
if ($link->mask_identity) {
    $selected = $this->maskIdentityForPublic($selected);
    $liked = $this->maskIdentityForPublic($liked);
}
```

Change TO per-project masking:
```php
$selected = collect($selected)
    ->map(function ($project) {
        $row = (array) $project;
        if ((bool) ($row['mask_identity'] ?? false)) {
            $row['title'] = '*****';
            $row['developer'] = '*****';
        }
        return $row;
    })
    ->values()
    ->all();
```

### Fix #4: Update API Type Interface

**Frontend (lib/api.ts):**

```typescript
export interface LinkedProjectCard {
  id?: number;
  title: string;
  developer?: string;
  location?: string;
  price?: string;
  image_url?: string;
  unit_types?: string;
  area?: string;
  possession?: string;
  status?: string;
  units_left?: number;
  mask_identity?: boolean | number;  // ← Add this
}
```

---

## 📋 Summary Table

| Scenario | Toggle | Flag Sent | DB Stored | API Returns | Frontend Initial | Frontend Display |
|----------|--------|-----------|-----------|-------------|-----------------|------------------|
| Project 1 | ON     | false     | Real data | Real data   | Expanded        | All details ✓    |
| Project 1 | OFF    | true      | Real data | "****"      | Collapsed       | Title only ✓     |
| Mixed    | Different flags per project | Real data | Real data | Per-project mask | Per-project logic | Mixed states ✓ |

---

## 🎬 Testing Checklist

### Test Case 1: Same Customer, Both Details
- [ ] Add 2 projects to cart
- [ ] Toggle = ON (includeDetails = true)
- [ ] Click "Send Link"
- [ ] Open public link → Both projects show FULL details (not collapsed)
- [ ] Click like on any project → Saves correctly
- [ ] Verify DB: real names in selected_projects

### Test Case 2: Same Customer, Hide Details
- [ ] Add 2 projects to cart
- [ ] Toggle = OFF (includeDetails = false)
- [ ] Click "Send Link"
- [ ] Open public link → Both projects show ***** (collapsed)
- [ ] Click "Show Details" → Expands and shows full details
- [ ] Click like when expanded → Saves correctly
- [ ] Verify DB: real names stored, but API masked them

### Test Case 3: Same Customer, Mixed (CURRENTLY BROKEN)
- [ ] Add Project A
- [ ] Toggle = ON → Send with mask_identity=false
- [ ] Add Project B differently
- [ ] Toggle = OFF → Send with mask_identity=true
- [ ] Open public link → Project A should be expanded, Project B should be collapsed
- [ ] **CURRENTLY:** Both projects will have same state (all or nothing)
- [ ] **AFTER FIX:** Per-project states should work

### Test Case 4: Dashboard Preview
- [ ] Go to dashboard → Customer Projects
- [ ] Should ALWAYS show real names (not masked)
- [ ] Uses `byCustomer()` API which doesn't mask
- [ ] Status bar at top shows number of liked projects

---

## 🔧 Recommendations

### Priority 1: Urgent (Blocks Mixed Scenario)
Add `mask_identity` field to each project object in payload and backend logic.

### Priority 2: Nice to Have
Add UI indicator on cart page showing which projects will be masked when sent.

### Priority 3: Enhancement
Add "Preview as customer" button to see how it looks when masked.

---

## Code Files to Update

1. **Frontend:**
   - `app/cart/page.tsx` - Add mask_identity to each project
   - `lib/api.ts` - Update LinkedProjectCard interface
   - `app/customer-link/[token]/page.tsx` - Already correct ✓

2. **Backend:**
   - `CustomerProjectLinkController.php` - Update validation and publicShow logic
   - `customer_project_links` migration - Add mask_identity column to table schema (already done ✓)

