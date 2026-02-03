# Boundless Driver – Test Scenarios

## Scope
High-level manual and automation-oriented test scenarios for critical flows:

- Login [`LoginScreen`](app/login.tsx:23)
- Daily / Evening inspection [`DailyCheckScreen`](app/daily-check.tsx:31)
- Pre/Post/Daily inspections [`Inspections`](app/inspections.tsx:12)
- Float management [`FloatManagementScreen`](app/float-management.tsx:28)
- Activity history [`HistoryScreen`](app/history.tsx:28)

## Assumptions & Test Data
- Valid demo credentials: Username `Malcolm`, Password `1961`.
- App is connected to a test API environment.
- Test images are available for odometer, oil, and receipts.

## 1. Login

### 1.1 Manual scenarios

| ID | Scenario | Steps | Expected result |
| --- | --- | --- | --- |
| LGN-001 | Successful login | 1. Launch app. 2. Enter valid username and password. 3. Tap **Login**. | Loading indicator appears, then user is navigated to home `/(tabs)/(home)/`; no error alert. |
| LGN-002 | Missing username or password | 1. Leave username or password blank. 2. Tap **Login**. | Alert: "Please enter both username and password"; no navigation. |
| LGN-003 | Invalid credentials | 1. Enter invalid credentials. 2. Tap **Login**. | Alert "Login Failed" with demo credentials hint; stay on login screen. |
| LGN-004 | Web CORS warning (web only) | 1. Run on web. 2. Attempt login to API without CORS. | Web platform warning card visible; login failure alert mentions CORS / mobile devices. |

### 1.2 Automation ideas

- Unit tests for `handleLogin` in [`LoginScreen`](app/login.tsx:32):
  - Mocks `useAuth().login` to resolve `true` / `false` and asserts navigation via `router.replace`.
  - Verifies validation: when username or password empty, `Alert.alert` called and `login` not invoked.

## 2. Daily / Evening Inspection

Based on [`DailyCheckScreen`](app/daily-check.tsx:31) and `useInspection` hook.

### 2.1 Manual scenarios

| ID | Scenario | Steps | Expected result |
| --- | --- | --- | --- |
| DLY-001 | Load current check type | 1. Open Daily/Evening Inspection screen. | Header shows correct title; progress bar reflects 0% initially; inspection items list loads. |
| DLY-002 | Already completed banner | 1. Complete a check. 2. Reopen screen on same day. | "Daily check already completed today" banner visible. |
| DLY-003 | Odometer required | 1. Leave odometer empty. 2. Try to submit. | Validation blocks submission; user prompted to enter odometer and upload dashboard photo. |
| DLY-004 | Required photos for items | 1. For item(s) with `requiresPhoto`, enter a value but no photo. 2. Try to submit. | Validation requires photo before allowing full submit. |
| DLY-005 | Full successful submission | 1. Fill all items and required photos. 2. Enter odometer and dashboard photo. 3. Tap **Submit** and confirm in alert. | Success status message; `markCheckCompleted` recorded; optional navigation back after delay. |
| DLY-006 | Submit with missing items | 1. Leave some items empty. 2. Tap **Submit Daily Inspection**. 3. Choose **Submit Anyway**. | "Incomplete Check" alert shows correct completed/total count and %; inspection still submitted. |

### 2.2 Automation ideas

- Component tests for [`DailyCheckScreen`](app/daily-check.tsx:31):
  - Mock `useInspection` to supply deterministic `checkItems`, `odometerReading`, and handlers.
  - Assert progress bar width reflects proportion of completed items.
  - Assert pressing **Submit Daily Inspection** calls `inspection.handleSubmit` and triggers `Alert.alert` with appropriate title / message.

## 3. Pre‑Tour / Daily / Post‑Tour Inspections

Based on [`Inspections`](app/inspections.tsx:12) and [`getChecklistIds`](app/inspections.tsx:309) with `itemlistTypes`.

### 3.1 Manual scenarios

