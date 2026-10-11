# Attendance Tracker — AttendanceController Revision Notes

## 1. What does AttendanceController do?

`AttendanceController` is the middleman between the LWC and Salesforce.

```text
                    LWC
                     │
                     │ calls Apex
                     ↓
          AttendanceController.cls
                     │
          ┌──────────┼──────────┐
          ↓          ↓          ↓
      Employee__c Attendance__c Holiday__c
```

The controller currently has four main jobs:

| Method | Job |
|---|---|
| `getActiveEmployees()` | Get active employees |
| `getMonthlyAttendance()` | Get attendance for a selected month |
| `getMonthlyHolidays()` | Get holidays for a selected month |
| `saveAttendance()` | Create or update attendance |

---

# 2. Understanding the class declaration

```apex
public with sharing class AttendanceController {
```

### `public`

The class can be accessed from outside the class.

### `class`

Creates an Apex class. A class is a container for related code.

### `with sharing`

Tells Salesforce to respect the user's record-sharing rules when this Apex class accesses records.

Simple rule:

> `with sharing` = respect Salesforce record-sharing rules.

---

# 3. Method 1 — getActiveEmployees()

```apex
@AuraEnabled(cacheable=true)
public static List<Employee__c> getActiveEmployees(){
    return[
        SELECT Id, Name FROM Employee__c 
        WHERE Active__c = TRUE
        ORDER BY NAME ASC
    ];
}
```

## `@AuraEnabled`

This makes the Apex method available to Lightning components such as LWC.

Without it, the LWC cannot directly call this method.

```text
LWC → Apex
```

---

## `cacheable=true`

This indicates that the method is used for reading data and that the result can be cached.

It is appropriate for methods such as:

- `getActiveEmployees()`
- `getMonthlyAttendance()`
- `getMonthlyHolidays()`

The fourth method, `saveAttendance()`, changes data, so it does not use `cacheable=true`.

Simple rule:

```text
Reading data → cacheable=true can be used

Changing data → do not use cacheable=true
```

---

## Understanding the method signature

```apex
public static List<Employee__c> getActiveEmployees()
```

### `public`

The method can be accessed from outside the class.

### `static`

The method can be called without creating an object of `AttendanceController`.

For example:

```apex
AttendanceController.getActiveEmployees();
```

### `List<Employee__c>`

This is the return type.

It means:

> The method returns a list of Employee__c records.

For example:

```text
[
    Suvrajit Ghosh,
    Rupak Dey,
    Kajal Baran Makur,
    ...
]
```

---

# 4. Understanding the SOQL query

```apex
SELECT Id, Name
FROM Employee__c
WHERE Active__c = TRUE
ORDER BY Name ASC
```

SOQL = Salesforce Object Query Language.

Think of SOQL as asking Salesforce:

> "Give me these records."

### SELECT

```apex
SELECT Id, Name
```

Means:

> Give me the Id and Name fields.

### FROM

```apex
FROM Employee__c
```

Means:

> Get the records from the Employee object.

### WHERE

```apex
WHERE Active__c = TRUE
```

Means:

> Only return employees whose Active__c field is TRUE.

### ORDER BY

```apex
ORDER BY Name ASC
```

Means:

> Sort the employees alphabetically by name.

So the entire query means:

> Give me the ID and name of every active employee, sorted alphabetically.

---

# 5. Method 2 — getMonthlyAttendance()

```apex
public static List<Attendance__c> getMonthlyAttendance(
    Integer month,
    Integer year
)
```

This method introduces **parameters**.

The LWC can send values such as:

```text
month = 8
year = 2026
```

and call:

```apex
getMonthlyAttendance(8, 2026);
```

The flow is:

```text
LWC
 │
 │ month = 8
 │ year = 2026
 ↓
getMonthlyAttendance(8, 2026)
```

---

# 6. Creating the start date

```apex
Date startDate = Date.newInstance(year, month, 1);
```

Suppose:

```text
year = 2026
month = 8
```

Salesforce creates:

```text
2026-08-01
```

So:

```text
startDate = August 1, 2026
```

---

# 7. Creating the end date

```apex
Date endDate = startDate.addMonths(1).addDays(-1);
```

This is a useful technique because we don't have to manually know how many days each month has.

For August:

```text
August 1
   ↓ add 1 month
September 1
   ↓ subtract 1 day
August 31
```

For February 2028:

```text
February 1
   ↓ add 1 month
March 1
   ↓ subtract 1 day
February 29
```

This automatically handles different month lengths and leap years.

---

# 8. Attendance query

```apex
WHERE Attendance_Date__c >= :startDate
AND Attendance_Date__c <= :endDate
```

The colon means:

> Use the Apex variable's value inside the SOQL query.

If:

```text
startDate = 2026-08-01
endDate   = 2026-08-31
```

Salesforce retrieves attendance records from August 1 through August 31.

---

# 9. Understanding Employee__r.Name

The query contains:

```apex
Employee__c,
Employee__r.Name,
```

`Employee__c` stores the ID of the related Employee record.

For example:

```text
Employee__c = a01XXXXXXXXXXXX
```

That ID is not useful to display to a user.

Using:

```apex
Employee__r.Name
```

lets us retrieve the name of the related Employee.

Think of the relationship like this:

```text
Attendance__c
      │
      │ Employee__c
      ↓
Employee__c
      │
      └── Name
```

`__r` means we are navigating to the related record.

