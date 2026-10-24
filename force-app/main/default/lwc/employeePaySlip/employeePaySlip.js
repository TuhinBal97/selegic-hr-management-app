import { LightningElement } from 'lwc';
import generatePayslipPdf from '@salesforce/apex/PayrollDocumentController.generatePayslipPdf';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

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
        makeLine('Income Tax'),
        makeLine('Provident Fund'),
        makeLine('P-Tax')
    ];
    isBusy = false;

    get gross() {
        return this.sumLines(this.earnings);
    }

    get deductionTotal() {
        return this.sumLines(this.deductions);
    }

    get netPay() {
        return this.gross - this.deductionTotal;
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
        return valid;
    }

    buildPayload() {
        const toPayLines = (lines) => lines.filter((line) => String(line.amount).trim() !== '').map((line) => ({
            description: line.description,
            amount: Number(line.amount) || 0
        }));
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
            deductions: toPayLines(this.deductions)
        });
    }

    async handleDownload() {
        if (!this.validateForm()) {
            return;
        }
        this.isBusy = true;
        try {
            const pdf = await generatePayslipPdf({ payslipJson: this.buildPayload() });
            const safeName = this.employeeName.trim().replace(/[^A-Za-z0-9_-]/g, '-');
            downloadBase64Pdf(this, pdf, `payslip-${safeName || 'employee'}-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}.pdf`);
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
