# Attendance Tracker — LWC JavaScript Revision Notes (Part 1)

## 1. The beginning of the LWC JavaScript

The first lines of `attendanceMonthlyView.js` establish the connection between the LWC and Salesforce/Apex.

```javascript
import { LightningElement } from 'lwc';

import getActiveEmployees from '@salesforce/apex/AttendanceController.getActiveEmployees';
import getMonthlyAttendance from '@salesforce/apex/AttendanceController.getMonthlyAttendance';
import getMonthlyHolidays from '@salesforce/apex/AttendanceController.getMonthlyHolidays';
import saveAttendance from '@salesforce/apex/AttendanceController.saveAttendance';
```

---

## 2. What does `import` mean?

`import` allows JavaScript to use something created in another module.

```javascript
import something from 'somewhere';
```

means:

> "I want to use something that was created somewhere else."

In:

```javascript
import { LightningElement } from 'lwc';
```

we get `LightningElement` from Salesforce's LWC framework.

---

## 3. What is `LightningElement`?

`LightningElement` is a base class provided by Salesforce.

Your component uses it here:

```javascript
export default class AttendanceMonthlyView extends LightningElement {
```

Conceptually:

```text
LightningElement
       |
       | provides LWC functionality
       v
AttendanceMonthlyView
```

`AttendanceMonthlyView` inherits functionality from `LightningElement`.

Simple rule:

> Every normal LWC component extends `LightningElement`.

---

## 4. Importing Apex methods

The JavaScript imports four methods from `AttendanceController.cls`:

```javascript
import getActiveEmployees from '@salesforce/apex/AttendanceController.getActiveEmployees';
import getMonthlyAttendance from '@salesforce/apex/AttendanceController.getMonthlyAttendance';
import getMonthlyHolidays from '@salesforce/apex/AttendanceController.getMonthlyHolidays';
import saveAttendance from '@salesforce/apex/AttendanceController.saveAttendance';
```

These connect JavaScript to the Apex methods:

```text
AttendanceController.cls
        |
        +-- getActiveEmployees()
        +-- getMonthlyAttendance()
        +-- getMonthlyHolidays()
        +-- saveAttendance()
                    ^
                    | imported
                    |
attendanceMonthlyView.js
```

For example:

```javascript
import getActiveEmployees from '@salesforce/apex/AttendanceController.getActiveEmployees';
```

means:

> Access the `getActiveEmployees` Apex method from the `AttendanceController` Apex class.

After importing it, JavaScript can call:

```javascript
getActiveEmployees()
```

---

## 5. Understanding the Apex import path

This:

```javascript
'@salesforce/apex/AttendanceController.getActiveEmployees'
```

can be understood as:

```text
@salesforce
     |
    apex
     |
AttendanceController
     |
getActiveEmployees
```

It means:

> "Use the `getActiveEmployees` method from the `AttendanceController` Apex class."

This is the bridge between your LWC and Apex.

---

## 6. How JavaScript and Apex connect

In Apex:

```apex
@AuraEnabled(cacheable=true)
public static List<Employee__c> getActiveEmployees()
```

In JavaScript:

```javascript
getActiveEmployees()
```

These are connected.

```text
Apex
AttendanceController
       |
       +-- getActiveEmployees()
                  ^
                  | connection
                  v
JavaScript
getActiveEmployees()
```

The JavaScript reference represents the Apex method.

---

## 7. How `saveAttendance` connects to Apex

JavaScript imports:

```javascript
import saveAttendance from '@salesforce/apex/AttendanceController.saveAttendance';
```

Later, JavaScript calls:

```javascript
saveAttendance({
    employeeId: employeeId,
    attendanceDate: attendanceDate,
    status: status,
    remarks: ''
})
```

The Apex method expects:

```apex
saveAttendance(
    Id employeeId,
    Date attendanceDate,
    String status,
    String remarks
)
```

So JavaScript sends those values to Apex.

```text
LWC JavaScript
      |
      | employeeId
      | attendanceDate
      | status
      | remarks
      v
saveAttendance()
      |
      v
AttendanceController
      |
      v
Salesforce Database
```

---

## 8. Understanding the class

```javascript
export default class AttendanceMonthlyView extends LightningElement {
```

### `export`

Makes the class available to other parts of the application.

### `default`

Indicates that this is the default export of the file.

### `class AttendanceMonthlyView`

Creates a JavaScript class named `AttendanceMonthlyView`.

This represents your LWC component.

### `extends LightningElement`

The component inherits functionality from Salesforce's `LightningElement`.

---

## 9. Selected month and year

```javascript
selectedMonth = '8';
selectedYear = '2026';
```

These are properties of your component.

Currently:

```text
selectedMonth = '8'
selectedYear  = '2026'
```

means:

```text
August 2026
```

They are strings because the combobox values are strings.

For example:

```javascript
{ label: 'August', value: '8' }
```

Later, when Apex needs numbers, JavaScript converts them:

```javascript
Number(this.selectedMonth)
Number(this.selectedYear)
```

For example:

```text
'8'    -> 8
'2026' -> 2026
```

---

## 10. The main arrays

Your component contains:

```javascript
employees = [];
attendanceRecords = [];
holidayRecords = [];
days = [];
employeeRows = [];
```

Think of each array as an empty container that will later hold data.

### `employees`

```javascript
employees = [];
```

Eventually:

```text
employees
   |
   v
[Employee 1, Employee 2, Employee 3, ...]
```

These records come from:

```javascript
getActiveEmployees()
```

### `attendanceRecords`

```javascript
attendanceRecords = [];
```

Eventually:

```text
attendanceRecords
   |
   v
[Attendance 1, Attendance 2, Attendance 3, ...]
```

These come from:

```javascript
getMonthlyAttendance()
```

