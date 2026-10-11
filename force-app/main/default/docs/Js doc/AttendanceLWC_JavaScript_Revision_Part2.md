# Attendance Tracker — LWC JavaScript Revision Notes (Part 2)

## 1. The Four Methods

This section covers:

```javascript
handleMonthChange(event)
handleYearChange(event)
connectedCallback()
generateDays()
```

These methods explain how the component reacts to the user and how it runs code automatically.

---

## 2. `handleMonthChange(event)`

```javascript
handleMonthChange(event){
    this.selectedMonth = event.detail.value;
    this.generateDays();
    this.loadMonthlyData();
}
```

Purpose: react when the user changes the selected month.

Flow:

```text
User changes month
        ↓
handleMonthChange(event)
        ↓
selectedMonth is updated
        ↓
generateDays()
        ↓
loadMonthlyData()
        ↓
New month's data is displayed
```

---

## 3. What is `event`?

The `event` object contains information about something that happened in the UI.

Your HTML will have something similar to:

```html
<lightning-combobox
    value={selectedMonth}
    options={monthOptions}
    onchange={handleMonthChange}>
</lightning-combobox>
```

The important part is:

```html
onchange={handleMonthChange}
```

This means:

> When the combobox changes, call `handleMonthChange`.

Salesforce automatically passes information about that interaction through the `event` object.

Therefore:

```javascript
handleMonthChange(event)
```

means:

> When the month changes, run this method and give me information about the event.

---

## 4. What is `event.detail.value`?

```javascript
this.selectedMonth = event.detail.value;
```

For a Lightning combobox, the selected value is available through:

```javascript
event.detail.value
```

Suppose the user selects September:

```javascript
{ label: 'September', value: '9' }
```

Conceptually:

```text
event
 └── detail
      └── value
           └── '9'
```

Therefore:

```javascript
event.detail.value
```

returns:

```text
'9'
```

Then:

```javascript
this.selectedMonth = event.detail.value;
```

becomes:

```javascript
this.selectedMonth = '9';
```

---

## 5. Understanding `this`

You have:

```javascript
selectedMonth = '8';
```

inside your class.

To access a property belonging to the current component, you use:

```javascript
this
```

So:

```javascript
this.selectedMonth
```

means:

> The `selectedMonth` property belonging to this component.

For example:

```javascript
this.selectedMonth = '9';
```

means:

> Change this component's selected month to September.

Think of it as:

```text
this
 ↓
AttendanceMonthlyView
 ↓
selectedMonth
```

---

## 6. Why call `generateDays()`?

After changing the month, the number of days can change.

```text
August    → 31 days
September → 30 days
February  → 28/29 days
```

Therefore:

```javascript
this.generateDays();
```

rebuilds the `days` array for the new month.

Example:

```text
August
 ↓
31 days

User selects September
 ↓
generateDays()
 ↓
30 days
```

---

## 7. Why call `loadMonthlyData()`?

Changing the month also means the attendance and holiday data needs to change.

```text
August 2026
 ↓
August attendance
August holidays
```

If the user selects September:

```text
September 2026
 ↓
September attendance
September holidays
```

Therefore:

```javascript
this.loadMonthlyData();
```

loads the new month's data.

---

## 8. `handleYearChange(event)`

```javascript
handleYearChange(event){
    this.selectedYear = event.detail.value;
    this.generateDays();
    this.loadMonthlyData();
}
```

This works almost exactly like `handleMonthChange()`.

Suppose:

```text
2026 → 2027
```

Then:

```javascript
this.selectedYear = event.detail.value;
```

updates:

```text
selectedYear = '2027'
```

Then:

```javascript
this.generateDays();
```

recalculates the calendar days.

And:

```javascript
this.loadMonthlyData();
```

loads attendance and holiday data for the new year.

---

## 9. Why do both handlers call the same methods?

You have:

```javascript
handleMonthChange(event){
    this.selectedMonth = event.detail.value;
    this.generateDays();
    this.loadMonthlyData();
}
```

and:

```javascript
handleYearChange(event){
    this.selectedYear = event.detail.value;
    this.generateDays();
    this.loadMonthlyData();
}
```

Changing either the month or the year can affect:

- Number of days
- Calendar dates
- Attendance data
- Holiday data

For example:

```text
December 2026
      ↓
January 2027
```

Both the month and year are relevant.

---

## 10. `connectedCallback()`

```javascript
connectedCallback(){
    this.generateDays();
    this.loadMonthlyData();
}
```

`connectedCallback()` is an **LWC lifecycle method**.

A simplified component lifecycle:

```text
Component created
      ↓
connectedCallback()
      ↓
Component rendered
      ↓
User interacts with it
      ↓
Component updates
```

`connectedCallback()` runs when the component is inserted into the DOM.

Simple rule:

