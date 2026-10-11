# Selegic HR Management App — Attendance Tracker
## Deep Explanation of LWC HTML & CSS

This document explains the `attendanceMonthlyView.html` and `attendanceMonthlyView.css` files of the Selegic HR Management App — Attendance Tracker.

The goal is not just to explain what each line does, but to understand **why it exists, how LWC processes it, how it connects to JavaScript/Apex, and what the user sees on the Salesforce screen.**

---

# 1. The Overall Architecture

The Attendance Tracker follows this basic architecture:

```text
                 APEX
                  │
                  │ Data
                  ▼
             JAVASCRIPT
                  │
       ┌──────────┼──────────┐
       │          │          │
       ▼          ▼          ▼
   employees     days    employeeRows
       │          │          │
       └──────────┼──────────┘
                  │
                  ▼
                 HTML
                  │
          Displays the table
                  │
                  ▼
                 CSS
                  │
       Colors / size / layout
                  │
                  ▼
          ATTENDANCE SCREEN
```

A simple way to remember the responsibilities:

| File | Responsibility |
|---|---|
| Apex | Gets and saves Salesforce data |
| JavaScript | Handles logic, data transformation, and user interaction |
| HTML | Defines what appears on screen |
| CSS | Controls appearance, layout, colors, spacing, and sizing |

When the user changes attendance, the flow goes in the opposite direction:

```text
User changes dropdown
        ↓
HTML
        ↓
onchange
        ↓
JavaScript
        ↓
Apex
        ↓
Attendance__c
```

---

# 2. `<template>` — The Starting Point of LWC

The first line is:

```html
<template>
```

In Lightning Web Components, the `.html` file is the **template of the component**.

Your component has a structure like:

```text
attendanceMonthlyView
│
├── attendanceMonthlyView.html
├── attendanceMonthlyView.js
└── attendanceMonthlyView.css
```

Each file has a different responsibility:

- `.html` → User interface
- `.js` → Application logic and data
- `.css` → Appearance and layout

Everything inside:

```html
<template>
    ...
</template>
```

becomes part of the LWC's user interface.

## Why don't we use `<body>`?

An LWC is not an entire webpage. Salesforce already owns the overall page.

Your component is inserted into a Salesforce page:

```text
Salesforce Page
┌─────────────────────────────────────────────┐
│ Navigation                                   │
├─────────────────────────────────────────────┤
│                                             │
│       Your Attendance LWC                   │
│                                             │
└─────────────────────────────────────────────┘
```

Therefore, the `<template>` represents the UI of **your component**, not the entire webpage.

---

# 3. The Main `lightning-card`

Your first component is:

```html
<lightning-card title="Attendance Tracker">
```

`lightning-card` is a **Salesforce Lightning Base Component**.

Salesforce provides ready-made components such as:

```text
lightning-card
lightning-combobox
lightning-button
lightning-input
lightning-datatable
lightning-spinner
```

Instead of building the entire card yourself with normal HTML and CSS, Salesforce provides the card component.

Conceptually, it creates:

```text
┌──────────────────────────────────────────────┐
│ Attendance Tracker                           │
├──────────────────────────────────────────────┤
│                                              │
│              Your content                    │
│                                              │
└──────────────────────────────────────────────┘
```

## `title="Attendance Tracker"`

This is an attribute of the component.

```html
<lightning-card title="Attendance Tracker">
```

It tells the Lightning card:

```text
Component = lightning-card
Title     = Attendance Tracker
```

This is a static value because it is directly written in HTML.

---

# 4. Static vs Dynamic Values in LWC

This distinction is very important.

## Static value

```html
title="Attendance Tracker"
```

The value is directly written in the HTML.

## Dynamic value

```html
value={selectedMonth}
```

The value comes from JavaScript.

For example:

```javascript
selectedMonth = 8;
```

The HTML reads that JavaScript property.

So:

```text
HTML
value={selectedMonth}
        ↓
JavaScript
selectedMonth = 8
```

The curly braces `{}` indicate that the value is coming dynamically from the component's JavaScript.

---

# 5. Main Content Container

Next:

```html
<div class="slds-p-around_medium">
```

A `<div>` is a general-purpose HTML container.

You can think of it as a box around some content:

```text
┌──────────────────────────────┐
│                              │
│       CONTENT GOES HERE      │
│                              │
└──────────────────────────────┘
```

The class:

```text
slds-p-around_medium
```

is a Salesforce Lightning Design System (SLDS) utility class.

Break it down:

```text
slds-p-around_medium
│    │ │     │
│    │ │     └── medium size
│    │ └──────── around all sides
│    └────────── padding
└─────────────── Salesforce Lightning Design System
```

Therefore it means:

> Add medium padding around all four sides.

This keeps the content from touching the edges of the Lightning card.

---

# 6. Month and Year Selection Section

The comment:

```html
<!-- Month and Year Selection -->
```

is only for developers.

