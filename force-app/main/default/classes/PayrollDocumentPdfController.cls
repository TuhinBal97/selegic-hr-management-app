public with sharing class PayrollDocumentPdfController {
    public InvoiceDocument invoice { get; private set; }
    public PayslipDocument payslip { get; private set; }
    public List<PayRow> payRows { get; private set; }
    public Boolean isInvoice { get; private set; }
    public Boolean isPayslip { get; private set; }

    public PayrollDocumentPdfController() {
        String payloadJson = ApexPages.currentPage().getParameters().get('payload');
        String documentType = ApexPages.currentPage().getParameters().get('documentType');
        if (String.isBlank(payloadJson)) {
            throw new VisualforceException('Document data is required.');
        }

        if (documentType == 'invoice') {
            invoice = (InvoiceDocument) JSON.deserialize(payloadJson, InvoiceDocument.class);
            if (invoice == null) {
                throw new VisualforceException('Invoice data is required.');
            }
            normalizeInvoice(invoice);
            isInvoice = true;
            isPayslip = false;
        } else if (documentType == 'payslip') {
            payslip = (PayslipDocument) JSON.deserialize(payloadJson, PayslipDocument.class);
            if (payslip == null) {
                throw new VisualforceException('Payslip data is required.');
            }
            normalizePayslip(payslip);
            payRows = buildPayRows(payslip);
            isInvoice = false;
            isPayslip = true;
        } else {
            throw new VisualforceException('Choose a supported document type.');
        }
    }

    private static void normalizeInvoice(InvoiceDocument data) {
        if (data.lines == null) {
            data.lines = new List<ExpenseLine>();
        }
        Decimal total = 0;
        for (Integer index = 0; index < data.lines.size(); index++) {
            ExpenseLine line = data.lines[index];
            if (line == null) {
                continue;
            }
            Decimal amount = line.amount == null ? 0 : line.amount;
            if (amount < 0) {
                throw new VisualforceException('Amounts cannot be negative.');
            }
            line.lineNumber = index + 1;
            line.amountFormatted = formatAmount(amount);
            total += amount;
        }
        if (total <= 0) {
            throw new VisualforceException('Enter at least one expense amount greater than zero.');
        }
        data.totalFormatted = formatAmount(total);
    }

    private static void normalizePayslip(PayslipDocument data) {
        if (data.earnings == null) {
            data.earnings = new List<PayLine>();
        }
        if (data.deductions == null) {
            data.deductions = new List<PayLine>();
        }
        Decimal gross = normalizePayLines(data.earnings);
        Decimal deductions = normalizePayLines(data.deductions);
        if (gross <= 0) {
            throw new VisualforceException('Enter at least one earning amount greater than zero.');
        }
        if (deductions > gross) {
            throw new VisualforceException('Total deductions cannot be greater than gross earnings.');
        }
        data.grossFormatted = formatPayslipAmount(gross);
        data.deductionsFormatted = formatPayslipAmount(deductions);
        data.netPayFormatted = formatPayslipAmount(gross - deductions);
    }

    private static Decimal normalizePayLines(List<PayLine> lines) {
        Decimal total = 0;
        for (PayLine line : lines) {
            if (line == null) {
                continue;
            }
            Decimal amount = line.amount == null ? 0 : line.amount;
            if (amount < 0) {
                throw new VisualforceException('Amounts cannot be negative.');
            }
            line.amountFormatted = formatPayslipAmount(amount);
            total += amount;
        }
        return total;
    }

    private static String formatAmount(Decimal amount) {
        return formatPayslipAmount(amount);
    }

    private static String formatPayslipAmount(Decimal amount) {
        String formatted = amount.setScale(2).format();
        Integer decimalPoint = formatted.lastIndexOf('.');
        if (decimalPoint < 0) {
            return formatted + '.00';
        }
        String fraction = formatted.substring(decimalPoint + 1);
        if (fraction.length() == 1) {
            return formatted + '0';
        }
        if (fraction.length() > 2) {
            return formatted.substring(0, decimalPoint + 3);
        }
        return formatted;
    }

    private static List<PayRow> buildPayRows(PayslipDocument data) {
        List<PayRow> rows = new List<PayRow>();
        List<PayLine> earnings = data.earnings == null ? new List<PayLine>() : data.earnings;
        List<PayLine> deductions = data.deductions == null ? new List<PayLine>() : data.deductions;
        Integer rowCount = earnings.size() > deductions.size() ? earnings.size() : deductions.size();
        if (rowCount < 7) {
            rowCount = 7;
        }
        for (Integer index = 0; index < rowCount; index++) {
            PayRow row = new PayRow();
            if (index < earnings.size()) {
                row.earning = earnings[index];
                row.hasEarning = true;
            }
            if (index < deductions.size()) {
                row.deduction = deductions[index];
                row.hasDeduction = true;
            }
            rows.add(row);
        }
        return rows;
    }

    public class InvoiceDocument {
        public String invoiceNumber { get; set; }
        public String invoiceDate { get; set; }
        public String period { get; set; }
        public String preparedBy { get; set; }
        public String recipient { get; set; }
        public List<ExpenseLine> lines { get; set; }
        public String totalFormatted { get; set; }
        public String amountInWords { get; set; }
        public String notes { get; set; }
    }

    public class ExpenseLine {
        public Integer lineNumber { get; set; }
        public String description { get; set; }
        public Decimal amount { get; set; }
        public String amountFormatted { get; set; }
    }

    public class PayslipDocument {
        public String companyName { get; set; }
        public String companyAddress { get; set; }
        public String payPeriod { get; set; }
        public String employeeName { get; set; }
        public String employeeId { get; set; }
        public String payDate { get; set; }
        public String designation { get; set; }
        public String pfNumber { get; set; }
        public String pan { get; set; }
        public String bankAccountNumber { get; set; }
        public String uanNumber { get; set; }
        public String dateOfJoining { get; set; }
        public String paidDays { get; set; }
        public String lopDays { get; set; }
        public String grossFormatted { get; set; }
        public String deductionsFormatted { get; set; }
        public String netPayFormatted { get; set; }
        public String amountInWords { get; set; }
        public List<PayLine> earnings { get; set; }
        public List<PayLine> deductions { get; set; }
    }

    public class PayLine {
        public String description { get; set; }
        public Decimal amount { get; set; }
        public String amountFormatted { get; set; }
    }

    public class PayRow {
        public PayLine earning { get; set; }
        public PayLine deduction { get; set; }
        public Boolean hasEarning { get; set; }
        public Boolean hasDeduction { get; set; }
    }
}