> `connectedCallback()` is code that runs automatically when the LWC is initialized/connected.

---

## 11. Why do we use `connectedCallback()`?

When the user opens the Attendance Tracker, they haven't clicked anything yet.

The application still needs to display:

```text
August 2026
```

and load:

```text
Employees
Attendance
Holidays
```

So something needs to automatically start the process.

That is what:

```javascript
connectedCallback()
```

does.

It calls:

```javascript
this.generateDays();
this.loadMonthlyData();
```

Initial flow:

```text
User opens Attendance Tracker
           ↓
connectedCallback()
           ↓
generateDays()
           ↓
Create August days
           ↓
loadMonthlyData()
           ↓
Get employees
Get attendance
Get holidays
           ↓
Build attendance grid
```

---

## 12. Difference between `connectedCallback()` and event handlers

### `connectedCallback()`

Runs automatically when the component starts.

```javascript
connectedCallback(){
    ...
}
```

### `handleMonthChange(event)`

Runs because the user changed the month.

```javascript
handleMonthChange(event){
    ...
}
```

### `handleYearChange(event)`

Runs because the user changed the year.

```javascript
handleYearChange(event){
    ...
}
```

So:

```text
Component opens
      ↓
connectedCallback()

User changes month
      ↓
handleMonthChange()

User changes year
      ↓
handleYearChange()
```

---

## 13. `generateDays()`

Your method:

```javascript
generateDays() {
    const year = Number(this.selectedYear);
    const month = Number(this.selectedMonth);

    const numberOfDays = new Date(year, month, 0).getDate();

    this.days = [];

    for (let day = 1; day <= numberOfDays; day++) {

        const date = new Date(year, month - 1, day);

        this.days.push({
            dayNumber: day,
            dayName: date.toLocaleDateString('en-US', {
                weekday: 'short'
            }),
            date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        });
    }
}
```

This method creates all the dates needed for the attendance grid.

---

## 14. Convert month and year to numbers

```javascript
const year = Number(this.selectedYear);
const month = Number(this.selectedMonth);
```

Earlier:

```javascript
selectedMonth = '8';
selectedYear = '2026';
```

These are strings.

JavaScript's `Date` constructor needs numbers.

So:

```text
'8'    → 8
'2026' → 2026
```

Therefore:

```text
year = 2026
month = 8
```

---

## 15. Finding the number of days

```javascript
const numberOfDays = new Date(year, month, 0).getDate();
```

This is a useful JavaScript date technique.

JavaScript uses **zero-based months**:

```text
January  = 0
February = 1
March    = 2
...
December = 11
```

Your application uses:

```text
January  = 1
February = 2
March    = 3
...
December = 12
```

With:

```text
year = 2026
month = 8
```

this:

```javascript
new Date(year, month, 0)
```

becomes:

```javascript
new Date(2026, 8, 0)
```

Day `0` means the last day of the previous month.

Therefore it gives:

```text
July 31, 2026
```

Then:

```javascript
.getDate()
```

returns:

```text
31
```

So:

```javascript
numberOfDays = 31
```

---

## 16. Why does this work for every month?

For September:

```javascript
new Date(2026, 9, 0)
```

returns:

```text
September 30
```

For February 2026:

```text
28
```

For February 2028:

```text
29
```

Therefore the code automatically handles:

```text
28 days
29 days
30 days
31 days
```

This avoids hard-coding the number of days.

---

## 17. Empty the `days` array

```javascript
this.days = [];
```

The user may have previously selected another month.

Example:

```text
August → 31 days
```

Then:

```text
September → 30 days
```

We need to remove the old August data before creating September's days.

Therefore:

```javascript
this.days = [];
```

means:

> Start with an empty list of days.

---

## 18. The `for` loop

```javascript
for (let day = 1; day <= numberOfDays; day++) {
```

If:

```text
numberOfDays = 31
```

the loop runs:

```text
day = 1
day = 2
day = 3
...
day = 31
```

One object is created for every day.

---

## 19. Creating the JavaScript Date

```javascript
const date = new Date(year, month - 1, day);
```

Why `month - 1`?

Because JavaScript months are zero-based.

Your application:

```text
August = 8
```

JavaScript:

```text
August = 7
```

Therefore:

```javascript
month - 1
```

converts:

```text
8 → 7
```

So:

```javascript
new Date(2026, 7, 1)
```

means:

```text
August 1, 2026
```

---

## 20. Adding day information to the array

```javascript
this.days.push({
    dayNumber: day,
    dayName: date.toLocaleDateString('en-US', {
        weekday: 'short'
    }),
    date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
});
```

For example, August 1 becomes:

```javascript
{
    dayNumber: 1,
    dayName: 'Sat',
    date: '2026-08-01'
}
```

---

## 21. `dayNumber`