It does not appear on the Salesforce screen.

It tells us that the following section is responsible for selecting the month and year.

---

# 7. The SLDS Grid

The code is:

```html
<div class="slds-grid slds-gutters">
```

There are two classes:

```text
slds-grid
slds-gutters
```

## `slds-grid`

Creates a grid/flexible layout.

Without a horizontal grid, the controls could appear vertically:

```text
Month
[ August ▼ ]

Year
[ 2026 ▼ ]
```

With the grid, they can appear horizontally:

```text
Month                         Year
[ August ▼ ]                  [ 2026 ▼ ]
```

## `slds-gutters`

Adds spacing between the grid columns.

So:

```text
Without gutters:

[ Month ][ Year ]

With gutters:

[ Month ]      [ Year ]
```

---

# 8. Month Column

The month column is:

```html
<div class="slds-col slds-size_1-of-2">
```

There are two classes.

## `slds-col`

This tells SLDS that this `<div>` is a column inside the grid.

## `slds-size_1-of-2`

This means the column occupies one-half of the available width.

Therefore:

```text
Total width = 100%

Month = 50%
Year  = 50%
```

Conceptually:

```text
┌─────────────────────────────────────────────┐
│                                             │
│ Month                    Year               │
│ 50%                      50%                │
│                                             │
└─────────────────────────────────────────────┘
```

---

# 9. The Month `lightning-combobox`

The Month dropdown is:

```html
<lightning-combobox
    name="month"
    label="Month"
    value={selectedMonth}
    options={monthOptions}
    onchange={handleMonthChange}>
</lightning-combobox>
```

This is a Salesforce Lightning Base Component.

It creates a dropdown such as:

```text
Month
┌─────────────────────────┐
│ August                ▼ │
└─────────────────────────┘
```

Each attribute has a different purpose.

---

# 10. `name="month"`

```html
name="month"
```

This gives the control a name.

It identifies this particular input control as the month selector.

It does **not** mean that the selected month is August.

It is simply the name of the input.

You have another control:

```html
name="year"
```

so the two controls can be distinguished.

---

# 11. `label="Month"`

```html
label="Month"
```

This tells the Salesforce combobox to display the label:

```text
Month
```

above the dropdown.

You don't have to create a separate `<label>` element yourself.

---

# 12. `value={selectedMonth}`

This is one of the most important connections between HTML and JavaScript.

```html
value={selectedMonth}
```

Suppose the JavaScript contains:

```javascript
selectedMonth = 8;
```

The HTML tells the combobox:

> Use the current value of the JavaScript property `selectedMonth`.

The flow is:

```text
JavaScript
selectedMonth = 8
        ↓
HTML
value={selectedMonth}
        ↓
Lightning Combobox
        ↓
Selected month = August
```

The HTML does not independently decide which month is selected.

JavaScript provides the value.

---

# 13. `options={monthOptions}`

```html
options={monthOptions}
```

This tells the combobox where to get its available options.

For example, JavaScript can contain:

```javascript
monthOptions = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    ...
    { label: 'August', value: 8 }
];
```

The important distinction is:

```text
label → What the user sees
value → What the application uses
```

For example:

```javascript
{
    label: 'August',
    value: 8
}
```

means:

```text
User sees → August
Application uses → 8
```

This is a very common pattern in Salesforce LWC.

---

# 14. `onchange={handleMonthChange}`

```html
onchange={handleMonthChange}
```

This makes the dropdown interactive.

It means:

> When the user changes the month, call the JavaScript method `handleMonthChange`.

The flow is:

```text
User selects September
        ↓
Combobox detects change
        ↓
onchange fires
        ↓
handleMonthChange(event)
        ↓
JavaScript updates selectedMonth
        ↓
Attendance data can be refreshed
```

This is a key LWC concept:

> HTML handles the UI event, while JavaScript handles the logic.

---

# 15. Year Selection

The Year dropdown is:

```html
<lightning-combobox
    name="year"
    label="Year"
    value={selectedYear}
    options={yearOptions}
    onchange={handleYearChange}>
</lightning-combobox>
```

It works exactly like the Month dropdown.

The relationships are:

```text
selectedYear
     ↓
value

yearOptions
     ↓
options

handleYearChange
     ↑
onchange
```

If JavaScript has:

```javascript
selectedYear = 2026;
```

the dropdown can display:

```text
2026
```

If the user selects 2027:

```text
User selects 2027
        ↓
handleYearChange()
        ↓
selectedYear = 2027
        ↓
Days/data can be regenerated
        ↓
Attendance grid updates
```

---

# 16. Attendance Grid Section

The next container is:

```html
<div class="slds-m-top_large">
```

The SLDS class:

```text
slds-m-top_large
```

can be broken down as:

```text
slds
m = margin
top = top
large = large spacing
```

It adds a large top margin.

Its purpose is to visually separate:

```text
Month / Year Selection
```

from:

```text
Attendance Grid
```

