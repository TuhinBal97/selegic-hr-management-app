import { LightningElement } from 'lwc';
import generateInvoicePdf from '@salesforce/apex/PayrollDocumentController.generateInvoicePdf';
import getInvoiceHistory from '@salesforce/apex/MonthlyOfficeInvoiceController.getInvoiceHistory';
import getInvoice from '@salesforce/apex/MonthlyOfficeInvoiceController.getInvoice';
import saveInvoice from '@salesforce/apex/MonthlyOfficeInvoiceController.saveInvoice';
import deleteInvoice from '@salesforce/apex/MonthlyOfficeInvoiceController.deleteInvoice';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningConfirm from 'lightning/confirm';

const HISTORY_ACTIONS = [
    { label: 'Edit', name: 'edit' },
    { label: 'Download PDF', name: 'download' },
    { label: 'Delete', name: 'delete' }
];

const HISTORY_COLUMNS = [
    { label: 'Invoice No', fieldName: 'Invoice_Number__c' },
    { label: 'Invoice Date', fieldName: 'Invoice_Date__c', type: 'date-local' },
    { label: 'Due Date', fieldName: 'Due_Date__c', type: 'date-local' },
    {
        label: 'Total',
        fieldName: 'Invoice_Total__c',
        type: 'currency',
        typeAttributes: { currencyCode: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }
    },
    { type: 'action', typeAttributes: { rowActions: HISTORY_ACTIONS } }
];

const DEFAULT_TERMS = 'Due on Receipt';
const DEFAULT_BILL_TO_NAME = 'SELEGIC INC';
const DEFAULT_BILL_TO_ADDRESS = '4425 FORTRAN DR STE 112S, SAN JOSE, CA 95134 US\nU.S.A';
const DEFAULT_SHIP_TO_ADDRESS = 'Webel IT Park, DH Block, Newtown, Action Area I\nKolkata\n700160 West Bengal\nIndia';
const DEFAULT_NOTES = 'For questions about this invoice, please contact any of the following: Suvrajit Ghosh at +91 95477 05186 or suvra@selegic.com; Saptak Talukdar at +91 62912 96716 or saptak@selegic.com; or Rupak Dey at +91 83369 31797 or rupak@selegic.com.';

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

function endOfMonthDate(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-\d{2}$/);
    if (!match) {
        return '';
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const finalDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return `${match[1]}-${match[2]}-${String(finalDay).padStart(2, '0')}`;
}