```javascript
dayNumber: day
```

If the loop is currently on day 5:

```text
day = 5
```

then:

```javascript
dayNumber: 5
```

This is the day number used by the grid header.

---

## 22. `dayName`

```javascript
date.toLocaleDateString('en-US', {
    weekday: 'short'
})
```

This asks JavaScript:

> Give me the short weekday name for this date using US English.

Examples:

```text
Monday    → Mon
Tuesday   → Tue
Wednesday → Wed
Thursday  → Thu
Friday    → Fri
Saturday  → Sat
Sunday    → Sun
```

---

## 23. Creating the date string

```javascript
date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
```

Creates a date in:

```text
YYYY-MM-DD
```

format.

Example:

```text
2026-08-01
```

---

## 24. What is a template literal?

This:

```javascript
`${year}-${...}-${...}`
```

is a JavaScript **template literal**.

It lets you insert variables directly into a string.

Example:

```javascript
const name = 'Tuhin';
const message = `Hello ${name}`;
```

Result:

```text
Hello Tuhin
```

Your code uses the same concept to build the date string.

---

## 25. What does `padStart()` do?

Suppose:

```javascript
month = 8
```

We want:

```text
08
```

not:

```text
8
```

So:

```javascript
String(month).padStart(2, '0')
```

works like:

```text
month
 ↓
8
 ↓ String()
'8'
 ↓ padStart(2, '0')
'08'
```

Similarly:

```javascript
String(day).padStart(2, '0')
```

converts:

```text
1  → '01'
2  → '02'
9  → '09'
10 → '10'
```

Therefore:

```text
2026 + 08 + 01
```

becomes:

```text
2026-08-01
```

---

## 26. Why is the exact date format important?

Later, your JavaScript compares the generated date with the Salesforce Attendance date:

```javascript
record.Attendance_Date__c === day.date
```

Both values need to represent the same date in a comparable format.

This is why the consistent:

```text
YYYY-MM-DD
```

format is useful.

---

## 27. Complete `generateDays()` flow

For August 2026:

```text
selectedYear = '2026'
selectedMonth = '8'
        ↓
convert to numbers
        ↓
year = 2026
month = 8
        ↓
find number of days
        ↓
31
        ↓
empty days array
        ↓
loop from 1 to 31
        ↓
create an object for every day
        ↓
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
  ...
  {
    dayNumber: 31,
    dayName: 'Mon',
    date: '2026-08-31'
  }
]
```

---

## 28. How the four methods work together

```javascript
handleMonthChange(event){
    this.selectedMonth = event.detail.value;
    this.generateDays();
    this.loadMonthlyData();
}

handleYearChange(event){
    this.selectedYear = event.detail.value;
    this.generateDays();
    this.loadMonthlyData();
}

connectedCallback(){
    this.generateDays();
    this.loadMonthlyData();
}

generateDays() {
    // Creates the days for the selected month
}
```

Overall:

```text
                 Component opens
                       ↓
              connectedCallback()
                       ↓
              +--------+--------+
              ↓                 ↓
        generateDays()    loadMonthlyData()
              |
              ↓
       Create calendar
          dates


User changes month
       ↓
handleMonthChange(event)
       ↓
selectedMonth updated
       ↓
generateDays()
       ↓
loadMonthlyData()


User changes year
       ↓
handleYearChange(event)
       ↓
selectedYear updated
       ↓
generateDays()
       ↓
loadMonthlyData()
```

---

## 29. Key concepts learned

| Concept | Meaning |
|---|---|
| `event` | Information about a user interaction |
| `event.detail.value` | Selected value from a Lightning component |
| `this` | The current LWC component |
| `connectedCallback()` | Runs when the component is connected/initialized |
| `generateDays()` | Creates calendar days for the selected month |
| `new Date()` | Creates a JavaScript date object |
| `getDate()` | Gets the day number from a Date |
| `padStart()` | Adds leading characters, such as `8 → 08` |
| `push()` | Adds an item to an array |
| `for` loop | Repeats code for each day |

---

## 30. Important programming concept

The Attendance Tracker does **not** manually create 31 columns.

JavaScript calculates the calendar dynamically.

Therefore the same component can handle:

```text
February 2026 → 28 days
February 2028 → 29 days
April 2026    → 30 days
August 2026   → 31 days
```

This is an important programming concept:

> Generate UI data dynamically instead of hard-coding it.

---

## 31. Next revision section

The next major method is:

```javascript
loadMonthlyData()
```

This is one of the most important parts of the component because it calls **three Apex methods together using `Promise.all()`**.

We will study:

```text
Promise.all()
.then()
.catch()
results[]
Number()
Apex parameters
JavaScript → Apex → Salesforce → JavaScript
```

This will connect the JavaScript concepts directly to the `AttendanceController.cls` we already revised.
