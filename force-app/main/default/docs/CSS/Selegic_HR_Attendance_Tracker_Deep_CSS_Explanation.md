# Selegic HR Management App — Attendance Tracker
## Deep CSS Explanation

This document explains the CSS used in the `attendanceMonthlyView` Lightning Web Component.

The goal is to understand not only **what each CSS property does**, but also **why it is used in the Attendance Tracker, what visual problem it solves, and how it connects to the HTML**.

---

# 1. What Is CSS?

CSS stands for:

**Cascading Style Sheets**

HTML defines the structure of the application.

CSS defines how that structure looks.

For the Attendance Tracker:

```text
HTML
↓
Creates:
- Cards
- Dropdowns
- Table
- Rows
- Cells
- Legend
- Summary box

CSS
↓
Controls:
- Width
- Height
- Colors
- Spacing
- Alignment
- Borders
- Sticky columns
- Backgrounds
- Text appearance
```

A simple way to remember it:

```text
HTML = Structure
CSS  = Appearance
JS   = Logic
Apex = Salesforce Data
```

---

# 2. How LWC CSS Connects to HTML

Your HTML contains classes such as:

```html
<table class="attendance-table">
```

and:

```html
<td class={day.statusClass}>
```

Your CSS contains selectors such as:

```css
.attendance-table {
    ...
}
```

and:

```css
.status-wfo {
    ...
}
```

The connection is:

```text
HTML
class="attendance-table"
        ↓
CSS
.attendance-table
        ↓
CSS rules are applied
        ↓
Table changes appearance
```

For dynamic classes:

```text
JavaScript
day.statusClass = "status-wfo"
        ↓
HTML
class={day.statusClass}
        ↓
Rendered HTML
class="status-wfo"
        ↓
CSS
.status-wfo
        ↓
Green attendance cell
```

This is one of the most important CSS concepts in your application.

---

# 3. `.attendance-table`

Your first major CSS block is:

```css
.attendance-table {

    width: max-content;

    min-width: 100%;

    border-collapse: separate;

    border-spacing: 4px 3px;

}
```

The selector:

```css
.attendance-table
```

means:

> Find any HTML element whose class is `attendance-table`.

Your HTML contains:

```html
<table class="slds-table slds-table_bordered slds-table_cell-buffer attendance-table">
```

So this CSS applies to your Attendance table.

---

# 4. `width: max-content`

```css
width: max-content;
```

This tells the browser:

> Let the table become as wide as its content requires.

This is particularly important because your attendance table can have many columns.

For example, August has:

```text
Employee + 31 days
```

So the table could become very wide:

```text
Employee | 1 | 2 | 3 | 4 | 5 | ... | 31
```

If the browser forced the table into a small width, the columns could become unnecessarily compressed.

`max-content` allows the table to expand according to its content.

---

# 5. `min-width: 100%`

```css
min-width: 100%;
```

This means:

> The table should be at least as wide as its parent/container.

This works together with:

```css
width: max-content;
```

So you effectively have:

```text
Minimum width = 100% of container
Maximum natural width = Content requirement
```

This is useful because the table behaves well both when there are few columns and when there are many columns.

---

# 6. `border-collapse: separate`

```css
border-collapse: separate;
```

HTML tables normally have different ways of handling borders.

`separate` tells the browser:

> Keep the borders/cells visually separate.

This is useful because your design uses:

```css
border-spacing: 4px 3px;
```

to create space between cells.

If the borders were collapsed, that spacing would not work in the same way.

---

# 7. `border-spacing: 4px 3px`

```css
border-spacing: 4px 3px;
```

There are two values.

```text
4px = horizontal spacing
3px = vertical spacing
```

So your cells get a little breathing room:

```text
┌──────┐  ┌──────┐  ┌──────┐
│ WFO  │  │ WFH  │  │ Leave│
└──────┘  └──────┘  └──────┘
```

instead of looking like one continuous block.

This is especially useful for the color-coded attendance cells.

---

# 8. Table Header and Cell Selector

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

This is a combined selector.

It means:

> Apply these rules to both `<th>` and `<td>` elements that are inside `.attendance-table`.