---

# 17. Nested Attendance Grid Card

Inside it:

```html
<lightning-card title="Attendance Grid">
```

You now have a card inside the main Attendance Tracker card.

Conceptually:

```text
┌──────────────────────────────────────────────┐
│ Attendance Tracker                           │
│                                              │
│ Month                  Year                  │
│ [ August ▼ ]           [ 2026 ▼ ]            │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ Attendance Grid                          │ │
│ │                                          │ │
│ │ Legend                                   │ │
│ │                                          │ │
│ │ Attendance Table                         │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

The outer card represents the application.

The inner card represents the Attendance Grid section.

---

# 18. Attendance Status Legend

The legend starts with:

```html
<div class="status-legend">
```

It displays the meaning of the attendance colors.

For example:

```text
[green] WFO
[blue]  WFH
[gray]  WO
[yellow] Leave
[red]   LOP
[purple] Holiday
```

This is similar to the legend used in a map or chart.

---

# 19. A Single Legend Item

For example:

```html
<div class="legend-item">
    <span class="legend-box status-wfo"></span>
    <span>WFO</span>
</div>
```

This contains two pieces.

First:

```html
<span class="legend-box status-wfo"></span>
```

This creates the colored rectangle.

Second:

```html
<span>WFO</span>
```

This displays the text `WFO`.

Together:

```text
[green rectangle] WFO
```

---

# 20. Why Use `<span>` for the Colored Box?

`<span>` is an inline HTML element.

Here, it is being used as a small visual object.

The element has no text:

```html
<span class="legend-box status-wfo"></span>
```

The CSS gives it dimensions and a color.

For example:

```css
.legend-box {
    width: 22px;
    height: 14px;
}
```

and:

```css
.status-wfo {
    background-color: #B7E4C7;
}
```

Therefore the empty `<span>` becomes a visible green rectangle.

---

# 21. Horizontal Scrolling

Your table is wrapped in:

```html
<div class="slds-scrollable_x">
```

This is important because your attendance table can become very wide.

For example:

```text
Employee | 1 | 2 | 3 | 4 | 5 | ... | 31
```

31 days plus the Employee column cannot always fit on a normal screen.

`slds-scrollable_x` provides horizontal scrolling.

Conceptually:

```text
←──────────────────────────────→
Employee | 1 | 2 | 3 | ... | 31
```

The user can scroll horizontally to see later dates.

---

# 22. The Attendance Table

Your table starts with:

```html
<table class="slds-table slds-table_bordered slds-table_cell-buffer attendance-table">
```

There are four classes.

## `slds-table`

Provides standard Salesforce table styling.

## `slds-table_bordered`

Adds borders around the table/cells.

## `slds-table_cell-buffer`

Provides padding/spacing inside table cells.

## `attendance-table`

This is your own custom CSS class.

It is defined in your CSS file.

Therefore you are combining:

```text
Salesforce standard styling
+
Your custom styling
```

---

# 23. `<thead>` — Table Header

```html
<thead>
```

`thead` represents the header section of a table.

Inside it:

```html
<tr>
```

represents one table row.

Your first header is:

```html
<th scope="col" class="employee-column">
    Employee
</th>
```

This creates the first header:

```text
Employee
```

Then the day headers are generated dynamically.

---

# 24. Dynamic Day Headers with `for:each`

This is one of the most important LWC sections:

```html
<template for:each={days} for:item="day">
```

This is LWC template syntax.

It means:

> Take the JavaScript array `days` and render the enclosed HTML once for every item in the array.

Suppose JavaScript generates:

```javascript
days = [
    {
        dayNumber: 1,
        dayName: 'Sat',
        date: '2026-08-01'
    },
    {
        dayNumber: 2,
        dayName: 'Sun',
        date: '2026-08-02'
    },
    {
        dayNumber: 3,
        dayName: 'Mon',
        date: '2026-08-03'
    }
];
```

LWC creates three headers.

Conceptually:

```html
<th>
    1
    Sat
</th>

<th>
    2
    Sun
</th>

<th>
    3
    Mon
