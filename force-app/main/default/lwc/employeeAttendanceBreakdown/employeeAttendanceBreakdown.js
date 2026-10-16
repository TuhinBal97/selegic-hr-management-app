import { LightningElement, api } from 'lwc';

const ATTENDANCE_STATUSES = [
    { key: 'wfoCount', label: 'Work from office', statusClass: 'status-wfo' },
    { key: 'monthlyLeaveCount', label: 'Leave this month', statusClass: 'status-leave' },
    { key: 'wfhCount', label: 'Work from home', statusClass: 'status-wfh' },
    { key: 'absentCount', label: 'Absent', statusClass: 'status-absent' }
];

export default class EmployeeAttendanceBreakdown extends LightningElement {
    _employeeRows = [];
    selectedEmployeeId = '';

    @api periodLabel = '';
    @api loading = false;

    @api
    get employeeRows() {
        return this._employeeRows;
    }

    set employeeRows(value) {
        this._employeeRows = Array.isArray(value) ? value : [];
        const selectionIsValid = this._employeeRows.some(
            row => row.employeeId === this.selectedEmployeeId
        );

        if (!selectionIsValid) {
            this.selectedEmployeeId = this._employeeRows[0]?.employeeId || '';
        }
    }

    get employeeOptions() {
        return this.employeeRows.map(row => ({
            label: row.employeeName,
            value: row.employeeId
        }));
    }

    get selectedEmployee() {
        return this.employeeRows.find(row => row.employeeId === this.selectedEmployeeId);
    }

    get daysInMonth() {
        return this.selectedEmployee?.days?.length || 0;
    }

    get statuses() {
        const employee = this.selectedEmployee;
        const totalDays = this.daysInMonth;

        return ATTENDANCE_STATUSES.map(status => {
            const count = Number(employee?.[status.key]) || 0;
            const percentage = totalDays ? (count / totalDays) * 100 : 0;

            return {
                ...status,
                count,
                countLabel: `${count} ${count === 1 ? 'day' : 'days'}`,
                percentageLabel: `${percentage.toFixed(1)}%`,
                valueLabel: `${count} ${count === 1 ? 'day' : 'days'} · ${percentage.toFixed(1)}%`,
                widthStyle: `width: ${percentage.toFixed(3)}%`,
                swatchClass: `status-swatch ${status.statusClass}`,
                barClass: `status-bar ${status.statusClass}`,
                barAccessibleLabel: `${status.label}: ${count} ${count === 1 ? 'day' : 'days'}, ${percentage.toFixed(1)}% of the month`
            };
        }).sort((first, second) => second.count - first.count);
    }

    get calendarDaysLabel() {
        return `${this.daysInMonth} calendar ${this.daysInMonth === 1 ? 'day' : 'days'}`;
    }

    get barAccessibleLabel() {
        const breakdown = this.statuses
            .map(status => status.barAccessibleLabel)
            .join('; ');
        return `${this.selectedEmployee?.employeeName || 'Employee'} attendance for ${this.periodLabel}: ${breakdown}. Bars are ranked from highest to lowest and percentages use all ${this.daysInMonth} calendar days.`;
    }

    get remainderNote() {
        return `Percentages use all ${this.daysInMonth} calendar days. Weekly offs, holidays, and pending days are not included in these status bars.`;
    }

    get isEmployeePickerDisabled() {
        return this.loading || this.employeeOptions.length === 0;
    }

    handleEmployeeChange(event) {
        this.selectedEmployeeId = event.detail.value;
    }
}
