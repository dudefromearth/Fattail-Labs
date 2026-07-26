# Design — First-class Resources (admin + member)

**Status:** Plan-phase design for p-resources (pairs with Resource Spec v1.0)  
**Spec:** `Specs/FatTail-Labs-Resource-Spec-v1.0.md`  
**HIG:** Human Interface Spec v1.0 · Application Framework v1.0 (stay-put admin)

---

## 1. Goals

1. Operators manage **versioned** materials without breaking courses that pin old cuts.  
2. Members discover **published** materials in one hub (`/resources`).  
3. Course builders **attach or create** resources without leaving the course polish flow.  
4. Labels never confuse **library publish** with **member free access**.  
5. Tokens only; no emoji-as-chrome; emoji allowed **on resource cards** as content metadata (existing library pattern).

---

## 2. Information architecture

### 2.1 Member — global Resources hub (`/resources`)

```
[ Filters: category · type ]
[ Search optional later ]

Resource cards (published only)
  emoji · title · type badge · “v{N}”
  description (2-line clamp)
  free | members badge
  linked courses (chips → /courses/{slug})
  [ Download / Open ]
```

- Signed-out: sign-in prompt (as today).  
- 403 download: membership upsell (as today).  
- **Unpublished** resources never appear.

### 2.2 Member — course Resources tab

```
Course → Resources tab
  rows: title · type · pinned v{N} · free badge · Download/Open
  empty: “No resources for this course yet”
```

- Shows **all linked** resources at **pin**, even if not library-published.  
- Optional subtle note: “Library hub shows the published edition; this course uses v{N}.” when pin ≠ published.

### 2.3 Admin — Resources hub (`/resources` when administrator)

Extends member layout with operator density:

| Control | Behavior |
|---------|----------|
| **New resource** | Drawer/modal: slug, title, description, type, category, file/link, optional “Publish v1” |
| **Edit head** | Title, description, type, category, emoji |
| **New version** | Upload/link + changelog → creates vN+1 (does not auto-publish) |
| **Publish / Unpublish** | Sets/clears library published version (publish flag) |
| **Free / Members** | free_preview access |
| **Version history** | Expand row or side panel: all versions, which is published, download old |
| **Linked courses** | Chips; click → course admin; content not bulk-edited from hub |

**Locked content rule:** Changing file/url always goes through **New version**, not in-place overwrite of an old version payload.

### 2.4 Admin — course builder (course Resources + attach flow)

#### A. Course Resources tab (edit mode)

Replace / evolve `AttachmentsEditor` into **CourseResourcesEditor**:

```
[ Attach existing… ]  [ New resource… ]
list:
  title · type · pin [v1 ▾] · free toggle · unlink
  badge: “In library” if this resource has a published version
```

| Action | UI |
|--------|-----|
| **Attach existing** | Modal: search library by title/slug/type; select resource; default pin = published if any else latest; confirm |
| **New resource** | Modal: same fields as hub create; creates Resource+v1+link; pin=v1; publish checkbox default **off** |
| **Change pin** | Select version from history |
| **Unlink** | Removes course link only; resource remains in library |
| **Open in Resources** | Deep link to hub focused on slug (admin) |

#### B. Lesson scope (phase R3b if not MVP)

Optional “Attach resource to this lesson” using same picker; link row with `lesson_id`.

#### C. Canonical package

Export already includes resource pointers; after cutover, export uses **slug + pinned_version**. Import resolve per Resource Spec. No new primary chrome beyond existing Export package.

### 2.5 Admin app shell (optional R3)

If dual-surface needs a control-plane list: `/admin/resources` can mirror hub admin tools. **v1 default:** keep operators on member URL `/resources` with admin affordances (current pattern) to reduce surface area.

---

## 3. Copy & badges (Tango)

| Badge / label | Meaning |
|---------------|--------|
| **In library** / **Published** | Discoverable on Resources hub |
| **Course only** | Linked but not library-published |
| **Free** | free_preview access |
| **Members** | Membership required to download |
| **v3 (pinned)** | Course uses version 3 |
| **v4 (live in hub)** | Published cut is v4 |

Never say “hidden” for course materials that are still on the course tab.

---

## 4. Interaction standards

- **Stay-put:** create/attach/pin/publish without full page reload of course shell.  
- **AlertDialog** for unlink and unpublish (“Courses keep their pins”).  
- **44pt** primary actions.  
- Destructive: unlink vs delete resource — delete blocked if links exist (spec).  
- Loading/empty/error states on both hubs.

---

## 5. Wireframes (textual)

### Attach existing (modal)

```
Attach resource
  [ Search…………… ]
  list results (title · slug · type · published v?)
  Pin version: [ latest published ▾ ]
  [ ] Free preview for members who can open it
  [ Cancel ]  [ Attach ]
```

### New version (hub)

```
New version of “Trade Log”
  Current published: v3
  Latest: v4 (draft)
  File [ Upload ] or Link URL
  Changelog
  [ ] Publish this version now
  [ Cancel ]  [ Create version ]
```

---

## 6. Out of scope for UI v1

- Member-facing version picker  
- Bulk “upgrade all courses to published”  
- Full `/admin/resources` SPA if hub admin is enough  
- Media ZIP  

---

*Charlie implements; Echo reviews density and hierarchy; Tango reviews labels.*