</th>
```

You do not manually write 31 `<th>` elements.

JavaScript creates the data, and `for:each` creates the HTML.

---

# 25. `for:item="day"`

```html
for:item="day"
```

means:

> For each item in the `days` array, temporarily call the current item `day`.

Therefore you can use:

```html
{day.dayNumber}
{day.dayName}
{day.date}
```

For example, if the current item is:

```javascript
{
    dayNumber: 15,
    dayName: 'Sat',
    date: '2026-08-15'
}
```

then:

```html
{day.dayNumber}
```

becomes:

```text
15
```

and:

```html
{day.dayName}
```

becomes:

```text
Sat
```

---

# 26. `key={day.date}`

You have:

```html
<th scope="col" key={day.date} class="day-column">
```

When LWC renders a list, it needs a unique `key` for each item.

Your dates are unique:

```text
2026-08-01
2026-08-02
2026-08-03
...
```

Therefore:

```html
key={day.date}
```

gives every generated header a unique identity.

Think of `key` as:

> "LWC, this is the unique identity of this item in this list."

It is mainly used by LWC's rendering engine.

The user does not see the key.

---

# 27. Day Number and Day Name

You have:

```html
<div>{day.dayNumber}</div>
<div>{day.dayName}</div>
```

The two `<div>` elements create two lines.

For example:

```text
15
Sat
```

instead of:

```text
15 Sat
```

This makes the calendar-style table header compact.

---

# 28. `<tbody>` — Actual Attendance Data

The table body starts with:

```html
<tbody>
```

This is where the employee attendance rows are displayed.

The employee loop is:

```html
<template for:each={employeeRows} for:item="row">
```

This means:

> Loop through every employee row prepared by JavaScript.

For example:

```javascript
employeeRows = [
    {
        employeeId: '001',
        employeeName: 'Anik Mallick',
        days: [...]
    },
    {
        employeeId: '002',
        employeeName: 'Ayan Mukherjee',
        days: [...]
    }
];
```

The HTML creates one table row for each employee.

---

# 29. Why Use `row`?

This:

```html
for:item="row"
```

creates a temporary variable called `row`.

For the current employee, you can access:

```html
{row.employeeId}
{row.employeeName}
{row.days}
```

For example:

```javascript
row = {
    employeeId: '001',
    employeeName: 'Anik Mallick',
    days: [...]
}
```

Then:

```html
{row.employeeName}
```

displays:

```text
Anik Mallick
```

---

# 30. Employee Row Key

You have:

```html
<tr key={row.employeeId}>
```

Again, LWC needs a unique key for list rendering.

Employee IDs are unique.

Therefore:

```html
key={row.employeeId}
```

provides a unique identity for each employee row.

---

# 31. Employee Name Cell

```html
<th scope="row" class="employee-column">
    {row.employeeName}
</th>
```

The JavaScript value:

```javascript
row.employeeName = 'Anik Mallick';
```

is displayed as:

```text
Anik Mallick
```

The same `.employee-column` CSS class is also used here because the Employee column needs special behavior such as:

- fixed width
- left alignment
- sticky positioning
- white background
- higher stacking order

---

# 32. The Second `for:each` — Days for Each Employee

This is the most important structural part:

```html
<template for:each={row.days} for:item="day">
```

You now have two nested loops.

## Outer loop

```html
for:each={employeeRows}
```

creates employees.

## Inner loop

```html
for:each={row.days}
```

creates days for the current employee.

So conceptually:

```text
Employee 1
    ├── Day 1
    ├── Day 2
    ├── Day 3
    └── Day 31

Employee 2
    ├── Day 1
    ├── Day 2
    ├── Day 3
    └── Day 31

Employee 3
    ├── Day 1
    ├── Day 2
    ├── Day 3
    └── Day 31
```

This is what creates the two-dimensional attendance matrix.

---

# 33. The Attendance Cell

The cell is:

```html
<td key={day.date} class={day.statusClass}>
```

This is one of the most important lines in your entire component.

There are two important attributes:

```text
key={day.date}
class={day.statusClass}
```

## `key={day.date}`

Provides a unique identity for the cell.

## `class={day.statusClass}`

Tells HTML which CSS class should be applied.

For example, JavaScript may produce:

```javascript
day.statusClass = 'status-wfo';
```

The HTML effectively becomes:

```html
<td class="status-wfo">
```

Then CSS applies:

```css
.status-wfo {
    background-color: #B7E4C7;
}
```

So the cell becomes green.

---

# 34. The State-to-Color Architecture

This is a very important design pattern.

Suppose the attendance state is:

```text
WFO
```

JavaScript converts that state to:

```text
status-wfo
```

HTML applies:

```html
class="status-wfo"
```

CSS applies:

```text
green
```

The complete flow is:

```text
Business State
     ↓
WFO
     ↓
JavaScript
     ↓
status-wfo
     ↓
HTML class
     ↓
CSS
     ↓
Green cell
```

The same architecture works for:

```text
WFH → status-wfh
WO → status-wo
Leave → status-leave
LOP → status-lop
Holiday → status-holiday
Empty → status-empty
```

This keeps the code organized because JavaScript controls **logic/state**, while CSS controls **appearance**.

---

# 35. The Attendance Combobox

Inside every attendance cell you have:

```html
<lightning-combobox
    variant="label-hidden"
    value={day.status}
    options={statusOptions}
    data-employee-id={row.employeeId}
    data-date={day.date}
    onchange={handleCellStatusChange}>
</lightning-combobox>
```

This means every employee/day cell is interactive.

For example:

```text
Anik + August 15

