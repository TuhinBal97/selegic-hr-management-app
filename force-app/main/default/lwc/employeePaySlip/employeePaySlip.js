import { LightningElement, wire } from 'lwc';
import generatePayslipPdf from '@salesforce/apex/PayrollDocumentController.generatePayslipPdf';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getFieldValue, getRecord } from 'lightning/uiRecordApi';
import EMPLOYEE_OBJECT from '@salesforce/schema/Employee__c';
import EMPLOYEE_NAME_FIELD from '@salesforce/schema/Employee__c.Name';
import getProfileForEmployee from '@salesforce/apex/EmployeePayrollProfileController.getProfileForEmployee';

const EMPLOYEE_FIELDS = [EMPLOYEE_NAME_FIELD];

let nextLineId = 0;

function makeLine(description = '', amount = '') {
    nextLineId += 1;
    return { id: `pay-${nextLineId}`, description, amount };
}

function formatPdfDate(value, separator = '/') {
    if (!value) {
        return '';
    }
    const [year, month, day] = value.split('-');
    return `${day}${separator}${month}${separator}${year}`;
}

function payPeriodFilenameLabel(value) {
    const period = String(value || '').trim();
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const yearMonth = period.match(/^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?$/);
    if (yearMonth && Number(yearMonth[2]) >= 1 && Number(yearMonth[2]) <= 12) {
        return `${monthNames[Number(yearMonth[2]) - 1]} ${yearMonth[1]}`;
    }

    const monthYear = period.match(/^([a-z]+)[\s,/-]+(\d{4})$/i);
    if (monthYear) {
        const monthInput = monthYear[1].toLowerCase();
        const monthIndex = monthNames.findIndex((month) =>
            month.toLowerCase() === monthInput || month.slice(0, 3).toLowerCase() === monthInput.slice(0, 3)
        );
        if (monthIndex >= 0) {
            return `${monthNames[monthIndex]} ${monthYear[2]}`;
        }
    }

    const monthNumberYear = period.match(/^(\d{1,2})[/-](\d{4})$/);
    if (monthNumberYear && Number(monthNumberYear[1]) >= 1 && Number(monthNumberYear[1]) <= 12) {
        return `${monthNames[Number(monthNumberYear[1]) - 1]} ${monthNumberYear[2]}`;
    }

    return period.replace(/[<>:"\/\\|?*\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim() || 'Pay Period';
}

function errorMessage(error) {
    return error?.body?.message || error?.message || 'The payslip could not be processed.';
}

function downloadBase64Pdf(component, base64, fileName) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const link = component.template.querySelector('[data-id="downloadLink"]');
    link.href = url;
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default class EmployeePaySlip extends LightningElement {
    employeeName = '';
    selectedEmployeeId;
    employeeId = '';
    designation = '';
    payPeriod = '';
    payDate = '';
    dateOfJoining = '';
    pfNumber = '';
    pan = '';
    bankAccountNumber = '';
    uanNumber = '';
    paidDays = '';
    lopDays = '';
    earnings = [
        makeLine('Basic'),
        makeLine('House Rent Allowance'),
        makeLine('Conveyance'),
        makeLine('CCA'),
        makeLine('Gratuity'),
        makeLine('Bonus'),
        makeLine('BYOD')
    ];
    deductions = [
        makeLine('Provident Fund'),
        makeLine('P-Tax')
    ];
    bonusDescription = 'Special Bonus';
    bonusAmount = '';
    bonusTdsPercent = '';
    isBusy = false;
    isLoadingEmployeeProfile = false;
    employeeProfileError = '';
    employeeProfile;

    @wire(getRecord, { recordId: '$selectedEmployeeId', fields: EMPLOYEE_FIELDS })
    wiredEmployee({ data }) {
        if (data) {
            this.employeeName = getFieldValue(data, EMPLOYEE_NAME_FIELD) || '';
        }
    }

    @wire(getProfileForEmployee, { employeeId: '$selectedEmployeeId' })
    wiredEmployeeProfile({ data, error }) {
        if (data !== undefined) {
            this.isLoadingEmployeeProfile = false;
            this.employeeProfile = data || undefined;
            this.employeeProfileError = data ? '' : 'No payroll profile exists for this employee.';
            this.employeeId = data?.Employee_ID__c || '';
            this.designation = data?.Designation__c || '';
            this.bankAccountNumber = data?.Bank_Account_Number__c || '';
            this.pfNumber = data?.PF_Number__c || '';
            this.uanNumber = data?.UAN_Number__c || '';
            this.pan = data?.PAN_Number__c || '';
            this.dateOfJoining = data?.Date_of_Joining__c || '';
        } else if (error) {
            this.isLoadingEmployeeProfile = false;
            this.employeeProfile = undefined;
            this.employeeProfileError = errorMessage(error);
        }
    }

    get employeeObjectApiName() {
        return EMPLOYEE_OBJECT.objectApiName;
    }

    get isDownloadDisabled() {
        return this.isBusy || this.isLoadingEmployeeProfile;
    }

    handleEmployeeChange(event) {
        const selectedEmployeeId = event.detail.recordId;
        if (selectedEmployeeId !== this.selectedEmployeeId) {
            this.resetPayslipFields();
        }
        this.selectedEmployeeId = selectedEmployeeId;
        this.employeeName = '';
        this.isLoadingEmployeeProfile = Boolean(this.selectedEmployeeId);
    }

    resetPayslipFields() {
        this.employeeId = '';
        this.designation = '';
        this.payPeriod = '';
        this.payDate = '';
        this.dateOfJoining = '';
        this.pfNumber = '';
        this.pan = '';
        this.bankAccountNumber = '';
        this.uanNumber = '';
        this.paidDays = '';
        this.lopDays = '';
        this.employeeProfile = undefined;
        this.employeeProfileError = '';
        this.earnings = [
            makeLine('Basic'),
            makeLine('House Rent Allowance'),
            makeLine('Conveyance'),
            makeLine('CCA'),
            makeLine('Gratuity'),
            makeLine('Bonus'),
            makeLine('BYOD')
        ];
        this.deductions = [
            makeLine('Provident Fund'),
            makeLine('P-Tax')
        ];
        this.bonusDescription = 'Special Bonus';
        this.bonusAmount = '';
        this.bonusTdsPercent = '';
    }

    get gross() {
        return this.sumLines(this.earnings);
    }

    get deductionTotal() {
        return this.sumLines(this.deductions);
    }

    get bonusTotal() {
        return Number(this.bonusAmount) || 0;
    }

    get bonusTitle() {
        return this.bonusDescription.trim() || 'Special Bonus';
    }

    get bonusTotalLabel() {
        return `Total ${this.bonusTitle}`;
    }

    get bonusTdsLabel() {
        return `${this.bonusTitle} TDS`;
    }

    get bonusTdsTotal() {
        const tdsPaise = Math.round(this.bonusTotal * (Number(this.bonusTdsPercent) || 0) + Number.EPSILON);
        return tdsPaise / 100;
    }

    get netBonus() {
        return Math.round((this.bonusTotal - this.bonusTdsTotal) * 100) / 100;
    }

    get netBonusLabel() {
        return `Net ${this.bonusTitle}`;
    }

    get netPay() {
        return this.gross - this.deductionTotal + this.netBonus;
    }

    sumLines(lines) {
        return lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
    }

    handleHeaderChange(event) {
        this[event.target.dataset.field] = event.detail.value;
    }

    handleLineChange(event) {
        const { kind, id, field } = event.target.dataset;
        const value = event.detail.value;
        this[kind] = this[kind].map((line) => line.id === id ? { ...line, [field]: value } : line);
    }

    handleBonusChange(event) {
        this[event.target.dataset.field] = event.detail.value;
    }

    handleAddLine(event) {
        const kind = event.currentTarget.dataset.kind;
        this[kind] = [...this[kind], makeLine()];
    }

    handleRemoveLine(event) {
        const { kind, id } = event.currentTarget.dataset;
        this[kind] = this[kind].filter((line) => line.id !== id);
    }

    validateForm() {
        let valid = true;
        this.template.querySelectorAll('lightning-input').forEach((input) => {
            if (!input.checkValidity()) {
                input.reportValidity();
                valid = false;
            }
        });
        if (this.gross <= 0) {
            this.showToast('Add an earning amount', 'Enter at least one earning amount greater than zero.', 'error');
            valid = false;
        }
        if (this.deductionTotal > this.gross) {
            this.showToast('Review deductions', 'Total deductions cannot be greater than gross earnings.', 'error');
            valid = false;
        }
        const hasMissingDescription = [...this.earnings, ...this.deductions].some((line) =>
            String(line.amount).trim() !== '' && !line.description.trim()
        );
        if (hasMissingDescription) {
            this.showToast('Add a pay item description', 'Every amount needs a description.', 'error');
            valid = false;
        }
        const tdsPercent = Number(this.bonusTdsPercent) || 0;
        if (tdsPercent < 0 || tdsPercent > 99 || !Number.isInteger(tdsPercent)) {
            this.showToast('Review bonus TDS', 'TDS must be a whole-number percentage from 0 to 99.', 'error');
            valid = false;
        }
        if (this.bonusTotal > 0 && !this.bonusDescription.trim()) {
            this.showToast('Add bonus details', 'Enter a description for the bonus amount.', 'error');
            valid = false;
        }
        return valid;
    }

    buildPayload() {
        const toPayLines = (lines) => lines.filter((line) => String(line.amount).trim() !== '').map((line) => ({
            description: line.description,
            amount: Number(line.amount) || 0
        }));
        const toBonusLines = this.bonusTotal > 0 ? [{
            description: this.bonusDescription,
            amount: this.bonusTotal,
            tdsPercent: Number(this.bonusTdsPercent) || 0
        }] : [];
        return JSON.stringify({
            payPeriod: this.payPeriod,
            employeeName: this.employeeName,
            employeeId: this.employeeId,
            payDate: formatPdfDate(this.payDate),
            designation: this.designation,
            pfNumber: this.pfNumber,
            pan: this.pan,
            bankAccountNumber: this.bankAccountNumber,
            uanNumber: this.uanNumber,
            dateOfJoining: formatPdfDate(this.dateOfJoining, '-'),
            paidDays: this.paidDays,
            lopDays: this.lopDays,
            earnings: toPayLines(this.earnings),
            deductions: toPayLines(this.deductions),
            bonuses: toBonusLines
        });
    }

    async handleDownload() {
        if (!this.selectedEmployeeId || !this.employeeProfile) {
            this.showToast(
                'Select an employee with a payroll profile',
                this.employeeProfileError || 'Choose an employee that has an Employee Payroll Profile.',
                'error'
            );
            return;
        }
        if (!this.validateForm()) {
            return;
        }
        this.isBusy = true;
        try {
            const pdf = await generatePayslipPdf({ payslipJson: this.buildPayload() });
            const periodLabel = payPeriodFilenameLabel(this.payPeriod);
            downloadBase64Pdf(this, pdf, `Salary Slip – ${periodLabel}.pdf`);
            this.showToast('Payslip ready', 'The PDF has been downloaded.', 'success');
        } catch (error) {
            this.showToast('Could not create payslip', errorMessage(error), 'error');
        } finally {
            this.isBusy = false;
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
