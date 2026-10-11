# Attendance Tracker — LWC JavaScript Revision Notes (Part 4)

## Part 4 — Building, Styling, and Updating the Attendance Grid

This section covers three connected methods:

1. `buildEmployeeRows()`
2. `getStatusClass(status)`
3. `handleCellStatusChange(event)`

Together, these methods build the attendance grid, apply CSS classes, handle user changes, and save attendance data to Salesforce.

---

## 1. `buildEmployeeRows()`

```javascript
buildEmployeeRows() {

    this.employeeRows = [];

    this.employees.forEach(employee => {

        const row = {
            employeeId: employee.Id,
            employeeName: employee.Name,
            days: []
        };

        this.days.forEach(day => {

            const attendance = this.attendanceRecords.find(record =>
                record.Employee__c === employee.Id &&
                record.Attendance_Date__c === day.date
            );

            const holiday = this.holidayRecords.find(record =>
                record.Holiday_Date__c === day.date
            );

            let status = '';

            if (holiday) {
                status = holiday.Name;
            } else if (attendance) {
                status = attendance.Status__c;
            } else if (day.dayName === 'Sat' || day.dayName === 'Sun') {
                status = 'WO';
            }

            row.days.push({
                date: day.date,
                dayNumber: day.dayNumber,
                dayName: day.dayName,
                status: status,
                statusClass: this.getStatusClass(status)
            });

        });

        this.employeeRows.push(row);
    });
}
```

### Purpose

This method takes separate data from Apex and JavaScript and combines it into the structure required by the HTML attendance grid.

```text
Employees
     +
Days
     +
Attendance
     +
Holidays
     ↓
buildEmployeeRows()
     ↓
employeeRows
     ↓
HTML Attendance Grid
```

### Start with an empty array

```javascript
this.employeeRows = [];
```

This clears old rows before rebuilding them, which is important when the user changes the month or year.

### Loop through employees

```javascript
this.employees.forEach(employee => {
```

`forEach()` runs the code once for every employee.

### Create an employee row

```javascript
const row = {
    employeeId: employee.Id,
    employeeName: employee.Name,
    days: []
};
```

Each row stores the employee ID, employee name, and an initially empty `days` array.

### Loop through days

```javascript
this.days.forEach(day => {
```

For every employee, the code processes every day of the selected month.

Conceptually:

```text
Employee 1
   ↓
   Day 1, Day 2, Day 3 ... Day 31

Employee 2
   ↓
   Day 1, Day 2, Day 3 ... Day 31
```

### Find attendance

```javascript
const attendance = this.attendanceRecords.find(record =>
    record.Employee__c === employee.Id &&
    record.Attendance_Date__c === day.date
);
```

`find()` searches the attendance array for the first record where:

```text
Employee matches
       AND
Date matches
```

`&&` means **AND**.

If no matching record exists, `find()` returns `undefined`.

### Find holiday

```javascript
const holiday = this.holidayRecords.find(record =>
    record.Holiday_Date__c === day.date
);
```

This searches for a holiday matching the current date.

There is no employee check because a holiday applies to everyone.

### Determine the status

```javascript
let status = '';
```

The status starts empty.

Then the code checks:

```javascript
if (holiday) {
    status = holiday.Name;
} else if (attendance) {
    status = attendance.Status__c;
} else if (day.dayName === 'Sat' || day.dayName === 'Sun') {
    status = 'WO';
}
```

The priority is:

```text
Holiday
   ↓
Attendance
   ↓
Weekend
   ↓
Empty
```

`||` means **OR**, so Saturday or Sunday becomes `WO` when there is no holiday or attendance record.

### Add day information

```javascript
row.days.push({
    date: day.date,
    dayNumber: day.dayNumber,
    dayName: day.dayName,
    status: status,
    statusClass: this.getStatusClass(status)
});
```

`push()` adds the day object to the employee's `days` array.

For example:

```javascript
{
    date: '2026-08-05',
    dayNumber: 5,
    dayName: 'Wed',
    status: 'WFO',
    statusClass: 'status-wfo'
}
```

### Add the completed employee row

```javascript
this.employeeRows.push(row);
```

After all days for an employee have been processed, the completed row is added to `employeeRows`.

---

## 2. `getStatusClass(status)`

```javascript
getStatusClass(status) {

    switch (status) {

        case 'WFO':
            return 'status-wfo';

        case 'WFH':
            return 'status-wfh';

        case 'WO':
            return 'status-wo';

        case 'Leave':
            return 'status-leave';

        case 'LOP':
            return 'status-lop';

        case 'Holiday':
            return 'status-holiday';

        default:
            return 'status-empty';
    }
}
```

### Purpose

This method converts an attendance status into the CSS class used by the UI.

```text
WFO      → status-wfo
WFH      → status-wfh
WO       → status-wo
Leave    → status-leave
LOP      → status-lop
Holiday  → status-holiday
Anything else → status-empty
```

### `switch`

```javascript
switch (status)
```

`switch` compares one value against several possible values.

For example:

```javascript
case 'WFO':
    return 'status-wfo';
```

means:

> If `status` is `WFO`, return `status-wfo`.

### `return`

`return` sends a value back from the method.

For example:

```javascript
this.getStatusClass('WFO')
```

returns:

```text
status-wfo
```

### `default`

```javascript
default:
    return 'status-empty';
```

This is the fallback when none of the known cases match.

### Connection with the updated status labels

Your current status options use user-friendly labels but keep the same internal values:

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

Therefore:

```text
User sees     Internal value

Office   →    WFO
Home     →    WFH
Off      →    WO
Leave    →    Leave
LOP      →    LOP
Holiday  →    Holiday
```

`getStatusClass()` correctly continues to use the internal values.

---

## 3. `handleCellStatusChange(event)`

```javascript
handleCellStatusChange(event) {

    const employeeId = event.target.dataset.employeeId;
    const attendanceDate = event.target.dataset.date;
    const status = event.detail.value;

    this.employeeRows = this.employeeRows.map(row => {
        if (row.employeeId === employeeId) {
            return {
                ...row,
                days: row.days.map(day => {
                    if (day.date === attendanceDate) {
                        return {
                            ...day,
                            status: status,
                            statusClass: this.getStatusClass(status)
                        };
                    }
                    return day;
                })
            };
        }
        return row;
    });

    console.log('Employee ID:', employeeId);
    console.log('Attendance Date:', attendanceDate);
    console.log('Selected Status:', status);

    saveAttendance({
        employeeId: employeeId,
        attendanceDate: attendanceDate,
        status: status,
        remarks: ''
    })
    .then(result => {
        console.log('Attendance saved successfully:', result);
    })
    .catch(error => {
        console.error('Error saving attendance:', error);
    });
}
```

### Purpose

This method handles a user's change to an individual attendance cell.

The basic flow is:

```text
User changes a cell
       ↓
Event is generated
       ↓
handleCellStatusChange(event)
```

---

## 4. Get the Employee ID

```javascript
const employeeId = event.target.dataset.employeeId;
```

`event.target` is the UI element that triggered the event.

`dataset` gives access to custom `data-*` attributes.

So this retrieves the value stored in:

```text
data-employee-id
```

---

## 5. Get the Attendance Date

```javascript
const attendanceDate = event.target.dataset.date;
```

This retrieves the value stored in:

```text
data-date
```

For example:

```text
2026-08-05
```

Now JavaScript knows which employee and which date were changed.

---

## 6. Get the Selected Status

```javascript
const status = event.detail.value;
```

This gets the value selected by the user.

Because the current options use:

```javascript
{ label: 'Office', value: 'WFO' }
```

the user sees:

```text
Office
```

but JavaScript receives:

```text
WFO
```

So:

```javascript
status = 'WFO';
```

---

## 7. The Three Important Values

After these lines:

```javascript
const employeeId = event.target.dataset.employeeId;
const attendanceDate = event.target.dataset.date;
const status = event.detail.value;
```

we have:

```text
Employee
   ↓
employeeId

Date
   ↓
attendanceDate

New status
   ↓
status
```

For example:

```text
Employee ID = EMP001
Date        = 2026-08-05
Status      = WFO
```

---

## 8. Update `employeeRows` with `map()`

```javascript
this.employeeRows = this.employeeRows.map(row => {
```

`map()` creates a new array based on the existing array.

The component goes through every employee row and creates an updated version.

```text
Old employeeRows
       ↓
      map()
       ↓
New employeeRows
```

---

## 9. Find the Correct Employee Row

```javascript
if (row.employeeId === employeeId) {
```

This checks whether the current row belongs to the employee whose attendance was changed.

If it matches, the row is updated.

If it does not match, it is returned unchanged.

---

## 10. Understanding the Spread Operator

```javascript
return {
    ...row,
    days: row.days.map(day => {
```

`...row` is the spread operator.

It copies the existing properties of the row.

Then the `days` property is replaced with an updated array.

---

## 11. Find the Correct Day

```javascript
days: row.days.map(day => {
```

This loops through all days belonging to the selected employee.

Then:

```javascript
if (day.date === attendanceDate) {
```

checks whether this is the day the user changed.

---

## 12. Update the Day

```javascript
return {
    ...day,
    status: status,
    statusClass: this.getStatusClass(status)
};
```

`...day` copies the existing day information.

Then the status and CSS class are updated.

For example, before:

```javascript
{
    date: '2026-08-05',
    dayNumber: 5,
    dayName: 'Wed',
    status: 'WFH',
    statusClass: 'status-wfh'
}
```

After selecting **Office**:

```javascript
{
    date: '2026-08-05',
    dayNumber: 5,
    dayName: 'Wed',
    status: 'WFO',
    statusClass: 'status-wfo'
}
```

---

## 13. Keep Other Days and Employees Unchanged

If the date does not match:

```javascript
return day;
```

keeps the existing day unchanged.

If the employee does not match:

```javascript
return row;
```

keeps the existing employee row unchanged.

Therefore only the correct:

```text
Employee
+
Date
```

is updated.

---

## 14. Console Logs

```javascript
console.log('Employee ID:', employeeId);
console.log('Attendance Date:', attendanceDate);
console.log('Selected Status:', status);
```

These are debugging statements.

They allow you to see values in the browser Developer Console.

For example:

```text
Employee ID: EMP001
Attendance Date: 2026-08-05
Selected Status: WFO
```

---

## 15. Save the Attendance to Salesforce

Updating the JavaScript array changes the UI, but the change must also be saved to Salesforce.

That is why the code calls:

```javascript
saveAttendance({
    employeeId: employeeId,
    attendanceDate: attendanceDate,
    status: status,
    remarks: ''
})
```

This calls the Apex method:

```apex
saveAttendance(
    Id employeeId,
    Date attendanceDate,
    String status,
    String remarks
)
```

The flow is:

```text
LWC JavaScript
      |
      | employeeId
      | attendanceDate
      | status
      | remarks
      ↓
saveAttendance()
      ↓
AttendanceController.cls
      ↓
Salesforce Database
```

---

## 16. Why Do the Parameter Names Match?

JavaScript sends:

```javascript
saveAttendance({
    employeeId: employeeId,
    attendanceDate: attendanceDate,
    status: status,
    remarks: ''
})
```

Apex expects:

```apex
saveAttendance(
    Id employeeId,
    Date attendanceDate,
    String status,
    String remarks
)
```

The names correspond:

```text
JavaScript              Apex

employeeId        →     employeeId
attendanceDate    →     attendanceDate
status            →     status
remarks           →     remarks
```

---

## 17. `.then(result => {})`

After the Apex call succeeds:

```javascript
.then(result => {
    console.log('Attendance saved successfully:', result);
})
```

`.then()` runs after a successful Promise.

The flow is:

```text
saveAttendance()
       ↓
Apex executes
       ↓
Salesforce saves/updates record
       ↓
Success
       ↓
.then()
```

The `result` is the value returned by Apex.

Your Apex method returns:

```apex
return attendance;
```

So `result` contains the saved or updated `Attendance__c` record.

---

## 18. `.catch(error => {})`

If something goes wrong:

```javascript
.catch(error => {
    console.error('Error saving attendance:', error);
});
```

`.catch()` handles the error.

The flow is:

```text
saveAttendance()
       ↓
Apex
       ↓
Error
       ↓
.catch()
```

The error is printed to the browser console.

---

## 19. Complete Flow of This Section

```text
             buildEmployeeRows()
                     ↓
          Builds attendance grid data
                     ↓
             getStatusClass()
                     ↓
          Converts status → CSS class
                     ↓
            User changes a cell
                     ↓
        handleCellStatusChange(event)
                     ↓
          Gets employee + date + status
                     ↓
             Updates the UI
                     ↓
             saveAttendance()
                     ↓
                   Apex
                     ↓
           Salesforce Database
                     ↓
              Success / Error
```

---

## 20. Complete Example

Suppose:

```text
Employee:
Anik Mallick

Date:
August 5, 2026

Current status:
WFH
```

The user changes the dropdown from:

```text
Home
```

to:

```text
Office
```

Remember:

```text
Home   → WFH
Office → WFO
```

The flow becomes:

```text
User selects "Office"
        ↓
event.detail.value = "WFO"
        ↓
status = "WFO"
        ↓
Find employee = Anik
        ↓
Find date = 2026-08-05
        ↓
Update status = WFO
        ↓
getStatusClass("WFO")
        ↓
status-wfo
        ↓
Update employeeRows
        ↓
saveAttendance()
        ↓
Apex
        ↓
Attendance__c updated
```

---

## 21. Key Concepts Learned

| Concept | Meaning |
|---|---|
| `forEach()` | Runs code for every item |
| `find()` | Finds the first matching item |
| `if / else if` | Makes decisions based on conditions |
| `&&` | AND |
| `||` | OR |
| `push()` | Adds an item to an array |
| `switch` | Compares one value against multiple cases |
| `case` | One possible value in a `switch` |
| `default` | Fallback case |
| `return` | Sends a value back from a method |
| `map()` | Creates a new array based on an existing array |
| `...spread` | Copies properties from an existing object |
| `event` | Information about a UI event |
| `dataset` | Accesses `data-*` attributes |
| `event.detail.value` | Gets the selected component value |
| `.then()` | Handles successful Promise completion |
| `.catch()` | Handles Promise errors |

---

## 22. Most Important Takeaway

The three methods have different responsibilities:

```text
buildEmployeeRows()
        ↓
Prepare the data

getStatusClass()
        ↓
Prepare the styling

handleCellStatusChange()
        ↓
Handle user changes
        ↓
Update the UI
        ↓
Save the change to Salesforce
```

Together, they form an important bridge between:

```text
Salesforce Data
      ↕
LWC JavaScript
      ↕
Attendance Grid
```

The LWC is not simply displaying Salesforce data. It is also transforming the data for the UI and sending user changes back to Salesforce.