┌──────────────┐
│ [ WFO     ▼]│
└──────────────┘
```

---

# 36. `variant="label-hidden"`

Normally a Lightning combobox would display a label.

For example:

```text
Status
[ WFO ▼ ]
```

But having "Status" repeated inside every attendance cell would make the table huge.

Therefore:

```html
variant="label-hidden"
```

means:

> Keep the label available for the component/accessibility, but don't display it visibly.

This keeps the attendance grid compact.

---

# 37. `value={day.status}`

```html
value={day.status}
```

This tells the dropdown which status is currently selected for this specific cell.

For example:

```javascript
day.status = 'WFO';
```

The dropdown shows:

```text
[ WFO ▼ ]
```

If:

```javascript
day.status = 'WFH';
```

it shows:

```text
[ WFH ▼ ]
```

Therefore the same HTML is reused for every cell, but the displayed value changes according to the JavaScript data.

---

# 38. `options={statusOptions}`

```html
options={statusOptions}
```

This tells every attendance dropdown which statuses the user can select.

For example, JavaScript may contain:

```javascript
statusOptions = [
    { label: 'WFO', value: 'WFO' },
    { label: 'WFH', value: 'WFH' },
    { label: 'WO', value: 'WO' },
    { label: 'Leave', value: 'Leave' },
    { label: 'LOP', value: 'LOP' },
    { label: 'Holiday', value: 'Holiday' }
];
```

Again:

```text
label → User sees it
value → Application uses it
```

---

# 39. `data-employee-id`

```html
data-employee-id={row.employeeId}
```

This stores the employee ID on the dropdown element.

For example:

```text
Employee ID = 001
```

The rendered control conceptually contains:

```text
data-employee-id="001"
```

Why is this necessary?

Because when the user changes a dropdown, JavaScript needs to know:

> Which employee's attendance was changed?

---

# 40. `data-date`

Similarly:

```html
data-date={day.date}
```

stores the date.

For example:

```text
data-date="2026-08-15"
```

Now the event handler can determine:

```text
Employee = 001
Date = 2026-08-15
```

---

# 41. `onchange={handleCellStatusChange}`

This is what makes each attendance cell saveable.

When the user changes:

```text
WFO → WFH
```

the combobox fires the change event.

Then LWC calls:

```javascript
handleCellStatusChange(event)
```

The JavaScript can read:

- Employee ID
- Date
- New status

and then call the Apex method that saves attendance.

---

# 42. Complete Attendance Change Flow

Suppose:

```text
Employee = Anik Mallick
Date = 2026-08-15
Current Status = WFO
```

The user changes it:

```text
WFO → WFH
```

The complete flow is:

```text
1. User selects WFH
          ↓
2. lightning-combobox detects change
          ↓
3. onchange fires
          ↓
4. handleCellStatusChange(event)
          ↓
5. JavaScript reads employee ID
          ↓
6. JavaScript reads date
          ↓
7. JavaScript reads new status
          ↓
8. JavaScript calls saveAttendance(...)
          ↓
9. Apex receives employeeId, attendanceDate, status, remarks
          ↓
10. Apex searches Attendance__c
          ↓
11. Existing record?
       YES → UPDATE
       NO  → INSERT
          ↓
12. Salesforce saves the attendance
```

This is the real connection between the HTML, JavaScript, and Apex.

---

# 43. Monthly Summary Placeholder

At the bottom:

```html
<lightning-card title="Monthly Summary">
```

creates another card.

Currently it contains:

```html
<div class="summary-message">
    <span class="summary-icon"></span>
    <span>Monthly Summary will be available in the next phase.</span>
</div>
```

So right now it is only a placeholder.

In a future phase, it could display:

```text
Monthly Summary

