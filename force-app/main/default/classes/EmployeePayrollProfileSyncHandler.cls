public without sharing class EmployeePayrollProfileSyncHandler {
    public static void enforceOneProfilePerEmployee(List<Employee_Payroll_Profile__c> profiles) {
        Map<Id, List<Employee_Payroll_Profile__c>> incomingByEmployee = new Map<Id, List<Employee_Payroll_Profile__c>>();
        Set<Id> profileIds = new Set<Id>();

        for (Employee_Payroll_Profile__c profile : profiles) {
            if (profile.Id != null) {
                profileIds.add(profile.Id);
            }
            if (profile.Employee__c == null) {
                continue;
            }
            if (!incomingByEmployee.containsKey(profile.Employee__c)) {
                incomingByEmployee.put(profile.Employee__c, new List<Employee_Payroll_Profile__c>());
            }
            incomingByEmployee.get(profile.Employee__c).add(profile);
        }

        for (List<Employee_Payroll_Profile__c> sameEmployeeProfiles : incomingByEmployee.values()) {
            if (sameEmployeeProfiles.size() > 1) {
                for (Employee_Payroll_Profile__c profile : sameEmployeeProfiles) {
                    profile.addError('An employee can have only one Employee Payroll Profile.');
                }
            }
        }

        if (incomingByEmployee.isEmpty()) {
            return;
        }

        Set<Id> employeeIds = incomingByEmployee.keySet();
        for (Employee_Payroll_Profile__c existingProfile : [
            SELECT Id, Employee__c
            FROM Employee_Payroll_Profile__c
            WHERE Employee__c IN :employeeIds
        ]) {
            if (profileIds.contains(existingProfile.Id)) {
                continue;
            }
            for (Employee_Payroll_Profile__c incomingProfile : incomingByEmployee.get(existingProfile.Employee__c)) {
                incomingProfile.addError('An employee can have only one Employee Payroll Profile.');
            }
        }
    }

}