### `holidayRecords`

```javascript
holidayRecords = [];
```

Eventually:

```text
holidayRecords
   |
   v
[Holiday 1, Holiday 2, ...]
```

These come from:

```javascript
getMonthlyHolidays()
```

### `days`

```javascript
days = [];
```

This array is created by JavaScript.

For August 2026 it eventually contains objects similar to:

```javascript
[
    { dayNumber: 1, dayName: 'Sat', date: '2026-08-01' },
    { dayNumber: 2, dayName: 'Sun', date: '2026-08-02' },
    { dayNumber: 3, dayName: 'Mon', date: '2026-08-03' }
]
```

This is generated by:

```javascript
generateDays()
```

### `employeeRows`

```javascript
employeeRows = [];
```

This is one of the most important arrays for the UI.

It combines:

```text
Employee
+
Days
+
Attendance
+
Holiday
```

Conceptually:

```text
employeeRows
|
+-- Employee 1
|     +-- Aug 1 -> WO
|     +-- Aug 2 -> WO
|     +-- Aug 3 -> WFO
|     +-- Aug 4 -> WFH
|
+-- Employee 2
|     +-- Aug 1 -> WFO
|     +-- Aug 2 -> WO
|     +-- Aug 3 -> Leave
|     +-- Aug 4 -> WFO
|
+-- Employee 3
      ...
```

This is ultimately what the HTML attendance grid displays.

---

## 11. `statusOptions`

```javascript
statusOptions = [
    { label: 'Office', value: 'WFO' },
    { label: 'Home', value: 'WFH' },
    { label: 'Off', value: 'WO' },
    { label: 'Leave', value: 'Leave' },
    { label: 'LOP', value: 'LOP' },
    { label: 'Holiday', value: 'Holiday' }
];
```

Each object contains:

```text
label
value
```

The `label` is what the user sees in the UI.

The `value` is what the application uses internally.

For example:

```javascript
{ label: 'Office', value: 'WFO' }
```

means:

```text
User sees: Office
Application value: WFO
```

This is useful because the UI can show a user-friendly name while the application continues to use the existing Salesforce attendance status value.

The current options are:

| Label shown to the user | Internal value |
|---|---|
| Office | WFO |
| Home | WFH |
| Off | WO |
| Leave | Leave |
| LOP | LOP |
| Holiday | Holiday |

So, for example:

```text
Office
  ↓
WFO
```

The user selects **Office**, but JavaScript receives and saves **WFO**.

---

## 12. `monthOptions`

```javascript
monthOptions = [
    { label: 'January', value: '1' },
    { label: 'February', value: '2' },
    ...
    { label: 'August', value: '8' },
    ...
    { label: 'December', value: '12' }
];
```

Again:

```text
label -> what the user sees
value -> what JavaScript stores
```

So the UI might display:

```text
August ▼
```

while JavaScript stores:

```javascript
selectedMonth = '8';
```

---

## 13. `yearOptions`

```javascript
yearOptions = this.generateYearOptions();
```

This means:

> When the component is initialized, call `generateYearOptions()` and use the returned array as `yearOptions`.

The flow is:

```text
generateYearOptions()
        |
        v
creates year array
        |
        v
returns array
        |
        v
yearOptions
```

---

## 14. Understanding `generateYearOptions()`

```javascript
generateYearOptions() {
    const currentYear = new Date().getFullYear();
    const years = [];

    for (let year = 2025; year <= currentYear + 20; year++) {
        years.push({
            label: String(year),
            value: String(year)
        });
    }

    return years;
}
```

### `new Date().getFullYear()`

```javascript
const currentYear = new Date().getFullYear();
```

Gets the current year from the browser/computer.

For example:

```text
2026
```

So:

```javascript
currentYear = 2026;
```

### Creating the empty array

```javascript
const years = [];
```

Creates:

```text
years = []
```

This array will receive the year options.

### The `for` loop

```javascript
for (let year = 2025; year <= currentYear + 20; year++)
```

This means:

> Start at 2025 and keep increasing the year until reaching 20 years after the current year.

If the current year is 2026:

```text
2025
2026
2027
...
2046
```

### `push()`

```javascript
years.push({
    label: String(year),
    value: String(year)
});
```

`push()` adds an item to the end of an array.

The result becomes conceptually:

```javascript
[
    { label: '2025', value: '2025' },
    { label: '2026', value: '2026' },
    { label: '2027', value: '2027' },
    ...
]
```

### Why `String(year)`?

The loop variable `year` is a number.

For example:

```text
2026
```

`String(year)` converts it to:

```text
'2026'
```

This keeps the year option values consistent with:

```javascript
selectedYear = '2026';
```

### `return years`

```javascript
return years;
```

The method sends the completed array back.

So:

```text
generateYearOptions()
        |
        v
creates array
        |
        v
return years
        |
        v
yearOptions
```

---

# 15. Important picture so far

Your JavaScript currently has three major responsibilities:

```text
                 AttendanceMonthlyView
                         |
          +--------------+--------------+
          v              v              v
      Connect to     Store data      Create UI
         Apex          arrays        options
          |              |              |
          v              v              v
    getEmployees     employees      monthOptions
    getAttendance    attendance     yearOptions
    getHolidays      holidays       statusOptions
    saveAttendance   days
                     employeeRows
```

The next section explains how the component actually starts working and responds when the user changes the month or year.

The next methods are:

```javascript
handleMonthChange(event)
handleYearChange(event)
connectedCallback()
generateDays()
```

These explain:

- How the component reacts to user input
- What `event` means
- What `event.detail.value` means
- What `connectedCallback()` does
- When your JavaScript starts running
- How `generateDays()` creates 28/29/30/31 days
- How the selected month and year flow into the application