WFO: 18
WFH: 5
Leave: 2
LOP: 1
WO: 4
Holiday: 1
```

The current HTML simply reserves the space for that future functionality.

---

# 44. CSS — The Appearance Layer

Your CSS is responsible for the visual presentation.

It does not normally:

- retrieve Salesforce data
- save attendance
- call Apex
- calculate dates
- determine which employee exists

Those responsibilities belong to JavaScript/Apex.

CSS controls things such as:

```text
Width
Height
Color
Spacing
Alignment
Borders
Sticky positioning
Backgrounds
Font appearance
```

---

# 45. `.attendance-table`

Your CSS starts with:

```css
.attendance-table {
    width: max-content;
    min-width: 100%;
    border-collapse: separate;
    border-spacing: 4px 3px;
}
```

## `width: max-content`

This tells the table:

> Allow the table to become wide enough to fit its contents.

This is useful because your table can have many day columns.

For example:

```text
Employee | 1 | 2 | 3 | ... | 31
```

---

# 46. `min-width: 100%`

```css
min-width: 100%;
```

This means:

> The table should not become smaller than the width of its available container.

So you combine:

```text
max-content
+
minimum 100%
```

This allows the table to work for both smaller and larger content.

---

# 47. `border-collapse: separate`

```css
border-collapse: separate;
```

This tells the browser to keep the table cell borders separate rather than collapsing them into a single shared border.

This is useful because you are also using:

```css
border-spacing
```

to create visual space between cells.

---

# 48. `border-spacing: 4px 3px`

```css
border-spacing: 4px 3px;
```

The first value controls horizontal spacing.

The second controls vertical spacing.

So:

```text
Horizontal = 4px
Vertical   = 3px
```

This gives your attendance cells some separation.

---

# 49. Table Cell Styling

You have:

```css
.attendance-table th,
.attendance-table td {
    text-align: center;
    vertical-align: middle;
    white-space: nowrap;
    padding: 6px 8px;
}
```

This applies the rules to both `<th>` and `<td>` elements inside `.attendance-table`.

## `text-align: center`

Centers text horizontally.

## `vertical-align: middle`

Centers content vertically.

## `white-space: nowrap`

Prevents content from wrapping to multiple lines.

## `padding: 6px 8px`

Adds:

```text
6px top/bottom
8px left/right
```

of internal space.

---

# 50. `.employee-column`

Your CSS:

```css
.employee-column {
    position: sticky;
    left: 0;
    z-index: 3;
    min-width: 170px;
    max-width: 170px;
    text-align: left !important;
    background: white;
}
```

This is especially important for the Employee column.

---

# 51. `position: sticky`

```css
position: sticky;
```

makes the element behave normally until it reaches a defined boundary, after which it sticks in place during scrolling.

Combined with:

```css
left: 0;
```

the Employee column sticks to the left side.

Without this, horizontal scrolling could cause:

```text
Employee | 1 | 2 | 3 | ... | 31
```

to move entirely out of view.

With sticky positioning:

```text
Employee | 20 | 21 | 22 | 23 | ...
   ↑
stays visible
```

This is particularly useful in wide attendance tables.

---

# 52. `left: 0`

```css
left: 0;
```

means:

> Stick the element at the left edge of its scrolling area.

This works together with:

```css
position: sticky;
```

`left: 0` by itself would not create the sticky behavior.

---

# 53. `z-index: 3`

```css
z-index: 3;
```

controls stacking order.

The Employee column needs to appear above the horizontally scrolling cells.

Conceptually:

```text
Higher z-index
      ↓
Appears in front
```

Therefore the sticky Employee column can visually sit above the moving day cells.

---

# 54. Why `background: white` Is Important

```css
background: white;
```

This is important for a sticky column.

The Employee column needs an opaque background so that the scrolling cells underneath do not visually show through it.

Without a background, the sticky area could look transparent.

---

# 55. Employee Column Width

```css
min-width: 170px;
max-width: 170px;
```

Both are set to 170px.

This effectively gives the Employee column a fixed width of approximately:

```text
170px
```

This prevents the employee column from becoming too narrow or unnecessarily wide.

---

# 56. `text-align: left !important`

Most of your table cells use:

```css
text-align: center;
```

But employee names should normally be left aligned.

Therefore:

```css
text-align: left !important;
```

overrides the more general table rule.

So:

```text
Employee names → left aligned
Attendance cells → centered
```

---

# 57. `.day-column`

```css
.day-column {
    min-width: 70px;
    max-width: 70px;
    background: #f3f3f3;
}
```

Each day column is approximately:

```text
70px
```

wide.

The light gray background makes the day header visually distinct from the attendance cells.

---

# 58. `.attendance-cell`

You also have:

```css
.attendance-cell {
    min-width: 70px;
    max-width: 70px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
}
```

This provides styling for attendance cells if the class is used.

## `overflow: hidden`

Prevents content from spilling outside the cell.

## `text-overflow: ellipsis`

When used with suitable width/overflow conditions, long content can be represented with `...`.

## `font-weight: 500`

Makes text slightly heavier than normal.

---

# 59. Status Colors

The attendance statuses have individual CSS classes.

## WFO

```css
.status-wfo {
    background-color: #B7E4C7;
    --slds-c-input-color-background: #B7E4C7;
    border-radius: 4px;
    font-weight: 500;
}
```

WFO gets a light green background.

---

# 60. Why Are There Two Background Properties?

For example:

```css
background-color: #B7E4C7;
```

and:

```css
--slds-c-input-color-background: #B7E4C7;
```

They serve different purposes.

## `background-color`

Styles the regular HTML element/cell.

## `--slds-c-input-color-background`

This is a Salesforce Lightning styling hook.

Your attendance cell contains:

```html
<lightning-combobox>
```

The internals of a Salesforce base component are not styled in exactly the same way as your own normal HTML.

Salesforce provides styling hooks so you can influence certain parts of its base components.

Therefore the code is effectively saying:

> Make the cell background this color and also ask the Lightning input component to use the same background color.

---

# 61. `border-radius`

For example:

```css
border-radius: 4px;
```

slightly rounds the corners.

Instead of:

```text
┌──────────┐
│   WFO    │
└──────────┘
```

you get slightly rounded corners.

---

# 62. All Attendance Status Classes

Your status classes create a visual state system:

| Status | CSS class | Visual purpose |
|---|---|---|
| WFO | `.status-wfo` | Work From Office |
| WFH | `.status-wfh` | Work From Home |
| WO | `.status-wo` | Weekly Off |
| Leave | `.status-leave` | Leave |
| LOP | `.status-lop` | Loss of Pay |
| Holiday | `.status-holiday` | Holiday |
| Empty | `.status-empty` | No status |

The JavaScript chooses the class, and CSS chooses the appearance.

---

# 63. `.status-wfh`

```css
.status-wfh {
    background-color: #BDE0FE;
    --slds-c-input-color-background: #BDE0FE;
    border-radius: 4px;
    font-weight: 500;
}
```

This gives WFH a light blue appearance.

---

# 64. `.status-wo`

```css
.status-wo {
    background-color: #e2e8ed;
    --slds-c-input-color-background: #e2e8ed;
    border-radius: 4px;
    font-weight: 500;
}
```

This gives Weekly Off a light gray appearance.

---

# 65. `.status-leave`

```css
.status-leave {
    background-color: #fff1c7;
    --slds-c-input-color-background: #fff1c7;
    border-radius: 4px;
    font-weight: 500;
}
```

This gives Leave a light yellow appearance.

---

# 66. `.status-lop`

```css
.status-lop {
    background-color: #f8d7da;
    --slds-c-input-color-background: #f8d7da;
    border-radius: 4px;
    font-weight: 500;
}
```

This gives Loss of Pay a light red/pink appearance.

---

# 67. `.status-holiday`

```css
.status-holiday {
    background-color: #e6d5f7;
    --slds-c-input-color-background: #e6d5f7;
    border-radius: 4px;
    font-weight: 500;
}
```

This gives Holiday a light purple appearance.

---

# 68. `.status-empty`

```css
.status-empty {
    background-color: white;
    --slds-c-input-color-background: white;
    border-radius: 4px;
}
```

This is used when no attendance status is present.

The cell appears white.

---

# 69. Status Legend CSS

The legend container:

```css
.status-legend {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 18px;
    margin-bottom: 12px;
    flex-wrap: wrap;
}
```

## `display: flex`

Places legend items in a flexible row.

## `justify-content: flex-end`

Moves the items toward the right side.

Conceptually:

```text
                         WFO WFH WO Leave LOP Holiday