This is an important Salesforce relationship concept.

---

# 10. Method 3 — getMonthlyHolidays()

```apex
@AuraEnabled(cacheable=true)
public static List<Holiday__c> getMonthlyHolidays(
    Integer month,
    Integer year
)
```

This method works similarly to `getMonthlyAttendance()`.

The flow is:

```text
LWC
 ↓
month + year
 ↓
Apex
 ↓
calculate start date
 ↓
calculate end date
 ↓
query Holiday__c
 ↓
return holidays
```

The query also contains:

```apex
AND Active__c = TRUE
```

Therefore, inactive holidays are not returned.

---

# 11. Method 4 — saveAttendance()

This method handles the business logic for creating or updating attendance.

```apex
public static Attendance__c saveAttendance(
    Id employeeId,
    Date attendanceDate,
    String status,
    String remarks
)
```

The LWC sends four values:

```text
employeeId
attendanceDate
status
remarks
```

For example:

```text
Employee = Anik Mallick
Date     = August 1, 2026
Status   = Present
Remarks  = Came late
```

---

# 12. First search for an existing record

```apex
List<Attendance__c> existingRecords = [
    SELECT
        Id,
        Employee__c,
        Attendance_Date__c,
        Status__c,
        Remarks__c
    FROM Attendance__c
    WHERE Employee__c = :employeeId
    AND Attendance_Date__c = :attendanceDate
    LIMIT 1
];
```

This asks Salesforce:

> Does this employee already have an attendance record for this date?

Example:

```text
Employee = Anik
Date     = August 1, 2026
```

If a record exists:

```text
Yes → update it
```

If it does not:

```text
No → create it
```

This gives the method an **upsert-like business behavior**, although technically the code is performing its own query followed by either `update` or `insert`.

---

# 13. The Attendance variable

```apex
Attendance__c attendance;
```

This variable will hold either:

```text
An existing Attendance record
```

or:

```text
A newly created Attendance record
```

That is why the comment says:

```apex
// Variable to hold the existing or newly created Attendance record
```

---

# 14. The IF condition

```apex
if (!existingRecords.isEmpty()) {
```

`isEmpty()` checks whether the list contains zero records.

The `!` means NOT.

Therefore:

```apex
!existingRecords.isEmpty()
```

means:

> The list is NOT empty.

In simple English:

> If we found an existing attendance record...

Then:

```apex
attendance = existingRecords[0];
```

gets the first record.

Then:

```apex
attendance.Status__c = status;
attendance.Remarks__c = remarks;
```

changes the values.

Finally:

```apex
update attendance;
```

saves the changes to Salesforce.

---

# 15. Creating a new Attendance record

If no record exists, the code goes to:

```apex
else {
```

First:

```apex
attendance = new Attendance__c();
```

This creates a new Attendance__c record in memory.

Then values are assigned:

```apex
attendance.Employee__c = employeeId;
attendance.Attendance_Date__c = attendanceDate;
attendance.Status__c = status;
attendance.Remarks__c = remarks;
```

Finally:

```apex
insert attendance;
```

saves the new record to Salesforce.

---

# 16. Returning the record to the LWC

At the end:

```apex
return attendance;
```

Apex sends the resulting Attendance record back to the LWC.

The complete flow is:

```text
             LWC
              │
              │ employee + date + status + remarks
              ↓
       saveAttendance()
              │
              ↓
     Search existing record
              │
        ┌─────┴─────┐
        ↓           ↓
      Found       Not Found
        ↓           ↓
      UPDATE      INSERT
        │           │
        └─────┬─────┘
              ↓
       return attendance
              ↓
             LWC
```

---

# 17. Four important Apex concepts to remember

You do not need to memorize the entire controller.

Focus on these four concepts first.

## 1. Apex Method

```apex
public static ...
```

A reusable piece of server-side Salesforce code.

## 2. @AuraEnabled

```apex
@AuraEnabled
```

Allows an LWC to call the Apex method.

## 3. SOQL

```apex
SELECT ...
FROM ...
WHERE ...
```

Used to retrieve Salesforce records.

## 4. DML

```apex
insert record;
update record;
```

Used to save changes to Salesforce.

---

# 18. Overall Attendance Tracker architecture

The controller fits into the larger application like this:

```text
                    Attendance Tracker
                           │
                           ↓
                    LWC Interface
                           │
              ┌────────────┴────────────┐
              │                         │
              ↓                         ↓
       attendanceMonthlyView.js    attendanceMonthlyView.html
              │
              │ calls Apex
              ↓
       AttendanceController.cls
              │
       ┌──────┼──────────────┐
       │      │              │
       ↓      ↓              ↓
 Employee  Attendance      Holiday
   Data       Data           Data
```

The most important idea is:

> **HTML displays the interface, JavaScript controls the LWC behavior, Apex handles server-side logic, and Salesforce objects store the data.**

---

# 19. Recommended revision order

For learning, revise the application in this order:

```text
1. AttendanceController.cls
        ↓
2. attendanceMonthlyView.js
        ↓
3. attendanceMonthlyView.html
        ↓
4. attendanceMonthlyView.css
        ↓
5. Salesforce Objects & Fields
        ↓
6. Complete data flow
```

After the Apex revision, the next file to study is:

```text
attendanceMonthlyView.js
```

That will show how the LWC calls these Apex methods and how the returned Salesforce data is prepared for the UI.
