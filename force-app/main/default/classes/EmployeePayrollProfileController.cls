public with sharing class EmployeePayrollProfileController {
    @AuraEnabled(cacheable=true)
    public static Employee_Payroll_Profile__c getProfileForEmployee(Id employeeId) {
        if (employeeId == null) {
            return null;
        }

        List<Employee_Payroll_Profile__c> profiles = [
            SELECT Id,
                Name,
                Employee__c,
                Employee__r.Name,
                Employee_ID__c,
                Designation__c,
                Bank_Account_Number__c,
                PF_Number__c,
                UAN_Number__c,
                PAN_Number__c,
                Date_of_Joining__c,
                ESI_Number__c
            FROM Employee_Payroll_Profile__c
            WHERE Employee__c = :employeeId
            LIMIT 2
        ];

        if (profiles.size() > 1) {
            throw new AuraHandledException('More than one payroll profile exists for this employee. Ask an administrator to resolve the duplicate records.');
        }
        if (profiles.isEmpty()) {
            return null;
        }

        return (Employee_Payroll_Profile__c) Security.stripInaccessible(
            AccessType.READABLE,
            profiles
        ).getRecords()[0];
    }
}
