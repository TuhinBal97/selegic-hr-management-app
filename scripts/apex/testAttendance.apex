// =====================================================
// METHOD 1 TEST
// =====================================================

// List<Employee__c> employees = AttendanceController.getActiveEmployees();

// System.debug('===== ACTIVE EMPLOYEES =====');

// for (Employee__c employee : employees) {
//     System.debug('Employee: ' + employee.Name);
// }

// System.debug('Total Active Employees: ' + employees.size());


// =====================================================
// METHOD 2 TEST
// =====================================================

// List<Attendance__c> attendanceRecords =
//     AttendanceController.getMonthlyAttendance(8, 2026);

// System.debug('===== MONTHLY ATTENDANCE =====');

// for (Attendance__c attendance : attendanceRecords) {

//     System.debug(
//         'Employee: ' + attendance.Employee__r.Name +
//         ' | Date: ' + attendance.Attendance_Date__c +
//         ' | Status: ' + attendance.Status__c
//     );
// }

// System.debug(
//     'Total Attendance Records: ' + attendanceRecords.size()
// );

/// =====================================================
// METHOD 3 TEST - OCTOBER 2026
// =====================================================

// List<Holiday__c> holidays =
//     AttendanceController.getMonthlyHolidays(8, 2026);

// System.debug('===== OCTOBER HOLIDAYS =====');

// for (Holiday__c holiday : holidays) {

//     System.debug(
//         'Holiday: ' + holiday.Name +
//         ' | Date: ' + holiday.Holiday_Date__c +
//         ' | Description: ' + holiday.Description__c +
//         ' | Active: ' + holiday.Active__c
//     );
// }

// System.debug('Total Holidays: ' + holidays.size());

// ========================================
// METHOD 4 TEST - UPDATE EXISTING RECORD
// ========================================

// Find Anik Mallick
Employee__c employee = [
    SELECT Id, Name
    FROM Employee__c
    WHERE Name = 'Anik Mallick'
    LIMIT 1
];

System.debug('===== EMPLOYEE =====');
System.debug('Employee: ' + employee.Name);
System.debug('Employee Id: ' + employee.Id);


// Call saveAttendance()
// Anik already has ATT-00001 for August 1, 2026.
// Therefore, saveAttendance() should UPDATE that record.
Attendance__c result =
    AttendanceController.saveAttendance(
        employee.Id,
        Date.newInstance(2026, 8, 1),
        'Work From Office',
        'Updated through Apex test'
    );


// Display the result
System.debug('===== SAVE ATTENDANCE RESULT =====');
System.debug('Attendance Id: ' + result.Id);
System.debug('Employee: ' + employee.Name);
System.debug('Date: ' + result.Attendance_Date__c);
System.debug('Status: ' + result.Status__c);
System.debug('Remarks: ' + result.Remarks__c);