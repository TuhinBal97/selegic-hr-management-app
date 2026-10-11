public with sharing class AttendanceController {

   //Method 1: Get Employee data
    @AuraEnabled(cacheable=true)
    public static List<Employee__c> getActiveEmployees(){
        return[
            SELECT Id, Name FROM Employee__c 
            WHERE Active__c = TRUE
            ORDER BY NAME ASC
        ];
    }

    //Method 2: Get Monthly Attendance data
    @AuraEnabled(cacheable=true)
    public static List<Attendance__c> getMonthlyAttendance( 
        Integer month, 
        Integer year
    ){
        Date startDate = Date.newInstance(year, month, 1);
        Date endDate = startDate.addMonths(1).addDays(-1);  // Because we don't know how many days the month has.

        return[
             SELECT
                Id,
                Name,
                Employee__c,
                Employee__r.Name,
                Attendance_Date__c,
                Day__c,
                Month__c,
                Year__c,
                Status__c,
                Remarks__c
            FROM Attendance__c
            WHERE Attendance_Date__c >= :startDate
            AND Attendance_Date__c <= :endDate
            ORDER BY Attendance_Date__c, Employee__r.Name
        ];
    }

    // Method 3 - Get Monthly Holidays
    @AuraEnabled(cacheable=true)
    public static List<Holiday__c> getMonthlyHolidays(
        Integer month, 
        Integer year
    )
    {
        Date startDate = Date.newInstance(year, month, 1);
        Date endDate = startDate.addMonths(1).addDays(-1);

        return[
             SELECT
            Id,
            Name,
            Holiday_Date__c,
            Description__c,
            Active__c
        FROM Holiday__c
        WHERE Holiday_Date__c >= :startDate
        AND Holiday_Date__c <= :endDate
        AND Active__c = TRUE
        ORDER BY Holiday_Date__c
        ];
    }

    // Method 4 - Save or Update Attendance
    @AuraEnabled
    public static Attendance__c saveAttendance(
    Id employeeId,
    Date attendanceDate,
    String status,
    String remarks
) {
    if (employeeId == null || attendanceDate == null || String.isBlank(status)) {
        throw new AuraHandledException('Employee, date, and status are required.');
    }

    Set<String> allowedStatuses = new Set<String>{
        'None', 'Absent', 'WFO', 'WFH', 'Weekly_Off', 'Leave', 'Holiday'
    };
    if (!allowedStatuses.contains(status)) {
        throw new AuraHandledException('Choose a valid attendance status.');
    }

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

    Attendance__c attendance;  // Variable to hold the existing or newly created Attendance record


    if (!existingRecords.isEmpty()) {
        attendance = existingRecords[0];
        attendance.Status__c = status;
        attendance.Remarks__c = remarks;
        update attendance;
    } else {
        attendance = new Attendance__c();
        attendance.Employee__c = employeeId;
        attendance.Attendance_Date__c = attendanceDate;
        attendance.Status__c = status;
        attendance.Remarks__c = remarks;
        insert attendance;
    }

    return attendance;
}

}