function invoiceFilename(invoiceNumber, invoiceDate) {
    const safeNumber = String(invoiceNumber || '').trim().replace(/[^A-Za-z0-9_-]/g, '-');
    const date = new Date(`${invoiceDate}T00:00:00`);
    const monthName = Number.isNaN(date.getTime())
        ? 'Invoice'
        : new Intl.DateTimeFormat('en', { month: 'long' }).format(date);
    return `Invoice ${monthName} ${safeNumber || 'draft'}.pdf`;
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
    terms = DEFAULT_TERMS;
    dueDate = '';
    billToName = DEFAULT_BILL_TO_NAME;
    billToAddress = DEFAULT_BILL_TO_ADDRESS;
    shipToAddress = DEFAULT_SHIP_TO_ADDRESS;
    notes = DEFAULT_NOTES;
    lines = [
        makeLine(),
        makeLine()
    ];
    isBusy = false;
    invoiceHistory = [];
    historyColumns = HISTORY_COLUMNS;
    isLoadingHistory = false;
    historyError = '';
    editingInvoiceId;
    isEditingInvoice = false;

    connectedCallback() {
        this.loadInvoiceHistory();
    }

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

    get hasInvoiceHistory() {
        return this.invoiceHistory.length > 0;
    }

    get showHistoryEmptyState() {
        return !this.isLoadingHistory && !this.historyError && !this.hasInvoiceHistory;
    }

    get isHistoryRefreshDisabled() {
        return this.isLoadingHistory || this.isBusy;
    }

    get invoiceActionLabel() {
        return this.isEditingInvoice ? 'Update & Download Invoice PDF' : 'Save & Download Invoice PDF';
    }

    handleHeaderChange(event) {
        const field = event.target.dataset.field;
        const value = event.detail.value;
        this[field] = value;
        if (field === 'invoiceDate') {
            this.dueDate = endOfMonthDate(value);
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

    buildRecordPayload() {
        const payload = JSON.parse(this.buildPayload());
        payload.invoiceDate = this.invoiceDate;
        payload.dueDate = this.dueDate;
        return JSON.stringify(payload);
    }

    async loadInvoiceHistory() {
        this.isLoadingHistory = true;
        this.historyError = '';
        try {
            this.invoiceHistory = await getInvoiceHistory();
        } catch (error) {
            this.invoiceHistory = [];
            this.historyError = errorMessage(error);
        } finally {
            this.isLoadingHistory = false;
        }
    }

    handleRefreshHistory() {
        if (!this.isLoadingHistory && !this.isBusy) {
            this.loadInvoiceHistory();
        }
    }

    async handleHistoryAction(event) {
        if (this.isBusy) {
            return;
        }
        const { action, row } = event.detail;
        this.isBusy = true;
        try {
            if (action.name === 'edit') {
                await this.loadInvoiceForEdit(row.Id);
            } else if (action.name === 'download') {
                await this.downloadSavedInvoice(row.Id);
            } else if (action.name === 'delete') {
                const confirmed = await LightningConfirm.open({
                    label: 'Delete invoice',
                    message: `Delete invoice ${row.Invoice_Number__c}? It will be removed from the invoice history.`,
                    variant: 'header'
                });
                if (confirmed) {
                    await deleteInvoice({ invoiceId: row.Id });
                    if (this.editingInvoiceId === row.Id) {
                        this.resetForNewInvoice();
                    }
                    await this.loadInvoiceHistory();
                    this.showToast('Invoice deleted', `${row.Invoice_Number__c} was removed from invoice history.`, 'success');
                }
            }
        } catch (error) {
            this.showToast('Invoice action failed', errorMessage(error), 'error');
        } finally {
            this.isBusy = false;
        }
    }

    async loadInvoiceForEdit(invoiceId) {
        const invoice = await getInvoice({ invoiceId });
        let savedLines = [];
        try {
            savedLines = JSON.parse(invoice.Line_Items_JSON__c || '[]');
        } catch (error) {
            throw new Error('The saved invoice line items could not be read.');
        }

        this.invoiceNumber = invoice.Invoice_Number__c || '';
        this.invoiceDate = invoice.Invoice_Date__c || '';
        this.dueDate = invoice.Due_Date__c || '';
        this.terms = invoice.Terms__c || '';
        this.billToName = invoice.Bill_To_Name__c || '';
        this.billToAddress = invoice.Bill_To_Address__c || '';
        this.shipToAddress = invoice.Ship_To_Address__c || '';
        this.notes = invoice.Notes__c || '';
        this.lines = savedLines.map((line) => makeLine(line.description || '', line.amount ?? ''));
        this.editingInvoiceId = invoice.Id;
        this.isEditingInvoice = true;
        this.scrollToInvoiceForm();
        this.showToast('Invoice loaded', `${invoice.Invoice_Number__c} is ready to edit.`, 'info');
    }

    async downloadSavedInvoice(invoiceId) {
        const invoice = await getInvoice({ invoiceId });
        const lines = JSON.parse(invoice.Line_Items_JSON__c || '[]');
        const payload = {
            invoiceNumber: invoice.Invoice_Number__c,
            invoiceDate: formatPdfDate(invoice.Invoice_Date__c),
            terms: invoice.Terms__c,
            dueDate: formatPdfDate(invoice.Due_Date__c),
            billToName: invoice.Bill_To_Name__c,
            billToAddress: invoice.Bill_To_Address__c,
            shipToAddress: invoice.Ship_To_Address__c,
            notes: invoice.Notes__c,
            lines
        };
        const pdf = await generateInvoicePdf({ invoiceJson: JSON.stringify(payload) });
        downloadBase64Pdf(this, pdf, invoiceFilename(invoice.Invoice_Number__c, invoice.Invoice_Date__c));
        this.showToast('Invoice ready', `${invoice.Invoice_Number__c} has been downloaded.`, 'success');
    }

    async handleNewInvoice() {
        const confirmed = await LightningConfirm.open({
            label: 'Start a new invoice',
            message: 'Start a new invoice? Unsaved changes to the current invoice will be discarded.',
            variant: 'header'
        });
        if (confirmed) {
            this.resetForNewInvoice();
            this.scrollToInvoiceForm();
        }
    }

    resetForNewInvoice() {
        this.invoiceNumber = '';
        this.invoiceDate = '';
        this.dueDate = '';
        this.terms = DEFAULT_TERMS;
        this.billToName = DEFAULT_BILL_TO_NAME;
        this.billToAddress = DEFAULT_BILL_TO_ADDRESS;
        this.shipToAddress = DEFAULT_SHIP_TO_ADDRESS;
        this.notes = DEFAULT_NOTES;
        this.lines = [makeLine(), makeLine()];
        this.editingInvoiceId = undefined;
        this.isEditingInvoice = false;
    }

    scrollToInvoiceForm() {
        this.template.querySelector('[data-id="invoiceForm"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async handleDownload() {
        if (this.isBusy || !this.validateForm()) {
            return;
        }
        const pdfPayload = this.buildPayload();
        const recordPayload = this.buildRecordPayload();
        const invoiceNumber = this.invoiceNumber;
        const invoiceDate = this.invoiceDate;
        const invoiceIdToSave = this.editingInvoiceId;
        const wasEditing = this.isEditingInvoice;
        this.isBusy = true;
        try {
            const pdf = await generateInvoicePdf({ invoiceJson: pdfPayload });
            const invoiceId = await saveInvoice({ invoiceJson: recordPayload, invoiceId: invoiceIdToSave });
            this.editingInvoiceId = invoiceId;
            this.isEditingInvoice = true;
            downloadBase64Pdf(this, pdf, invoiceFilename(invoiceNumber, invoiceDate));
            await this.loadInvoiceHistory();
            this.showToast(
                wasEditing ? 'Invoice updated' : 'Invoice saved',
                wasEditing ? 'The updated invoice has been saved and downloaded.' : 'The invoice has been saved to history and downloaded.',
                'success'
            );
        } catch (error) {
            this.showToast('Could not save invoice', errorMessage(error), 'error');
        } finally {
            this.isBusy = false;
        }
    }

    showToast(title, message, variant, mode = 'dismissible') {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant, mode }));
    }
}
