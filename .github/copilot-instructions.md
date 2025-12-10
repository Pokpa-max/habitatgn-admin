# Habitat Admin - Copilot Instructions

## Project Overview

**habitatgnAdmin** is a Next.js + Firebase real estate management dashboard for admin and manager roles. It provides interfaces for managing houses, users, orders, menus, and advertising with role-based access control.

### Tech Stack
- **Framework**: Next.js (latest) with React 18.1
- **Styling**: Tailwind CSS v3 with plugins (@tailwindcss/forms, @tailwindcss/aspect-ratio, etc.)
- **Database**: Firebase (Firestore) with Firebase Admin SDK for server operations
- **Authentication**: next-firebase-auth with role-based claims (admin, manager)
- **Search**: Algolia for full-text search
- **Maps**: @react-google-maps/api for geolocation features
- **Forms**: react-hook-form for form state management
- **Notifications**: react-hot-toast for user feedback
- **Development**: TypeScript support (tsconfig present) but mostly JSX

### Development Commands
```bash
npm run dev      # Start dev server on port 9000
npm run build    # Build for production
npm run start    # Run production build
```

## Architecture Patterns

### 1. **Authentication & Page Protection**
- **Pattern**: Server-side authentication via `next-firebase-auth`
- **Usage**: Every protected page wraps exports with `withAuthUserTokenSSR()` (SSR) and `withAuthUser()` (client wrapper)
- **Example** (`pages/houses/index.jsx`):
  ```jsx
  export const getServerSideProps = withAuthUserTokenSSR()
  export default withAuthUser({ LoginComponent: Login })(HousesPage)
  ```
- **Role Access**: `AuthUser.claims.userType` determines access (admin vs manager)
- **Manager Filtering**: Managers see only their own data via `where('userId', '==', AuthUser.id)` Firestore queries

### 2. **Data Service Layer**
- **Location**: `lib/services/*.js` - each entity (houses, menu, orders, users) has a dedicated service
- **Pattern**: Services export CRUD functions and Firestore references
- **Key Functions**:
  - `editHouse()` - handles image upload/deletion alongside data updates
  - `deleteHouse()` - cascades image deletion from Storage
  - `houseDocRef(id)` - creates Firestore document references
- **Data Constructors**: `utils/functionFactory.js` contains entity constructors (e.g., `housesConstructorCreate()`) that shape data before DB write

### 3. **Component Composition**
- **Base Layout**: `Scaffold.jsx` provides navigation sidebar with role-based menu visibility
- **Page Wrapper**: `Page.jsx` wraps content pages
- **Drawer Forms**: `DrawerForm.jsx` is a reusable slide-in form modal (used in HouseFormDrawer, etc.)
- **Example Structure**:
  ```jsx
  <Scaffold title="Houses" subNav={...}>
    <HousesList houses={data} onEdit={openDrawer} />
    <HouseFormDrawer open={open} onSubmit={handleSave} />
  </Scaffold>
  ```

### 4. **Firestore Real-time & Pagination**
- **Pattern**: Use `onSnapshot()` for real-time updates, `getDocs()` with `query()` for initial fetch
- **Pagination**: Cursor-based using `startAfter()` and `limit(HITS_PER_PAGE)` constant
- **Example** (`pages/houses/index.jsx`):
  ```jsx
  const q = query(housesRef, orderBy('createdAt', 'desc'), limit(HITS_PER_PAGE))
  const querySnapshot = await getDocs(q)
  const houses = parseDocsData(querySnapshot) // Custom parser
  setData({ houses, lastElement: querySnapshot.docs[...] })
  ```

### 5. **Image Handling**
- **Storage**: Firebase Storage with path structure `/{entityType}Images/`
- **Deletion**: `deleteStorageImage()` and `deleteResizedStorageImage()` before updates
- **Upload**: Images converted to URLs via `getDefaultImageDownloadURL()` before Firestore write
- **Pattern**: Images are stored as array of URLs in Firestore (e.g., `houseInsides`, `imageUrl`)

### 6. **Form Validation & State**
- **Forms**: react-hook-form with `useForm()` hook and validation modes
- **Pattern**: `register()` for input binding, `watch()` for conditional fields, `setValue()` for programmatic updates
- **Errors**: Validation errors displayed inline via form state
- **Example** (`HouseFormDrawer.jsx`):
  ```jsx
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm()
  ```

