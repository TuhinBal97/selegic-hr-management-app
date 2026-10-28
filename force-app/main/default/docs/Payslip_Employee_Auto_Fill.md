# Payslip employee auto-fill

The existing `employeePaySlip` component now uses a searchable Employee record picker. When an employee is selected, it loads that employee's existing `Employee_Payroll_Profile__c` record and pre-fills Employee ID, Designation, Bank A/C Number, PF Number, UAN Number, PAN, and Date of Joining. These values remain editable in the payslip form and are used for the generated PDF; edits are not saved back to the payroll profile. It will not generate a payslip unless a profile exists for the selected employee.

Clearing the employee resets the form, including pay dates, day counts, and all earning/deduction amounts and custom lines. Switching directly to another employee also resets those values before loading the next profile.

The profile lookup uses `Employee_Payroll_Profile__c.Employee__c`. Employee ID is the profile's existing formula field. The payroll fields are read from the profile record, rather than from `Employee__c`.

`EmployeePayrollProfileTrigger` prevents creating a second payroll profile for the same employee. The profile controller strips fields the current user cannot read, so field-level access controls which payroll data appears in the payslip form.