Your HTML has:

```html
<th>Employee</th>
```

and:

```html
<td>...</td>
```

Both receive these styles.

---

# 9. `text-align: center`

```css
text-align: center;
```

This centers text horizontally.

For example:

```text
┌─────────┐
│   WFO   │
└─────────┘
```

instead of:

```text
┌─────────┐
│ WFO     │
└─────────┘
```

This makes sense for day numbers and attendance statuses because the columns are narrow.

---

# 10. `vertical-align: middle`

```css
vertical-align: middle;
```

This centers the content vertically inside the table cell.

Without it, content may sit closer to the top or bottom depending on the browser/component rendering.

You want:

```text
┌─────────┐
│         │
│   WFO   │
│         │
└─────────┘
```

rather than:

```text
┌─────────┐
│   WFO   │
│         │
│         │
└─────────┘
```

---

# 11. `white-space: nowrap`

```css
white-space: nowrap;
```

This tells the browser:

> Do not wrap the text onto another line.

For example, without it:

```text
Work
From
Office
```

could happen in a narrow cell.

With `nowrap`:

```text
Work From Office
```

stays on one line.

This is useful for compact attendance cells and headers.

---

# 12. `padding: 6px 8px`

```css
padding: 6px 8px;
```

Padding means internal space between the content and the edge of the cell.

The two values mean:

```text
6px = top and bottom
8px = left and right
```

So:

```text
        6px
          ↓
   ┌──────────────┐
8px│     WFO      │8px
   └──────────────┘
          ↑
        6px
```

Padding makes the table easier to read and prevents content from touching the borders.

---

# 13. `.employee-column`

Your Employee column has:

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

This is one of the most important CSS blocks in your application.

It solves the problem of the Employee column disappearing when the user horizontally scrolls through many days.

---

# 14. `position: sticky`

```css
position: sticky;
```

Sticky positioning means:

> The element behaves normally until scrolling reaches its sticky boundary, after which it stays attached to a specified position.

In your case, it works together with:

```css
left: 0;
```

to keep the Employee column attached to the left.

Without sticky positioning:

```text
Employee | 1 | 2 | 3 | 4 | ... | 31
```

When scrolling right:

```text
20 | 21 | 22 | 23 | ... | 31
```

the Employee column could disappear.

With sticky positioning:

```text
Employee | 20 | 21 | 22 | 23 | ...
   ↑
   stays visible
```

This is very useful in an attendance grid.

---

# 15. `left: 0`

```css
left: 0;
```

This tells the browser:

> Stick this element at the left edge.

Important:

```css
left: 0;
```

does not create sticky behavior by itself.

It works together with:

```css
position: sticky;
```

Together:

```css
position: sticky;
left: 0;
```

mean:

> When scrolling horizontally, keep this element at the left edge.

---

# 16. `z-index: 3`

```css
z-index: 3;
```

`z-index` controls the stacking order of elements.

Imagine the scrolling attendance cells moving behind the Employee column.

You want:

```text
Employee column
████████████
     ↑
in front
```

and the scrolling cells behind it.

A higher stacking order helps the sticky Employee column remain visually above those cells.

Therefore:

```css
z-index: 3;
```

is important for the sticky-column effect.

---

# 17. Why the Employee Column Needs a Background

You have:

```css
background: white;
```

This is important.

Imagine the Employee column is sticky and the rest of the table is scrolling.

If the sticky column were transparent, the cells behind it could remain visible through the sticky area.

With:

```css
background: white;
```

the Employee column becomes an opaque surface.

Conceptually:

```text
Sticky Employee Column
┌──────────────┐
│ Anik         │
│ Ayan         │
│ Riju         │
└──────────────┘
       ↑
Scrolling cells are hidden behind it
```

---

# 18. Employee Column Width

```css
min-width: 170px;
max-width: 170px;
```

Both values are 170px.

This effectively gives the Employee column a fixed width.

Why?

Employee names can vary:

```text
Anik Mallick
Ayan Mukherjee
Dhiraj Dipak Chaudhari
```

You don't want the column to continuously resize based on the name.

