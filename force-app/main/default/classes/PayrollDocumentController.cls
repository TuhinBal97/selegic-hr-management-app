public with sharing class PayrollDocumentController {
    private static final Integer MAX_PAYLOAD_LENGTH = 80000;
    private static final String PAYSLIP_COMPANY_NAME = 'Selegic India Private Limited';
    private static final String PAYSLIP_COMPANY_ADDRESS = 'Webel IT Park, PH-2, DH Block Action Area 1D, Newtown Kolkata\n700160 India';

    @AuraEnabled
    public static String generateInvoicePdf(String invoiceJson) {
        Map<String, Object> invoice = validatePayload(invoiceJson, 'invoice');
        return EncodingUtil.base64Encode(renderPdf('invoice', invoice));
    }

    @AuraEnabled
    public static String generatePayslipPdf(String payslipJson) {
        Map<String, Object> payslip = validatePayload(payslipJson, 'payslip');
        return EncodingUtil.base64Encode(renderPdf('payslip', payslip));
    }

    private static Map<String, Object> validatePayload(String payloadJson, String documentType) {
        if (String.isBlank(payloadJson)) {
            throw new AuraHandledException('Enter document details before generating the PDF.');
        }
        if (payloadJson.length() > MAX_PAYLOAD_LENGTH) {
            throw new AuraHandledException('The document has too many line items to generate.');
        }

        try {
            Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(payloadJson);
            String requiredValue = documentType == 'invoice'
                ? String.valueOf(payload.get('invoiceNumber'))
                : String.valueOf(payload.get('employeeName'));
            if (String.isBlank(requiredValue) || requiredValue == 'null') {
                throw new AuraHandledException(documentType == 'invoice'
                    ? 'Enter an invoice number.'
                    : 'Enter the employee name.');
            }
            if (documentType == 'invoice' && (
                isBlankValue(payload.get('invoiceDate')) ||
                isBlankValue(payload.get('terms')) ||
                isBlankValue(payload.get('dueDate')) ||
                isBlankValue(payload.get('billToName'))
            )) {
                throw new AuraHandledException('Enter the invoice dates, terms, and Bill To name.');
            }
            if (documentType == 'payslip' && (payload.get('payPeriod') == null || String.isBlank(String.valueOf(payload.get('payPeriod'))))) {
                throw new AuraHandledException('Enter the pay period.');
            }
            if (documentType == 'invoice') {
                Decimal invoiceTotal = sumLines(payload.get('lines'));
                if (invoiceTotal <= 0) {
                    throw new AuraHandledException('Enter at least one expense amount greater than zero.');
                }
            } else {
                Decimal gross = sumLines(payload.get('earnings'));
                Decimal deductions = sumLines(payload.get('deductions'));
                if (gross <= 0) {
                    throw new AuraHandledException('Enter at least one earning amount greater than zero.');
                }
                if (deductions > gross) {
                    throw new AuraHandledException('Total deductions cannot be greater than gross earnings.');
                }
            }
            return payload;
        } catch (AuraHandledException handledError) {
            throw handledError;
        } catch (Exception parseError) {
            throw new AuraHandledException('The document details could not be read. Review the fields and try again.');
        }
    }

    private static Decimal sumLines(Object rawLines) {
        if (rawLines == null) {
            return 0;
        }
        List<Object> lines;
        try {
            lines = (List<Object>) rawLines;
        } catch (Exception invalidList) {
            throw new AuraHandledException('Review the expense and pay line items.');
        }
        Decimal total = 0;
        for (Object rawLine : lines) {
            Map<String, Object> line;
            try {
                line = (Map<String, Object>) rawLine;
            } catch (Exception invalidLine) {
                throw new AuraHandledException('Review the expense and pay line items.');
            }
            Decimal amount = lineAmount(line);
            if (amount < 0) {
                throw new AuraHandledException('Amounts cannot be negative.');
            }
            if (amount > 0 && (line.get('description') == null || String.isBlank(String.valueOf(line.get('description'))))) {
                throw new AuraHandledException('Add a description to each line with an amount.');
            }
            total += amount;
        }
        return total;
    }

    private static Blob renderPdf(String documentType, Map<String, Object> payload) {
        try {
            Blob pdf;
            if (documentType == 'payslip') {
                pdf = renderPayslipVisualforcePdf(payload);
            } else {
                pdf = Blob.toPdf(buildInvoiceHtml(payload));
            }
            if (pdf == null || pdf.size() == 0) {
                throw new AuraHandledException('Salesforce returned an empty PDF response.');
            }
            String pdfHeader = EncodingUtil.convertToHex(pdf).toUpperCase();
            if (!pdfHeader.startsWith('255044462D')) {
                String returnedPrefix = pdfHeader.substring(0, Math.min(20, pdfHeader.length()));
                System.debug(LoggingLevel.ERROR,
                    'Payroll document PDF renderer returned content without a PDF header. Type: ' + documentType +
                    '; returned hex prefix: ' + returnedPrefix
                );
                throw new AuraHandledException(
                    'PDF validation failed. Salesforce returned bytes starting with hex ' + returnedPrefix + '.'
                );
            }
            return pdf;
        } catch (AuraHandledException handledError) {
            throw handledError;
        } catch (Exception renderError) {
            System.debug(LoggingLevel.ERROR,
                'Payroll document PDF render failed. Type: ' + renderError.getTypeName() +
                '; message: ' + renderError.getMessage() +
                '; stack: ' + renderError.getStackTraceString()
            );
            throw new AuraHandledException(
                'Salesforce could not render the ' + documentType + ' PDF: ' + renderError.getMessage()
            );
        }
    }

    private static Blob renderPayslipVisualforcePdf(Map<String, Object> payload) {
        Decimal gross = sumLines(payload.get('earnings'));
        Decimal deductions = sumLines(payload.get('deductions'));
        Decimal netPay = gross - deductions;
        String amountInWords = indianRupeesInWords(netPay);
        if (netPay != 1) {
            amountInWords = amountInWords.replace('Indian Rupee ', 'Indian Rupees ');
        }
        payload.put('amountInWords', amountInWords);

        PageReference payslipPage = Page.OfficeDocumentPdf;
        payslipPage.getParameters().put('documentType', 'payslip');
        payslipPage.getParameters().put('payload', JSON.serialize(payload));
        return payslipPage.getContentAsPDF();
    }

    private static Boolean isBlankValue(Object value) {
        return value == null || String.isBlank(String.valueOf(value));
    }

    private static String buildInvoiceHtml(Map<String, Object> invoice) {
        String watermarkUrl = URL.getOrgDomainUrl().toExternalForm() +
            PageReference.forResource('SelegicInvoiceWatermark').getUrl();
        String rows = '';
        Integer lineNumber = 0;
        for (Object rawLine : asLines(invoice.get('lines'))) {
            Map<String, Object> line = (Map<String, Object>) rawLine;
            if (line == null) {
                continue;
            }
            lineNumber++;
            rows += '<tr><td class="line-number">' + lineNumber + '</td><td>' + escapeHtmlWithBreaks(line.get('description')) +
                '</td><td class="amount">₹' + formatAmount(lineAmount(line)) + '</td></tr>';
        }

        Decimal total = sumLines(invoice.get('lines'));
        String totalFormatted = formatAmount(total);
        String totalInWords = escapeHtmlWithBreaks(indianRupeesInWords(total));
        return '<html><head><meta charset="UTF-8"/><style type="text/css">' +
            '@page { size: A4; margin: 16mm 14mm; }' +
            'body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 9pt; }' +
            'table { width: 100%; border-collapse: collapse; }' +
            '.invoice-frame { border: 1px solid #999; border-collapse: collapse; position: relative; z-index: 1; }' +
            '.watermark { position: fixed; top: 27%; left: 0; width: 100%; z-index: 0; border: 0; }' +
            '.invoice-frame td, .invoice-frame th { border: 1px solid #999; }' +
            '.header-content td, .metadata td, .totals td { border: 0; }' +
            '.top-cell { padding: 7px; height: 62px; vertical-align: top; }' +
            '.header-content { border: 0; } .header-content td { padding: 7px; vertical-align: bottom; }' +
            '.company-name { font-size: 14pt; font-weight: bold; }' +
            '.invoice-title { text-align: right; vertical-align: middle; font-size: 25pt; white-space: nowrap; }' +
            '.metadata td { padding: 2px 5px; }' +
            '.meta-label { width: 44%; } .meta-value { font-weight: bold; }' +
            '.party-heading td { padding: 4px 6px; background: #f0f0f0; font-weight: bold; }' +
            '.party-body td { padding: 6px; height: 88px; vertical-align: top; }' +
            '.line-table th, .line-table td { border: 1px solid #999; padding: 5px 6px; }' +
            '.line-table th { background: #f0f0f0; text-align: left; }' +
            '.line-number { text-align: center; width: 6%; } .amount { text-align: right; white-space: nowrap; width: 24%; }' +
            '.words-cell { width: 58%; padding: 8px; vertical-align: top; }' +
            '.totals-cell { width: 42%; padding: 4px 7px; vertical-align: top; }' +
            '.totals td { padding: 3px 2px; } .totals .value { text-align: right; white-space: nowrap; }' +
            '.grand-total { font-weight: bold; } .balance-due { font-weight: bold; font-size: 11pt; }' +
            '.notes-cell { padding: 8px; height: 120px; vertical-align: top; }' +
            '</style></head><body>' +
            '<img class="watermark" src="' + escapeHtml(watermarkUrl) + '" alt=""/>' +
            '<table class="invoice-frame" border="1" cellpadding="0" cellspacing="0"><tr>' +
            '<td colspan="2" class="top-cell"><table class="header-content" border="0" cellpadding="0" cellspacing="0"><tr>' +
            '<td width="50%"><span class="company-name">SELEGIC INDIA PRIVATE LIMITED</span><br/>' +
            'West Bengal<br/>India<br/>GSTIN 19ABGCS0576B1ZE</td>' +
            '<td class="invoice-title" width="50%">TAX INVOICE</td></tr></table></td></tr>' +
            '<tr><td class="top-cell" width="50%"><table class="metadata">' +
            '<tr><td class="meta-label">Invoice No</td><td class="meta-value">: ' + escapeHtmlWithBreaks(invoice.get('invoiceNumber')) + '</td></tr>' +
            '<tr><td class="meta-label">Invoice Date</td><td class="meta-value">: ' + escapeHtmlWithBreaks(invoice.get('invoiceDate')) + '</td></tr>' +
            '<tr><td class="meta-label">Terms</td><td class="meta-value">: ' + escapeHtmlWithBreaks(invoice.get('terms')) + '</td></tr>' +
            '<tr><td class="meta-label">Due Date</td><td class="meta-value">: ' + escapeHtmlWithBreaks(invoice.get('dueDate')) + '</td></tr>' +
            '</table></td><td class="top-cell" width="50%"></td></tr>' +
            '<tr class="party-heading"><td>Bill To</td><td>Ship To</td></tr>' +
            '<tr class="party-body"><td><strong>' + escapeHtmlWithBreaks(invoice.get('billToName')) + '</strong><br/>' +
            escapeHtmlWithBreaks(invoice.get('billToAddress')) + '</td><td>' + escapeHtmlWithBreaks(invoice.get('shipToAddress')) + '</td></tr>' +
            '<tr><td colspan="2" style="padding:0"><table class="line-table">' +
            '<tr><th class="line-number">#</th><th>Item &amp; Description</th><th class="amount">Amount</th></tr>' + rows +
            '</table></td></tr>' +
            '<tr><td class="words-cell"><div>Total In Words</div><strong><em>' + totalInWords +
            '</em></strong></td><td class="totals-cell"><table class="totals">' +
            '<tr><td>Sub Total</td><td class="value">' + totalFormatted + '</td></tr>' +
            '<tr class="grand-total"><td>Total</td><td class="value">₹' + totalFormatted + '</td></tr>' +
            '<tr class="balance-due"><td>Balance Due</td><td class="value">₹' + totalFormatted + '</td></tr>' +
            '</table></td></tr>' +
            '<tr><td colspan="2" class="notes-cell"><strong>Notes</strong><br/>' +
            escapeHtmlWithBreaks(invoice.get('notes')) + '</td></tr></table></body></html>';
    }

    private static String buildPayslipHtml(Map<String, Object> payslip) {
        String earningRows = '';
        String deductionRows = '';
        for (Object rawLine : asLines(payslip.get('earnings'))) {
            Map<String, Object> line = (Map<String, Object>) rawLine;
            if (line != null) {
                earningRows += '<tr><td>' + escapeHtml(line.get('description')) +
                    '</td><td class="amount">₹' + formatAmount(lineAmount(line)) + '</td></tr>';
            }
        }
        for (Object rawLine : asLines(payslip.get('deductions'))) {
            Map<String, Object> line = (Map<String, Object>) rawLine;
            if (line != null) {
                deductionRows += '<tr><td>' + escapeHtml(line.get('description')) +
                    '</td><td class="amount">₹' + formatAmount(lineAmount(line)) + '</td></tr>';
            }
        }

        Decimal gross = sumLines(payslip.get('earnings'));
        Decimal deductionsTotal = sumLines(payslip.get('deductions'));
        Decimal netPay = gross - deductionsTotal;
        String netFormatted = formatAmount(netPay);
        String payslipMonth = String.valueOf(payslip.get('payslipMonth'));
        if (String.isBlank(payslipMonth) || payslipMonth == 'null') {
            Date today = Date.today();
            List<String> monthNames = new List<String>{
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            };
            payslipMonth = monthNames[today.month() - 1] + ' ' + today.year();
        }
        String address = escapeHtmlWithBreaks(PAYSLIP_COMPANY_ADDRESS);
        String amountInWords = escapeHtml(indianRupeesInWords(netPay));
        return '<html><head><meta charset="UTF-8"/><style type="text/css">' +
            '@page { size: A4; margin: 12mm; }' +
            'body { font-family: Arial, Helvetica, sans-serif; color: #333; font-size: 9pt; }' +
            'table { width: 100%; border-collapse: collapse; }' +
            '.header td { vertical-align: top; padding: 5px 0 10px; }' +
            '.company { color: #333; font-size: 16pt; font-weight: bold; }' +
            '.muted { color: #6b6b6b; } .month { text-align: right; }' +
            '.month strong { color: #222; font-size: 12pt; }' +
            '.rule { border-top: 1px solid #cbd2df; }' +
            '.summary { margin-top: 14px; } .summary td { vertical-align: top; }' +
            '.summary-title { color: #686868; font-size: 8pt; font-weight: bold; padding: 4px 0 8px; }' +
            '.details td { padding: 5px 2px; } .label { color: #6b6b6b; width: 28%; }' +
            '.colon { color: #6b6b6b; width: 4%; text-align: center; }' +
            '.net-card { border: 1px solid #cbd2df; border-radius: 8px; }' +
            '.net-card td { padding: 8px 10px; }' +
            '.net-value { background: #edfaf0; border-left: 4px solid #55c96b; color: #111; font-size: 20pt; }' +
            '.net-label { background: #edfaf0; color: #64846b; padding-top: 0 !important; }' +
            '.stats td { border-top: 1px dashed #cbd2df; color: #6b6b6b; padding: 6px 10px; }' +
            '.stats .value { color: #222; text-align: right; }' +
            '.employee-details { margin: 10px 0 14px; } .employee-details td { padding: 4px 5px; vertical-align: top; }' +
            '.pay-grid { border: 1px solid #cbd2df; border-radius: 8px; margin-top: 10px; }' +
            '.pay-grid td { padding: 8px; vertical-align: top; }' +
            '.pay-table th { color: #444; font-size: 8pt; padding: 6px 4px; text-align: left; border-bottom: 1px dashed #aab3be; }' +
            '.pay-table td { border-bottom: 1px solid #f0f0f0; padding: 7px 4px; }' +
            '.pay-table .amount { font-weight: bold; text-align: right; white-space: nowrap; }' +
            '.pay-table .totals-row { background: #f4f5f7; font-weight: bold; }' +
            '.pay-table .totals-row td { border: 0; }' +
            '.payable { border: 1px solid #cbd2df; border-radius: 8px; margin-top: 14px; }' +
            '.payable td { padding: 10px; }' +
            '.payable-amount { background: #edfaf0; font-size: 13pt; font-weight: bold; text-align: right; white-space: nowrap; }' +
            '.amount-words { color: #6b6b6b; margin-top: 14px; text-align: right; }' +
            '.amount-words strong { color: #222; }' +
            '.footer { border-top: 1px solid #cbd2df; color: #777; font-size: 8pt; margin-top: 12px; padding-top: 10px; text-align: center; }' +
            '</style></head><body>' +
            '<table class="header"><tr><td width="68%"><div class="company">' + PAYSLIP_COMPANY_NAME + '</div>' +
            '<div class="muted">' + address + '</div></td><td class="month" width="32%"><span class="muted">Payslip For the Month</span><br/><strong>' +
            escapeHtml(payslipMonth) + '</strong></td></tr></table><div class="rule"></div>' +
            '<table class="summary"><tr><td width="62%"><div class="summary-title">EMPLOYEE SUMMARY</div><table class="details">' +
            '<tr><td class="label">Employee Name</td><td class="colon">:</td><td>' + escapeHtml(payslip.get('employeeName')) + '</td></tr>' +
            '<tr><td class="label">Employee ID</td><td class="colon">:</td><td>' + escapeHtml(payslip.get('employeeId')) + '</td></tr>' +
            '<tr><td class="label">Pay Period</td><td class="colon">:</td><td>' + escapeHtml(payslip.get('payPeriod')) + '</td></tr>' +
            '<tr><td class="label">Pay Date</td><td class="colon">:</td><td>' + escapeHtml(payslip.get('payDate')) + '</td></tr>' +
            '</table></td><td width="38%"><table class="net-card"><tr><td class="net-value">₹' + netFormatted +
            '</td></tr><tr><td class="net-label">Total Net Pay</td></tr><tr class="stats"><td>Paid Days</td><td class="value">' +
            escapeHtml(payslip.get('paidDays')) + '</td></tr><tr class="stats"><td>LOP Days</td><td class="value">' +
            escapeHtml(payslip.get('lopDays')) + '</td></tr></table></td></tr></table>' +
            '<div class="rule" style="margin-top:12px"></div>' +
            '<table class="employee-details"><tr><td width="50%"><table>' +
            '<tr><td class="label">Designation</td><td class="colon">:</td><td>' + escapeHtml(payslip.get('designation')) + '</td></tr>' +
            '<tr><td class="label">PF Number</td><td class="colon">:</td><td>' + escapeHtml(payslip.get('pfNumber')) + '</td></tr>' +
            '<tr><td class="label">PAN</td><td class="colon">:</td><td>' + escapeHtml(payslip.get('pan')) + '</td></tr>' +
            '</table></td><td width="50%"><table>' +
            '<tr><td class="label">Bank A/C Number</td><td class="colon">:</td><td>' + escapeHtml(payslip.get('bankAccountNumber')) + '</td></tr>' +
            '<tr><td class="label">UAN Number</td><td class="colon">:</td><td>' + escapeHtml(payslip.get('uanNumber')) + '</td></tr>' +
            '<tr><td class="label">D.O.J</td><td class="colon">:</td><td>' + escapeHtml(payslip.get('dateOfJoining')) + '</td></tr>' +
            '</table></td></tr></table>' +
            '<table class="pay-grid" border="1" cellpadding="0" cellspacing="0"><tr>' +
            '<td width="50%"><table class="pay-table"><tr><th>EARNINGS</th><th class="amount">AMOUNT</th></tr>' + earningRows +
            '<tr class="totals-row"><td>Gross Earnings</td><td class="amount">₹' + formatAmount(gross) + '</td></tr></table></td>' +
            '<td width="50%" style="border-left:1px solid #cbd2df"><table class="pay-table"><tr><th>DEDUCTIONS</th><th class="amount">AMOUNT</th></tr>' + deductionRows +
            '<tr class="totals-row"><td>Total Deductions</td><td class="amount">₹' + formatAmount(deductionsTotal) + '</td></tr></table></td>' +
            '</tr></table>' +
            '<table class="payable" border="1" cellpadding="0" cellspacing="0"><tr><td><strong>TOTAL NET PAYABLE</strong><br/><span class="muted">Gross Earnings - Total Deductions</span></td>' +
            '<td class="payable-amount">₹' + netFormatted + '</td></tr></table>' +
            '<div class="amount-words">Amount In Words: <strong>' + amountInWords + '</strong></div>' +
            '<div class="footer">-- This is a system-generated document. --</div></body></html>';
    }

    private static List<Object> asLines(Object rawLines) {
        if (rawLines == null) {
            return new List<Object>();
        }
        return (List<Object>) rawLines;
    }

    private static Decimal lineAmount(Map<String, Object> line) {
        Object rawAmount = line == null ? null : line.get('amount');
        if (rawAmount == null || String.isBlank(String.valueOf(rawAmount))) {
            return 0;
        }
        try {
            return Decimal.valueOf(String.valueOf(rawAmount));
        } catch (Exception invalidAmount) {
            throw new AuraHandledException('Enter a valid number for each amount.');
        }
    }

    private static String escapeHtml(Object value) {
        if (value == null) {
            return '';
        }
        return String.valueOf(value)
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;');
    }

    private static String escapeHtmlWithBreaks(Object value) {
        return escapeHtml(value)
            .replace('\r\n', '\n')
            .replace('\r', '\n')
            .replace('\n', '<br/>');
    }

    private static String formatAmount(Decimal amount) {
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

    private static String indianRupeesInWords(Decimal amount) {
        Long totalPaise = (amount.setScale(2) * 100).round();
        Long rupees = totalPaise / 100;
        Long paise = totalPaise - (rupees * 100);
        String words = 'Indian Rupee ' + numberToWords(rupees);
        if (paise > 0) {
            words += ' and ' + numberToWords(paise) + ' Paise';
        }
        return words + ' Only';
    }

    private static String numberToWords(Long value) {
        List<String> smallNumbers = new List<String>{
            'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
        };
        List<String> tens = new List<String>{ '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety' };
        if (value < 20) {
            return smallNumbers[Integer.valueOf(String.valueOf(value))];
        }
        if (value < 100) {
            Long tensValue = value / 10;
            Long remainder = value - (tensValue * 10);
            return tens[Integer.valueOf(String.valueOf(tensValue))] +
                (remainder > 0 ? '-' + smallNumbers[Integer.valueOf(String.valueOf(remainder))] : '');
        }

        Long divisor;
        String unit;
        if (value >= 10000000) {
            divisor = 10000000;
            unit = 'Crore';
        } else if (value >= 100000) {
            divisor = 100000;
            unit = 'Lakh';
        } else if (value >= 1000) {
            divisor = 1000;
            unit = 'Thousand';
        } else {
            divisor = 100;
            unit = 'Hundred';
        }
        Long major = value / divisor;
        Long remainder = value - (major * divisor);
        return numberToWords(major) + ' ' + unit + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
    }

}
