# Attendance LWC JavaScript Revision — Part 3

## Section: `buildEmployeeRows()`

### 1. What is the purpose of `buildEmployeeRows()`?

The `buildEmployeeRows()` method takes the raw data received from Apex and prepares it in a format that the LWC HTML can easily display as an attendance grid.

It combines four things:

1. Employees
2. Days of the selected month
3. Attendance records
4. Holiday records

The final result is stored in:

```javascript
this.employeeRows
```

The HTML uses `employeeRows` to create the employee rows and attendance cells.

---

## 2. The Method

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

---

# 3. First: Empty the Existing Rows

```javascript
this.employeeRows = [];
```

This clears the old employee rows before creating new ones.

For example, if the user changes the month from August to September, the old August grid should not remain.

So we start fresh:

```text
Old employeeRows
       ↓
Clear it
       ↓
employeeRows = []
       ↓
Build September rows
```

---

# 4. Loop Through Employees

```javascript
this.employees.forEach(employee => {
```

`forEach()` means:

> Run this code once for every employee in the array.

For example:

```text
employees
 ├── Anik Mallick
 ├── Ayan Mukherjee
 ├── Kajal Baran Makur
 └── Rupak Dey
```

The code processes each employee one by one.

---

# 5. Create One Row for the Employee

```javascript
const row = {
    employeeId: employee.Id,
    employeeName: employee.Name,
    days: []
};
```

For every employee, we create an object called `row`.

For example:

```javascript
{
    employeeId: "a01XXXXXXXX",
    employeeName: "Anik Mallick",
    days: []
}
```

The `days` array starts empty because we have not added the attendance information for each day yet.

The structure is:

```text
row
 ├── employeeId
 ├── employeeName
 └── days
```

---

# 6. Loop Through Every Day

```javascript
this.days.forEach(day => {
```

Now we loop through all days in the selected month.

For August 2026:

```text
1
2
3
4
...
30
31
```

So for one employee, the code creates information for every day.

The process looks like:

```text
Employee: Anik Mallick

Day 1
Day 2
Day 3
...
Day 31
```

---

# 7. Find the Attendance Record

```javascript
const attendance = this.attendanceRecords.find(record =>
    record.Employee__c === employee.Id &&
    record.Attendance_Date__c === day.date
);
```

This is one of the most important parts of the method.

The `find()` function searches an array and returns the first record that matches the condition.

Here we are asking:

> Does this employee have an attendance record for this particular date?

There are two conditions.

### Condition 1

```javascript
record.Employee__c === employee.Id
```

This checks whether the attendance record belongs to the current employee.

### Condition 2

```javascript
record.Attendance_Date__c === day.date
```

This checks whether the attendance record is for the current day.

Both conditions must be true because we use:

```javascript
&&
```

which means **AND**.

---

# 8. Example of `find()`

Suppose the current employee is:

```text
Anik Mallick
Employee Id = EMP001
```

And the current day is:

```text
2026-08-05
```

The code searches the attendance records for:

```text
Employee__c = EMP001
AND
Attendance_Date__c = 2026-08-05
```

If it finds:

```text
Employee: Anik Mallick
Date: 2026-08-05
Status: WFO
```

then:

```javascript
attendance
```

contains that record.

If no record exists:

```javascript
attendance
```

will be:

```javascript
undefined
```

---

# 9. Find the Holiday

```javascript
const holiday = this.holidayRecords.find(record =>
    record.Holiday_Date__c === day.date
);
```

This searches the holiday records for the current date.

Unlike attendance, we do not need to check the employee.

Why?

Because a holiday applies to everyone.

For example:

```text
Holiday Date = 2026-08-15
```

Every employee should see the holiday on August 15.

---

# 10. Start With an Empty Status

```javascript
let status = '';
```

We initially assume that the cell has no status.

For example:

```text
August 7 → empty
```

Later, the code decides whether the status should be:

```text
WFO
WFH
WO
Leave
LOP
Holiday
```

---

# 11. Holiday Has the Highest Priority

```javascript
if (holiday) {
    status = holiday.Name;
}
```

If a holiday exists for that date, we use the holiday name as the status.

For example:

```text
Holiday Name = Independence Day
```

Then:

```javascript
status = "Independence Day";
```

The important point is that the code checks the holiday first.

---

# 12. Attendance Comes Next

```javascript
else if (attendance) {
    status = attendance.Status__c;
}
```

If there is no holiday, the code checks whether an attendance record exists.

For example:

```text
Attendance Status = WFO
```

Then:

```javascript
status = "WFO";
```

---

# 13. Weekend Comes After Attendance

```javascript
else if (day.dayName === 'Sat' || day.dayName === 'Sun') {
    status = 'WO';
}
```

If there is:

- no holiday
- no attendance record

then the code checks whether the day is Saturday or Sunday.

If yes:

```javascript
status = 'WO';
```

`WO` means **Weekly Off**.

The `||` operator means **OR**.

So this means:

```text
Saturday OR Sunday
```

---

# 14. Why Is the Order Important?

The order is:

```text
1. Holiday
2. Attendance
3. Weekend
4. Empty
```

This is important because more than one condition could potentially apply.