A fixed width gives the table a predictable layout.

---

# 19. `text-align: left !important`

Your general table rule says:

```css
text-align: center;
```

But employee names should normally be left-aligned.

So you override it:

```css
text-align: left !important;
```

Therefore:

```text
Employee column → Left aligned
Day/attendance cells → Center aligned
```

`!important` tells CSS to give this declaration strong priority when competing rules would otherwise override it.

---

# 20. `.day-column`

Your day header styling is:

```css
.day-column {

    min-width: 70px;

    max-width: 70px;

    background: #f3f3f3;

}
```

This applies to the day header:

```html
<th class="day-column">
```

Each day column is approximately 70px wide.

So:

```text
┌──────┐ ┌──────┐ ┌──────┐
│  1   │ │  2   │ │  3   │
│ Sat  │ │ Sun  │ │ Mon  │
└──────┘ └──────┘ └──────┘
```

---

# 21. Why `min-width` and `max-width` Are Both 70px

You have:

```css
min-width: 70px;
max-width: 70px;
```

This essentially fixes the width at 70px.

This is useful because every day should occupy roughly the same amount of horizontal space.

Otherwise, the table could become uneven:

```text
Day 1 = 50px
Day 2 = 100px
Day 3 = 65px
...
```

Instead:

```text
Day 1 = 70px
Day 2 = 70px
Day 3 = 70px
...
```

This produces a consistent grid.

---

# 22. Day Header Background

```css
background: #f3f3f3;
```

This gives the day headers a light gray background.

The purpose is visual separation:

```text
Header
████████████████
Attendance cells
░░░░░░░░░░░░░░░░
```

The user can immediately distinguish the date headers from the actual attendance cells.

---

# 23. `.attendance-cell`

You have:

```css
.attendance-cell {

    min-width: 70px;

    max-width: 70px;

    overflow: hidden;

    text-overflow: ellipsis;

    font-weight: 500;

}
```

This class provides additional styling for an attendance cell if that class is applied.

---

# 24. `overflow: hidden`

```css
overflow: hidden;
```

means:

> If content becomes larger than the cell's available space, don't let it spill outside the cell.

This is useful in narrow attendance cells.

---

# 25. `text-overflow: ellipsis`

```css
text-overflow: ellipsis;
```

This can show an ellipsis (`...`) when text doesn't fit, when used with appropriate width/overflow settings.

For example:

```text
Some very long...
```

instead of overflowing into neighboring cells.

---

# 26. `font-weight: 500`

```css
font-weight: 500;
```

Controls the thickness of the text.

A value around 500 is slightly heavier than normal text.

This makes attendance information easier to read.

---

# 27. WFO Status Styling

Your WFO class is:

```css
.status-wfo {
    background-color: #B7E4C7;
    --slds-c-input-color-background: #B7E4C7;
    border-radius: 4px;
    font-weight: 500;
}
```

This is connected to the HTML:

```html
<td class={day.statusClass}>
```

If JavaScript produces:

```javascript
day.statusClass = 'status-wfo';
```

the rendered cell gets:

```html
<td class="status-wfo">
```

Then this CSS applies.

---

# 28. `background-color`

```css
background-color: #B7E4C7;
```

sets the background color.

The result is a light green WFO cell.

Conceptually:

```text
┌────────────┐
│    WFO     │
└────────────┘
```

with a green background.

---

# 29. Salesforce Styling Hook

You also have:

```css
--slds-c-input-color-background: #B7E4C7;
```

This is a Salesforce Lightning styling hook.

Your HTML contains a Salesforce base component:

```html
<lightning-combobox>
```

The internal structure of a base Lightning component isn't the same as your own normal HTML.

Salesforce provides styling hooks that allow developers to influence supported parts of those components.

So you are effectively applying the same color to:

```text
The cell
+
The Lightning input/combobox background
```

This helps the whole attendance cell look visually consistent.

---

# 30. `border-radius: 4px`

```css
border-radius: 4px;
```

slightly rounds the corners.

Instead of sharp corners:

```text
┌────────┐
│  WFO   │
└────────┘
```

you get:

```text
╭────────╮
│  WFO   │
╰────────╯
```

The rounding is subtle.

---

# 31. `font-weight: 500`

```css
font-weight: 500;
```

makes the attendance text slightly heavier.

This improves readability inside the small grid cells.

---

# 32. WFH Styling

```css
.status-wfh {
    background-color: #BDE0FE;
    --slds-c-input-color-background: #BDE0FE;
    border-radius: 4px;
    font-weight: 500;
}
```

WFH uses a light blue background.

The same styling pattern is used:

```text
background color
Salesforce input background
rounded corners
slightly heavier text
```

The only major difference is the color.

---

# 33. Weekly Off Styling

```css
.status-wo {
    background-color: #e2e8ed;
    --slds-c-input-color-background: #e2e8ed;
    border-radius: 4px;
    font-weight: 500;
}
```

Weekly Off uses a light gray background.

This visually communicates that the day is different from a working day.

---

# 34. Leave Styling

```css
.status-leave {
    background-color: #fff1c7;
    --slds-c-input-color-background: #fff1c7;
    border-radius: 4px;
    font-weight: 500;
}
```

Leave uses a light yellow background.

Again, the structure remains the same; only the status-specific color changes.

---

# 35. LOP Styling

```css
.status-lop {
    background-color: #f8d7da;
    --slds-c-input-color-background: #f8d7da;
    border-radius: 4px;
    font-weight: 500;
}
```

LOP (Loss of Pay) uses a light red/pink background.

This gives the status a visually distinct appearance.

---

# 36. Holiday Styling

```css
.status-holiday {
    background-color: #e6d5f7;
    --slds-c-input-color-background: #e6d5f7;
    border-radius: 4px;
    font-weight: 500;
}
```

Holiday uses a light purple background.

---

# 37. Empty Status Styling

```css
.status-empty {
    background-color: white;
    --slds-c-input-color-background: white;
    border-radius: 4px;
}
```

This is the default/empty visual state.

If there is no attendance status, the cell remains white.

---

# 38. Why Use Separate Status Classes?

Instead of one large complicated CSS rule, you have:

```text
.status-wfo
.status-wfh
.status-wo
.status-leave
.status-lop
.status-holiday
.status-empty
```

This makes the state system easy to understand.

The JavaScript decides:

```text
What state is this cell?
```

CSS decides:

```text
How should that state look?
```

For example:

```text
WFO
↓
status-wfo
↓
green

WFH
↓
status-wfh
↓
blue

Leave
↓
status-leave
↓
yellow
```

This separation is good application design.

---

# 39. The Status Legend CSS

Your legend container is:

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

This controls how the legend items are positioned.

---

# 40. `display: flex`

```css
display: flex;
```

turns the container into a flexible layout.

The legend items can then be arranged horizontally:

```text
[WFO] [WFH] [WO] [Leave] [LOP] [Holiday]
```

instead of automatically stacking vertically.

---

# 41. `justify-content: flex-end`

```css
justify-content: flex-end;
```

moves the legend items toward the end of the horizontal row.

For a left-to-right layout, this generally means the right side.

Conceptually:

```text
                               WFO WFH WO Leave LOP Holiday
```

instead of:

```text
WFO WFH WO Leave LOP Holiday
```

starting at the left.

---

# 42. `align-items: center`

```css
align-items: center;
```

vertically aligns the children in the center.

This is useful because each item contains:

```text
[Colored box] WFO
```

The box and text should line up nicely.

---

# 43. `gap: 18px`

```css
gap: 18px;
```

creates 18px of spacing between legend items.

Without it:

```text
[green]WFO[blue]WFH[gray]WO
```

could look crowded.

With it:

```text
[green] WFO    [blue] WFH    [gray] WO
```

it becomes easier to read.

---

# 44. `margin-bottom: 12px`

```css
margin-bottom: 12px;
```

creates external space below the legend.

This separates:

```text
Legend
```

from:

```text
Attendance Table
```

---

# 45. `flex-wrap: wrap`

```css
flex-wrap: wrap;
```

allows the legend items to move to another line if there isn't enough horizontal space.