| ID | Scenario | Steps | Expected result |
| --- | --- | --- | --- |
| INS-001 | Checklist items per inspection type | 1. Open screen with `inspectionType="PreTour"`. 2. Repeat for `"Daily"` and `"PostTour"`. | For each type, only relevant item IDs are displayed; odometer section always present. |
| INS-002 | Odometer validation | 1. Leave odometer empty or omit photo. 2. Tap **Submit Inspection**. | Alert for missing odometer and/or dashboard photo; submission blocked. |
| INS-003 | Yes/No toggle | 1. For a Yes/No item, tap checkbox multiple times. | Value toggles between `checked` / `unchecked`; UI updates accordingly. |
| INS-004 | Oil photo required (item 75) | 1. For item 75, enter a value but no photo. 2. Submit. | Alert or server-side response indicates missing required photo; verify request payload includes attachment when added. |
| INS-005 | Successful submission | 1. Provide odometer value and photo. 2. Fill visible items with valid values. 3. Add oil photo (75). 4. Submit. | API `submitCheck` called; success alert "Inspection submitted successfully!". |

### 3.2 Automation ideas

- Unit tests for [`getChecklistIds`](app/inspections.tsx:309):
  - For `PreTour`, `Daily`, `PostTour`, assert returned IDs equal expected arrays.
- Component tests for [`Inspections`](app/inspections.tsx:12):
  - Mock `submitCheck` to resolve `{ success: true }`.
  - Supply fixture `itemlistTypes` and assert outgoing `items` array includes all underlying checklist items, not only displayed ones.

## 4. Float Management

Based on [`FloatManagementScreen`](app/float-management.tsx:28) and `useExpenses`.

### 4.1 Manual scenarios – Add expense

| ID | Scenario | Steps | Expected result |
| --- | --- | --- | --- |
| FLT-001 | Load float data | 1. Navigate to Float Management. | While `loading` is true, spinner visible; then balance card shows float balance, total expenses, remaining. |
| FLT-002 | Required fields | 1. Leave category or amount or description empty. 2. Tap **Add Expense**. | Alert "Please fill in all fields"; no API call. |
| FLT-003 | Invalid amount | 1. Enter non-numeric or <=0 amount. 2. Tap **Add Expense**. | Alert "Please enter a valid amount". |
| FLT-004 | Missing receipt | 1. Fill fields but do not add receipt image. 2. Tap **Add Expense**. | Alert "Receipt photo is required."; submission blocked. |
| FLT-005 | Low / negative balance warnings | 1. Add expenses until remaining < 100. 2. Add more until remaining < 0. | Low-balance card shows when < 100; negative-balance card shows when remaining < 0. |
| FLT-006 | Successful expense submission | 1. Provide all fields and receipt image. 2. Confirm if balance warning dialog appears. | API `addExpense` called; success alert; form resets; tab switches to **History**. |

### 4.2 Manual scenarios – History & receipts

| ID | Scenario | Steps | Expected result |
| --- | --- | --- | --- |
| FLT-007 | View existing expenses | 1. Go to **History** tab with seeded expenses. | List shows each expense with category icon, description, amount, date/time. |
| FLT-008 | View receipt image | 1. Tap **View Receipt** badge on an expense. | Receipt modal opens with full-size image; tap background or close icon to dismiss. |
| FLT-009 | Delete expense | 1. Tap delete icon. 2. Confirm dialog. | Expense removed from list; success alert. |

### 4.3 Automation ideas

- Unit tests for `submitExpense` path in [`FloatManagementScreen`](app/float-management.tsx:168):
  - When `amount > remainingBalance`, confirmation alert appears and API called only when confirm action pressed.
  - Request body maps `amount` to cents and includes base64 `attachment` when image present.

## 5. Activity History

Based on [`HistoryScreen`](app/history.tsx:28).

### 5.1 Manual scenarios

| ID | Scenario | Steps | Expected result |
| --- | --- | --- | --- |
| HIS-001 | History loading state | 1. Navigate to Activity History with slow network. | "Loading history..." and spinner visible until data is loaded. |
| HIS-002 | Empty state | 1. Open screen with no history data. | Empty-state icon and "No activity found" message. |
| HIS-003 | Filter by type | 1. With mixed history types, tap each filter pill. | Only items matching selected type (or float+expense for Float filter) are rendered. |
| HIS-004 | Icon and color mapping | 1. For each type, inspect icon and color. | Types use icons from `getTypeIcon` and colors from `getTypeColor` as defined in component. |

### 5.2 Automation ideas

- Unit tests for filter logic around `filteredHistory` in [`HistoryScreen`](app/history.tsx:64):
  - Given synthetic `historyData`, assert outputs for each filter value.

## 6. General non-functional checks

- Basic accessibility: ensure important actions are reachable and readable; colors have sufficient contrast.
- Error handling: simulate API errors for each feature; confirm clear user-facing messages and app remains usable.