For example, suppose a Saturday is also a company holiday.

The code checks:

```javascript
if (holiday)
```

first.

Therefore the holiday gets priority.

The logic is:

```text
                Start
                  |
              Is Holiday?
              /                     Yes          No
            |             |
      Holiday Name    Is Attendance?
                       /                             Yes         No
                     |            |
                  Status       Is Weekend?
                                /                                    Yes       No
                              |          |
                              WO       Empty
```

---

# 15. Add the Day to the Employee Row

After calculating the status, we use:

```javascript
row.days.push({
    date: day.date,
    dayNumber: day.dayNumber,
    dayName: day.dayName,
    status: status,
    statusClass: this.getStatusClass(status)
});
```

`push()` adds a new object to the `days` array.

For example:

```javascript
{
    date: "2026-08-05",
    dayNumber: 5,
    dayName: "Wed",
    status: "WFO",
    statusClass: "status-wfo"
}
```

Now the employee's row knows what happened on August 5.

---

# 16. What Does `statusClass` Do?

```javascript
statusClass: this.getStatusClass(status)
```

This calls another method:

```javascript
getStatusClass(status)
```

For example:

```text
WFO
 ↓
getStatusClass()
 ↓
status-wfo
```

The CSS can then use:

```css
.status-wfo {
    ...
}
```

This allows different attendance statuses to have different visual styles.

For example:

```text
WFO     → status-wfo
WFH     → status-wfh
WO      → status-wo
Leave   → status-leave
LOP     → status-lop
Holiday → status-holiday
```

---

# 17. Add the Completed Row

After all days have been processed:

```javascript
this.employeeRows.push(row);
```

This adds the completed employee row to `employeeRows`.

For example:

```text
employeeRows
 ├── Anik Mallick
 │    ├── Aug 1
 │    ├── Aug 2
 │    ├── Aug 3
 │    └── ...
 │
 ├── Ayan Mukherjee
 │    ├── Aug 1
 │    ├── Aug 2
 │    ├── Aug 3
 │    └── ...
 │
 └── Kajal Baran Makur
      ├── Aug 1
      ├── Aug 2
      ├── Aug 3
      └── ...
```

---

# 18. The Final Data Structure

After `buildEmployeeRows()` finishes, the data roughly looks like this:

```javascript
employeeRows = [
    {
        employeeId: "EMP001",
        employeeName: "Anik Mallick",
        days: [
            {
                date: "2026-08-01",
                dayNumber: 1,
                dayName: "Sat",
                status: "WO",
                statusClass: "status-wo"
            },
            {
                date: "2026-08-02",
                dayNumber: 2,
                dayName: "Sun",
                status: "WO",
                statusClass: "status-wo"
            },
            {
                date: "2026-08-03",
                dayNumber: 3,
                dayName: "Mon",
                status: "WFO",
                statusClass: "status-wfo"
            }
        ]
    }
];
```

This structure is much easier for the HTML to display.

---

# 19. Why Do We Need `buildEmployeeRows()`?

Apex gives us separate pieces of data:

```text
Employees
    ↓
Attendance Records
    ↓
Holiday Records
    ↓
Days
```

The HTML needs a combined structure.

`buildEmployeeRows()` performs that combination:

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

So this method is essentially the **data preparation layer** between Apex and the HTML.

---

# 20. Simple Real-World Example

Suppose we have:

```text
Employee:
Anik Mallick

Date:
August 5, 2026

Attendance:
WFO

Holiday:
None

Day:
Wednesday
```

The method produces:

```javascript
{
    date: "2026-08-05",
    dayNumber: 5,
    dayName: "Wed",
    status: "WFO",
    statusClass: "status-wfo"
}
```

For August 8, 2026:

```text
Employee:
Anik Mallick

Date:
August 8, 2026

Attendance:
None

Holiday:
None

Day:
Saturday
```

The method produces:

```javascript
{
    date: "2026-08-08",
    dayNumber: 8,
    dayName: "Sat",
    status: "WO",
    statusClass: "status-wo"
}
```

---

# 21. Key JavaScript Concepts Learned

This method teaches several important JavaScript concepts:

| Concept | Meaning |
|---|---|
| `forEach()` | Run code for every item in an array |
| `find()` | Search for the first matching item |
| `if` | Check a condition |
| `else if` | Check another condition if the previous one was false |
| `&&` | AND |
| `||` | OR |
| `push()` | Add an item to an array |
| Object `{}` | Store related information |
| Nested array | An array inside an object |
| `this` | Refers to the current LWC class/component |
| Method call | `this.getStatusClass(status)` calls another method |

---

# 22. Overall Understanding

The most important thing to remember is:

```text
loadMonthlyData()
        ↓
Gets raw data from Apex
        ↓
employees
attendanceRecords
holidayRecords
        +
days
        ↓
buildEmployeeRows()
        ↓
Combines everything
        ↓
employeeRows
        ↓
HTML displays the Attendance Grid
```

`buildEmployeeRows()` does not directly save data to Salesforce.

Its job is to **prepare data for display**.

The `saveAttendance()` Apex method is responsible for saving or updating attendance when the user changes a cell.