For example, on a smaller screen:

```text
WFO  WFH  WO  Leave
LOP  Holiday
```

instead of overflowing outside the container.

This improves responsiveness.

---

# 46. `.legend-item`

Your CSS:

```css
.legend-item {

    display: flex;

    align-items: center;

    gap: 6px;

    font-size: 13px;

}
```

Each legend item looks like:

```text
[Color] WFO
```

---

# 47. `display: flex` on Legend Item

This places the color box and text next to each other.

Without a suitable layout, they could be positioned less predictably.

With flex:

```text
[Color] WFO
```

---

# 48. `align-items: center`

This vertically centers:

```text
Color Box
+
WFO text
```

so they line up cleanly.

---

# 49. `gap: 6px`

Creates 6px of space:

```text
[Color]  WFO
```

instead of:

```text
[Color]WFO
```

---

# 50. `font-size: 13px`

Sets the legend text size to 13px.

The legend is secondary information, so it is intentionally smaller than major headings.

---

# 51. `.legend-box`

Your CSS:

```css
.legend-box {

    width: 22px;

    height: 14px;

    border-radius: 3px;

    display: inline-block;

}
```

This defines the physical shape of the small color indicator.

---

# 52. `width: 22px`

```css
width: 22px;
```

The color box is 22px wide.

---

# 53. `height: 14px`

```css
height: 14px;
```

The color box is 14px tall.

Therefore:

```text
22px × 14px
```

---

# 54. `border-radius: 3px`

Rounds the corners slightly.

---

# 55. `display: inline-block`

```css
display: inline-block;
```

allows the element to behave as an inline item while still respecting width and height.

This is useful for a small visual rectangle such as your legend box.

---

# 56. Monthly Summary CSS

Your summary box uses:

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

This creates a light-blue information message.

Conceptually:

```text
┌──────────────────────────────────────────────────────┐
│  Monthly Summary will be available in the next phase │
└──────────────────────────────────────────────────────┘
```

---

# 57. `display: flex` in Summary

```css
display: flex;
```

allows the summary icon and summary text to sit beside each other.

Your HTML is:

```html
<div class="summary-message">
    <span class="summary-icon"></span>
    <span>Monthly Summary will be available in the next phase.</span>
</div>
```

The structure becomes:

```text
[Icon]    Monthly Summary will be available...
```

---

# 58. `align-items: center`

```css
align-items: center;
```

vertically centers the icon and text.

---

# 59. `gap: 10px`

```css
gap: 10px;
```

creates 10px between:

```text
Icon
and
Text
```

---

# 60. `padding: 12px 16px`

```css
padding: 12px 16px;
```

means:

```text
Top/Bottom = 12px
Left/Right = 16px
```

This gives the message box comfortable internal spacing.

---

# 61. `border: 1px solid #b8d8f5`

This creates:

```text
Border width = 1px
Border style = solid
Border color = #b8d8f5
```

So the summary message gets a subtle blue border.

---

# 62. `background-color: #eef6ff`

This gives the summary message a light blue background.

It makes it look like an informational message rather than an interactive control.

---

# 63. `font-size: 14px`

The message text is set to 14px.

This keeps it readable without making it visually dominant.

---

# 64. `.summary-icon`

Your CSS:

```css
.summary-icon {

    font-weight: bold;

    font-size: 18px;

}
```

This styles the summary icon element.

The current HTML contains:

```html
<span class="summary-icon"></span>
```

The class is prepared to control an icon or visual indicator.

---

# 65. The CSS Architecture of Your Attendance Tracker

Your CSS can be divided into several responsibilities.

## Table Layout

```text
.attendance-table
.attendance-table th
.attendance-table td
```

Controls the overall table.

## Employee Column

```text
.employee-column
```

Controls:

- sticky behavior
- width
- alignment
- stacking
- background

## Day Headers

```text
.day-column
```

Controls:

- day width
- header background

## Attendance State

```text
.status-wfo
.status-wfh
.status-wo
.status-leave
.status-lop
.status-holiday
.status-empty
```

Controls the visual representation of each attendance state.

## Legend

