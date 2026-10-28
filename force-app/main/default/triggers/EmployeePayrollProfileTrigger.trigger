trigger EmployeePayrollProfileTrigger on Employee_Payroll_Profile__c (before insert, before update) {
    EmployeePayrollProfileSyncHandler.enforceOneProfilePerEmployee(Trigger.new);
}
