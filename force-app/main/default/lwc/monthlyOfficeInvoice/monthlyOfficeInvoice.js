import { LightningElement } from 'lwc';
import generateInvoicePdf from '@salesforce/apex/PayrollDocumentController.generateInvoicePdf';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

let nextLineId = 0;

function makeLine(description = '', amount = '') {
    nextLineId += 1;
    return { id: `expense-${nextLineId}`, description, amount };
}

const SMALL_NUMBERS = [
    'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function numberToIndianWords(number) {
    const value = Math.floor(Number(number) || 0);
    if (value < 20) {
        return SMALL_NUMBERS[value];
    }
    if (value < 100) {
        const tens = Math.floor(value / 10);
        const remainder = value % 10;
        return `${TENS[tens]}${remainder ? `-${SMALL_NUMBERS[remainder]}` : ''}`;
    }

    const groups = [
        [10000000, 'Crore'],
        [100000, 'Lakh'],
        [1000, 'Thousand'],
        [100, 'Hundred']
    ];
    const group = groups.find(([divisor]) => value >= divisor);
    const major = Math.floor(value / group[0]);
    const remainder = value % group[0];
    return `${numberToIndianWords(major)} ${group[1]}${remainder ? ` ${numberToIndianWords(remainder)}` : ''}`;
}

function amountToIndianWords(amount) {
    const totalPaise = Math.round((Number(amount) || 0) * 100);
    const rupees = Math.floor(totalPaise / 100);
    const paise = totalPaise % 100;
    return `Indian Rupee ${numberToIndianWords(rupees)}${paise ? ` and ${numberToIndianWords(paise)} Paise` : ''} Only`;
}

function formatPdfDate(value) {
    return value ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}` : '';
}

function errorMessage(error) {
    return error?.body?.message || error?.message || 'The invoice could not be processed.';
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

export default class MonthlyOfficeInvoice extends LightningElement {
    invoiceNumber = '';
    invoiceDate = '';
    terms = 'Due on Receipt';
    dueDate = '';
    billToName = 'SELEGIC INC';
    billToAddress = '4425 FORTRAN DR STE 112S, SAN JOSE, CA 95134 US\nU.S.A';
    shipToAddress = 'Webel IT Park, DH Block, Newtown, Action Area I\nKolkata\n700160 West Bengal\nIndia';
    notes = 'For questions about this invoice, please contact any of the following: Suvrajit Ghosh at +91 95477 05186 or suvra@selegic.com; Saptak Talukdar at +91 62912 96716 or saptak@selegic.com; or Rupak Dey at +91 83369 31797 or rupak@selegic.com.';
    lines = [
        makeLine(),
        makeLine()
    ];
    isBusy = false;

    get total() {
        return this.lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
    }

    get hasLines() {
        return this.lines.length > 0;
    }

    get displayLines() {
        return this.lines.map((line, index) => ({ ...line, lineNumber: index + 1 }));
    }

    get totalInWords() {
        return amountToIndianWords(this.total);
    }

    handleHeaderChange(event) {
        const field = event.target.dataset.field;
        const value = event.detail.value;
        this[field] = value;
        if (field === 'invoiceDate') {
            this.dueDate = value;
        }
    }

    handleLineChange(event) {
        const { id, field } = event.target.dataset;
        const value = event.detail.value;
        this.lines = this.lines.map((line) => line.id === id ? { ...line, [field]: value } : line);
    }

    handleAddLine() {
        this.lines = [...this.lines, makeLine()];
    }

    handleRemoveLine(event) {
        const id = event.currentTarget.dataset.id;
        this.lines = this.lines.filter((line) => line.id !== id);
    }

    validateForm() {
        let valid = true;
        this.template.querySelectorAll('lightning-input, lightning-textarea').forEach((input) => {
            if (!input.checkValidity()) {
                input.reportValidity();
                valid = false;
            }
        });
        if (this.total <= 0) {
            this.showToast('Add an expense amount', 'Enter at least one amount greater than zero.', 'error');
            valid = false;
        }
        if (this.lines.some((line) => String(line.amount).trim() !== '' && !line.description.trim())) {
            this.showToast('Add an expense description', 'Every expense amount needs a description.', 'error');
            valid = false;
        }
        return valid;
    }

    buildPayload() {
        return JSON.stringify({
            invoiceNumber: this.invoiceNumber,
            invoiceDate: formatPdfDate(this.invoiceDate),
            terms: this.terms,
            dueDate: formatPdfDate(this.dueDate),
            billToName: this.billToName,
            billToAddress: this.billToAddress,
            shipToAddress: this.shipToAddress,
            notes: this.notes,
            lines: this.lines.filter((line) => String(line.amount).trim() !== '').map((line) => ({
                description: line.description,
                amount: Number(line.amount) || 0
            }))
        });
    }

    async handleDownload() {
        if (!this.validateForm()) {
            return;
        }
        this.isBusy = true;
        try {
            const pdf = await generateInvoicePdf({ invoiceJson: this.buildPayload() });
            const safeNumber = this.invoiceNumber.trim().replace(/[^A-Za-z0-9_-]/g, '-');
            const invoiceDate = new Date(`${this.invoiceDate}T00:00:00`);
            const monthName = Number.isNaN(invoiceDate.getTime())
                ? 'Invoice'
                : new Intl.DateTimeFormat('en', { month: 'long' }).format(invoiceDate);
            downloadBase64Pdf(this, pdf, `Invoice ${monthName} ${safeNumber || 'draft'}.pdf`);
            this.showToast('Invoice ready', 'The PDF has been downloaded.', 'success');
        } catch (error) {
            this.showToast('Could not create invoice', errorMessage(error), 'error');
        } finally {
            this.isBusy = false;
        }
    }

    showToast(title, message, variant, mode = 'dismissible') {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant, mode }));
    }
}