```

## `align-items: center`

Vertically aligns the colored boxes and text.

## `gap: 18px`

Adds 18px of space between items.

## `margin-bottom: 12px`

Creates space between the legend and the table.

## `flex-wrap: wrap`

If the available screen width becomes too small, the legend items can move onto another line.

---

# 70. `.legend-item`

```css
.legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
}
```

Each legend item consists of:

```text
[Color Box] WFO
```

`display: flex` places them horizontally.

`gap: 6px` creates space between the box and text.

`font-size: 13px` controls the legend text size.

---

# 71. `.legend-box`

```css
.legend-box {
    width: 22px;
    height: 14px;
    border-radius: 3px;
    display: inline-block;
}
```

This controls the physical shape of the color indicator.

It is:

```text
Width  = 22px
Height = 14px
```

The actual color is supplied by the status class.

For example:

```html
<span class="legend-box status-wfo"></span>
```

uses:

```text
legend-box → shape
status-wfo → color
```

This is a good example of using multiple CSS classes for different responsibilities.

---

# 72. Monthly Summary CSS

Your summary message uses:

```css
.summary-message {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border: 1px solid #b8d8f5;
    border-radius: 4px;
    background-color: #eef6ff;
    font-size: 14px;
}
```

This creates a light blue information box.

Conceptually:

```text
┌──────────────────────────────────────────────────────┐
│  Monthly Summary will be available in the next phase │
└──────────────────────────────────────────────────────┘
```

---

# 73. Breaking Down `.summary-message`

## `display: flex`

Places the icon and message next to each other.

## `align-items: center`

Vertically centers them.

## `gap: 10px`

Adds 10px between the icon and text.

## `padding: 12px 16px`

Adds:

```text
12px top/bottom
16px left/right
```

of internal space.

## `border`

Creates the light blue border.

## `border-radius`

Rounds the corners.

## `background-color`

Creates the light blue background.

## `font-size`

Controls the text size.

---

# 74. `.summary-icon`

```css
.summary-icon {
    font-weight: bold;
    font-size: 18px;
}
```

This controls the styling of the summary icon element.

Currently the `<span>` is empty:

```html
<span class="summary-icon"></span>
```

so this class is prepared for an icon/visual element.

---

# 75. The Entire HTML Structure

The complete HTML can be mentally simplified to:

```text
<template>
│
└── Attendance Tracker Card
    │
    ├── Month / Year Selection
    │   │
    │   ├── Month Combobox
    │   │
    │   └── Year Combobox
    │
    ├── Attendance Grid Card
    │   │
    │   ├── Status Legend
    │   │
    │   └── Attendance Table
    │       │
    │       ├── Header
    │       │   ├── Employee
    │       │   ├── Day 1
    │       │   ├── Day 2
    │       │   └── ...
    │       │
    │       └── Body
    │           │
    │           ├── Employee 1
    │           │   ├── Day 1
    │           │   ├── Day 2
    │           │   └── ...
    │           │
    │           ├── Employee 2
    │           │   ├── Day 1
    │           │   ├── Day 2
    │           │   └── ...
    │           │
    │           └── ...
    │
    └── Monthly Summary Card