```text
.status-legend
.legend-item
.legend-box
```

Controls the status legend.

## Summary

```text
.summary-message
.summary-icon
```

Controls the monthly summary placeholder.

---

# 66. The Most Important CSS Flow

The most important relationship in your CSS is:

```text
Attendance Status
       ↓
JavaScript
       ↓
statusClass
       ↓
HTML
class={day.statusClass}
       ↓
CSS Selector
.status-wfo
       ↓
Visual Style
Green Background
```

For example:

```text
day.status = "WFO"
        ↓
day.statusClass = "status-wfo"
        ↓
<td class="status-wfo">
        ↓
.status-wfo {
    background-color: #B7E4C7;
}
        ↓
Green attendance cell
```

This is a very important LWC pattern.

---

# 67. Why JavaScript Should Not Control Every Color Directly

You could theoretically make JavaScript directly manipulate colors.

But your current design is cleaner:

```text
JavaScript
→ Determines state

CSS
→ Determines appearance
```

For example:

```text
JavaScript:
"This attendance is WFO."

CSS:
"WFO should look green."
```

This keeps business logic separate from presentation.

If tomorrow you decide WFO should be dark green instead of light green, you only change CSS.

You don't need to change your JavaScript logic.

---

# 68. Full HTML + CSS Relationship

Your component can be visualized like this:

```text
HTML
│
├── Attendance Tracker Card
│
├── Month Combobox
│
├── Year Combobox
│
├── Attendance Grid
│   │
│   ├── Status Legend
│   │
│   └── Attendance Table
│       │
│       ├── Employee Column
│       │
│       ├── Day Columns
│       │
│       └── Attendance Cells
│
└── Monthly Summary
```

CSS then styles each part:

```text
Attendance Table
    ↓
.attendance-table

Employee Column
    ↓
.employee-column

Day Headers
    ↓
.day-column

WFO
    ↓
.status-wfo

WFH
    ↓
.status-wfh

Weekly Off
    ↓
.status-wo

Leave
    ↓
.status-leave

LOP
    ↓
.status-lop

Holiday
    ↓
.status-holiday

Legend
    ↓
.status-legend
.legend-item
.legend-box

Summary
    ↓
.summary-message
.summary-icon
```

---

# 69. Important CSS Concepts You Are Already Using

Your Attendance Tracker is already teaching you several important CSS concepts:

## 1. Selectors

```css
.status-wfo
```

## 2. Classes

```html
class="attendance-table"
```

## 3. Flexbox

```css
display: flex;
```

## 4. Spacing

```css
padding
margin
gap
```

## 5. Width management

```css
min-width
max-width
width
```

## 6. Positioning

```css
position: sticky;
left: 0;
```

## 7. Layering

```css
z-index
```

## 8. Colors

```css
background-color
```

## 9. Borders

```css
border
border-radius
```

## 10. Text formatting

```css
font-size
font-weight
text-align
white-space
```

## 11. Responsive behavior

```css
flex-wrap
slds-scrollable_x
```

## 12. Salesforce styling hooks

```css
--slds-c-input-color-background
```

These are all useful concepts for your future LWC development.

---

# 70. Final Mental Model

Do not try to memorize every CSS property immediately.

Instead, remember:

```text
HTML
"What elements exist?"
        ↓
CSS
"How should those elements look?"
```

For your Attendance Tracker:

```text
HTML creates the table
        ↓
CSS controls table layout
        ↓
HTML creates Employee column
        ↓
CSS makes it sticky
        ↓
HTML creates day columns
        ↓
CSS controls their width
        ↓
HTML creates attendance cells
        ↓
JavaScript chooses status class
        ↓
CSS colors the cell
```

The most important architectural separation is:

```text
Apex
↓
Salesforce Data

JavaScript
↓
Application Logic + State

HTML
↓
Component Structure + User Interaction

CSS
↓
Visual Appearance
```

Once you understand this separation, you don't need to memorize the entire CSS file. You can look at a new CSS rule and ask:

> "Which HTML element does this selector target, and what visual problem is this rule solving?"

That is the mindset you should develop as you continue learning LWC.
