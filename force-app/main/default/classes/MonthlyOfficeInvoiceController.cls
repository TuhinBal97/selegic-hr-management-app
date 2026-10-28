public with sharing class MonthlyOfficeInvoiceController {
    private static final Integer MAX_LINE_ITEMS_LENGTH = 131072;

    @AuraEnabled
    public static List<Monthly_Office_Invoice__c> getInvoiceHistory() {
        return [
            SELECT Id, Invoice_Number__c, Invoice_Date__c, Due_Date__c, Invoice_Total__c, LastModifiedDate
            FROM Monthly_Office_Invoice__c
            WITH USER_MODE
            ORDER BY Invoice_Date__c DESC, LastModifiedDate DESC
            LIMIT 200
        ];
    }

    @AuraEnabled
    public static Monthly_Office_Invoice__c getInvoice(Id invoiceId) {
        if (invoiceId == null) {
            throw new AuraHandledException('Select an invoice first.');
        }

        List<Monthly_Office_Invoice__c> records = [
            SELECT Id, Invoice_Number__c, Invoice_Date__c, Due_Date__c, Terms__c,
                Bill_To_Name__c, Bill_To_Address__c, Ship_To_Address__c, Notes__c,
                Line_Items_JSON__c, Invoice_Total__c
            FROM Monthly_Office_Invoice__c
            WHERE Id = :invoiceId
            WITH USER_MODE
            LIMIT 1
        ];
        if (records.isEmpty()) {
            throw new AuraHandledException('This invoice is no longer available.');
        }

        return records[0];
    }

    @AuraEnabled
    public static Id saveInvoice(String invoiceJson, Id invoiceId) {
        Map<String, Object> payload = parseAndValidateInvoice(invoiceJson);
        Monthly_Office_Invoice__c invoice = new Monthly_Office_Invoice__c(
            Invoice_Number__c = requiredText(payload, 'invoiceNumber', 'invoice number', 80),
            Invoice_Date__c = requiredDate(payload, 'invoiceDate', 'invoice date'),
            Due_Date__c = requiredDate(payload, 'dueDate', 'due date'),
            Terms__c = requiredText(payload, 'terms', 'terms', 255),
            Bill_To_Name__c = requiredText(payload, 'billToName', 'Bill To name', 255),
            Bill_To_Address__c = optionalText(payload, 'billToAddress', 32768),
            Ship_To_Address__c = optionalText(payload, 'shipToAddress', 32768),
            Notes__c = optionalText(payload, 'notes', 32768),
            Line_Items_JSON__c = serializeLines(payload.get('lines')),
            Invoice_Total__c = calculateTotal(payload.get('lines'))
        );

        Database.SaveResult result;
        if (invoiceId == null) {
            result = Database.insert(invoice, AccessLevel.USER_MODE);
        } else {
            invoice.Id = invoiceId;
            result = Database.update(invoice, AccessLevel.USER_MODE);
        }
        if (!result.isSuccess()) {
            throw new AuraHandledException(result.getErrors()[0].getMessage());
        }
        return result.getId();
    }

    @AuraEnabled
    public static void deleteInvoice(Id invoiceId) {
        if (invoiceId == null) {
            throw new AuraHandledException('Select an invoice first.');
        }
        List<Monthly_Office_Invoice__c> records = [
            SELECT Id
            FROM Monthly_Office_Invoice__c
            WHERE Id = :invoiceId
            WITH USER_MODE
            LIMIT 1
        ];
        if (records.isEmpty()) {
            throw new AuraHandledException('This invoice is no longer available.');
        }

        Database.DeleteResult result = Database.delete(records[0], AccessLevel.USER_MODE);
        if (!result.isSuccess()) {
            throw new AuraHandledException(result.getErrors()[0].getMessage());
        }
    }

    private static Map<String, Object> parseAndValidateInvoice(String invoiceJson) {
        if (String.isBlank(invoiceJson) || invoiceJson.length() > 180000) {
            throw new AuraHandledException('Review the invoice details and try again.');
        }
        try {
            Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(invoiceJson);
            List<Object> lines = getLines(payload.get('lines'));
            if (calculateTotal(lines) <= 0) {
                throw new AuraHandledException('Enter at least one expense amount greater than zero.');
            }
            serializeLines(lines);
            requiredText(payload, 'invoiceNumber', 'invoice number', 80);
            requiredDate(payload, 'invoiceDate', 'invoice date');
            requiredDate(payload, 'dueDate', 'due date');
            requiredText(payload, 'terms', 'terms', 255);
            requiredText(payload, 'billToName', 'Bill To name', 255);
            optionalText(payload, 'billToAddress', 32768);
            optionalText(payload, 'shipToAddress', 32768);
            optionalText(payload, 'notes', 32768);
            return payload;
        } catch (AuraHandledException handledError) {
            throw handledError;
        } catch (Exception invalidPayload) {
            throw new AuraHandledException('The invoice could not be saved. Review the fields and line items.');
        }
    }

    private static List<Object> getLines(Object rawLines) {
        if (rawLines == null) {
            return new List<Object>();
        }
        try {
            return (List<Object>) rawLines;
        } catch (Exception invalidLines) {
            throw new AuraHandledException('Review the invoice line items.');
        }
    }

    private static Decimal calculateTotal(Object rawLines) {
        Decimal total = 0;
        for (Object rawLine : getLines(rawLines)) {
            Map<String, Object> line;
            try {
                line = (Map<String, Object>) rawLine;
            } catch (Exception invalidLine) {
                throw new AuraHandledException('Review the invoice line items.');
            }
            if (line == null) {
                continue;
            }

            Decimal amount = 0;
            Object rawAmount = line.get('amount');
            if (rawAmount != null && !String.isBlank(String.valueOf(rawAmount))) {
                amount = Decimal.valueOf(String.valueOf(rawAmount));
            }
            if (amount < 0) {
                throw new AuraHandledException('Invoice amounts cannot be negative.');
            }
            if (amount > 0 && String.isBlank(stringValue(line.get('description')))) {
                throw new AuraHandledException('Add a description to each line with an amount.');
            }
            total += amount;
        }
        return total.setScale(2);
    }

    private static String serializeLines(Object rawLines) {
        String linesJson = JSON.serialize(getLines(rawLines));
        if (linesJson.length() > MAX_LINE_ITEMS_LENGTH) {
            throw new AuraHandledException('The invoice has too many line items to save.');
        }
        return linesJson;
    }

    private static String requiredText(Map<String, Object> payload, String key, String label, Integer maxLength) {
        String value = stringValue(payload.get(key)).trim();
        if (String.isBlank(value)) {
            throw new AuraHandledException('Enter the ' + label + '.');
        }
        if (value.length() > maxLength) {
            throw new AuraHandledException(label + ' is too long.');
        }
        return value;
    }

    private static String optionalText(Map<String, Object> payload, String key, Integer maxLength) {
        String value = stringValue(payload.get(key));
        if (value.length() > maxLength) {
            throw new AuraHandledException('One of the invoice text fields is too long.');
        }
        return value;
    }

    private static Date requiredDate(Map<String, Object> payload, String key, String label) {
        String value = stringValue(payload.get(key));
        if (String.isBlank(value)) {
            throw new AuraHandledException('Enter the ' + label + '.');
        }
        try {
            return Date.valueOf(value);
        } catch (Exception invalidDate) {
            throw new AuraHandledException('Enter a valid ' + label + '.');
        }
    }

    private static String stringValue(Object value) {
        return value == null ? '' : String.valueOf(value);
    }

}