```

---

# 76. The Two Most Important Loops

Your attendance grid depends heavily on two loops.

## Loop 1 — Employees

```html
<template for:each={employeeRows} for:item="row">
```

This creates the employee rows.

## Loop 2 — Days

```html
<template for:each={row.days} for:item="day">
```

This creates the individual attendance cells for each employee.

Together:

```text
              Days
          1    2    3    4    5
       ┌────┬────┬────┬────┬────┐
Anik   │    │    │    │    │    │
       ├────┼────┼────┼────┼────┤
Ayan   │    │    │    │    │    │
       ├────┼────┼────┼────┼────┤
Riju   │    │    │    │    │    │
       └────┴────┴────┴────┴────┘
```

This is why the attendance table is effectively a two-dimensional data structure.

---

# 77. The Most Important Connection in the Component

The most important relationship to understand is:

```text
                 APEX
                  │
                  │ Salesforce Data
                  ▼
              JAVASCRIPT
                  │
       ┌──────────┼──────────┐
       │          │          │
       ▼          ▼          ▼
   employees     days    employeeRows
       │          │          │
       └──────────┼──────────┘
                  │
                  ▼
                 HTML
                  │
          Creates the UI
                  │
                  ▼
                 CSS
                  │
       Controls appearance
```

And when the user changes an attendance value:

```text
USER
 │
 │ Changes WFO → WFH
 ▼
HTML
 │
 │ onchange
 ▼
JavaScript
 │
 │ saveAttendance(...)
 ▼
Apex
 │
 ▼
Attendance__c
```

---

# 78. Example: Anik Mallick on August 15

Let's follow one actual attendance cell through the application.

Suppose JavaScript has:

```javascript
{
    employeeId: '001',
    employeeName: 'Anik Mallick',
    days: [
        {
            date: '2026-08-15',
            status: 'WFO',
            statusClass: 'status-wfo'
        }
    ]
}
```

The HTML processes the employee:

```html
<template for:each={employeeRows} for:item="row">
```

It finds:

```text
row.employeeName = Anik Mallick
```

Then it processes the employee's days:

```html
<template for:each={row.days} for:item="day">
```

It finds:

```text
day.date = 2026-08-15
day.status = WFO
day.statusClass = status-wfo
```

Then:

```html
<td key={day.date} class={day.statusClass}>
```

becomes conceptually:

```html
<td class="status-wfo">
```

The CSS then applies:

```css
.status-wfo {
    background-color: #B7E4C7;
}
```

The combobox receives:

```html
value={day.status}
```

which means:

```text
WFO
```

So the user sees something like:

```text
Anik Mallick
      │
      └── August 15
            ┌────────────┐
            │ [ WFO ▼ ]  │
            └────────────┘
```

The cell is visually green.

---

# 79. What Happens When Anik Changes WFO to WFH?

The user changes:

```text
WFO → WFH
```

The Lightning combobox fires:

```html
onchange={handleCellStatusChange}
```

JavaScript receives the event.

The HTML has stored:

```text
data-employee-id
data-date
```

so JavaScript can identify:

```text
Employee = Anik Mallick
Date = 2026-08-15
New Status = WFH
```

JavaScript then calls the Apex method:

```text
saveAttendance(...)
```

Apex receives:

```text
employeeId
attendanceDate
status
remarks
```

Apex searches `Attendance__c`.

If a record already exists:

```text
UPDATE
```

If it doesn't:

```text
INSERT
```

This is the complete lifecycle of one attendance cell.

---

# 80. Final Mental Model

Don't try to memorize every HTML tag or CSS property immediately.

Instead, remember these four responsibilities:

```text
APEX
"What Salesforce data do I need?"
        ↓
JAVASCRIPT
"What should the application do with that data?"
        ↓
HTML
"How should that data be displayed?"
        ↓
CSS
"How should that display look?"
```

For the Attendance Tracker:

```text
Apex
↓
Employees + Attendance + Holidays
↓
JavaScript
↓
employeeRows + days + statuses
↓
HTML
↓
Attendance table
↓
CSS
↓
Colors + sticky Employee column + spacing + layout
```

And for user interaction:

```text
User
↓
HTML event
↓
JavaScript method
↓
Apex method
↓
Salesforce record
```

Once this flow becomes clear, the individual lines of your LWC code become much easier to understand.