### 7. **API Routes**
- **Location**: `pages/api/*.ts` (or `.js`)
- **Current Routes**: 
  - `POST /api/createUser` - user creation (TypeScript)
  - `POST /api/login` - authentication
  - `GET/POST /api/infos/*` - info endpoints
  - `GET/POST /api/userActivity/*` - activity tracking

### 8. **Data Fetching & Utilities**
- **Helper**: `utils/fetch.js` exports `fetchWithPost()` for client-side API calls
- **Firestore Utils**: `utils/firebase/firestore.js` has `parseDocsData()`, `updateDocument()`, `deleteDocument()` helpers
- **Data Transformations**: `utils/functionFactory.js` is large (~666 lines) with entity constructors and validators
- **Constants**: `lib/constants.js` (pagination, feature flags, etc.)

### 9. **UI Component Library**
- **Modals**: `Modal.jsx`, `ConfirmModal.jsx`, `SimpleDrawer.jsx`
- **Forms**: `DrawerForm.jsx` (main form container), `SimpleSelect.jsx`, `CreatableSelect.jsx`, `MultiSelect.jsx`
- **Lists**: `_dataTable.jsx` in each feature folder (generic data table with sorting/filtering)
- **Navigation**: `NavItem.jsx` (sidebar menu items with icon/label)
- **Utilities**: `Loader.jsx`, `MenuPopover.jsx`, `Header.jsx`

## Developer Workflow

### Adding a New Feature (e.g., New Entity Type)
1. **Create Service** (`lib/services/newEntity.js`): Export CRUD functions and refs
2. **Create Page** (`pages/newEntity/index.jsx`): Use `withAuthUserTokenSSR()` + `withAuthUser()` wrappers
3. **Create Components**:
   - `components/newEntity/NewEntityList.jsx` - Display list with actions
   - `components/newEntity/NewEntityFormDrawer.jsx` - Edit/create form
   - `components/newEntity/_dataTable.jsx` - Reusable table rows
4. **Add Data Constructor** (`utils/functionFactory.js`): Create `newEntityConstructor()` for validation/shaping
5. **Update Navigation** (`components/Scaffold.jsx`): Add menu item with role claims

### Common Patterns
- **Protected Pages**: Always export `getServerSideProps` with `withAuthUserTokenSSR()`
- **Real-time Updates**: Use `onSnapshot()` in `useEffect()` (unsubscribe on unmount)
- **Image Operations**: Check file size, delete old images before uploading new ones
- **Role Checks**: Access `AuthUser.claims.userType` in components; filter Firestore queries server-side when possible
- **Toast Notifications**: Import `notify()` from `utils/toast.jsx` for feedback

### Build & Deploy
- **Port**: Dev server runs on 9000 (configured in `next.config.js`)
- **Image Domains**: Whitelist image domains in next.config (currently Unsplash, Freepik, Google)
- **Environment Variables**: Use `NEXT_PUBLIC_FIREBASE_*` for client config, server-side only for secrets

## Key Files & Dependencies

| File/Path | Purpose |
|-----------|---------|
| `lib/firebase/client_config.js` | Firebase client SDK initialization |
| `lib/firebase-admin/admin_config.js` | Firebase Admin SDK (server-side) |
| `utils/firebase/storage.js` | Image upload/delete operations |
| `utils/firebase/firestore.js` | Firestore CRUD helpers |
| `_data.js` | Shared constants (zones, house types, offer types) |
| `pages/_middleware.js` | Route redirects (settings → settings/categories) |

## Common Gotchas

1. **Manager Role Isolation**: Always filter queries with `where('userId', '==', AuthUser.id)` for managers
2. **Image Cleanup**: Must delete old images from Storage before writing new ones; use Promise.all() for parallel deletes
3. **Firestore Timestamps**: Use `serverTimestamp()` for server-side dates; convert with `firebaseDateToJsDate()` in displays
4. **Pagination Cursor**: Store `lastElement` from previous query; pass to `startAfter()` for next page
5. **React Hook Form**: Use `shouldUnregister: false` if conditionally rendering fields (in `HouseFormDrawer`)
6. **TypeScript Mixing**: Some files use `.ts` (API routes), most are `.jsx`; be consistent within a feature
