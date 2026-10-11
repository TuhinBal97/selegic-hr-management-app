import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getActiveEmployees from '@salesforce/apex/AttendanceController.getActiveEmployees';
import getMonthlyAttendance from '@salesforce/apex/AttendanceController.getMonthlyAttendance';
import getMonthlyHolidays from '@salesforce/apex/AttendanceController.getMonthlyHolidays';
import saveAttendance from '@salesforce/apex/AttendanceController.saveAttendance';

export default class AttendanceMonthlyView extends LightningElement {
    selectedMonth = String(new Date().getMonth() + 1);
    selectedYear = String(new Date().getFullYear());

    employees = [];
    attendanceRecords = [];
    holidayRecords = [];
    days = [];
    employeeRows = [];
    isSaving = false;
    isLoading = false;
    loadRequestId = 0;
    stickyUpdateFrame = null;
    stickyScrollTargets = [];
    stickyScrollListenersAttached = false;

    // None means the status is pending. Legacy LOP records are counted as Absent.
    statusOptions = [
        { label: 'Pending', value: 'None' },
        { label: 'Office', value: 'WFO' },
        { label: 'Home', value: 'WFH' },
        { label: 'Absent', value: 'Absent' },
        { label: 'Weekly Off', value: 'Weekly_Off' },
        { label: 'Leave', value: 'Leave' },
        { label: 'Holiday', value: 'Holiday' }
    ];

    monthOptions = [
        { label: 'January', value: '1' },
        { label: 'February', value: '2' },
        { label: 'March', value: '3' },
        { label: 'April', value: '4' },
        { label: 'May', value: '5' },
        { label: 'June', value: '6' },
        { label: 'July', value: '7' },
        { label: 'August', value: '8' },
        { label: 'September', value: '9' },
        { label: 'October', value: '10' },
        { label: 'November', value: '11' },
        { label: 'December', value: '12' }
    ];

    yearOptions = this.generateYearOptions();

    connectedCallback() {
        document.addEventListener('scroll', this.handleViewportScroll, true);
        window.addEventListener('scroll', this.handleViewportScroll, true);
        window.addEventListener('resize', this.handleViewportScroll);
        this.generateDays();
        this.loadMonthlyData();
    }

    renderedCallback() {
        this.attachStickyScrollListeners();
        this.updateStickyArea();
    }

    disconnectedCallback() {
        document.removeEventListener('scroll', this.handleViewportScroll, true);
        window.removeEventListener('scroll', this.handleViewportScroll, true);
        window.removeEventListener('resize', this.handleViewportScroll);
        this.stickyScrollTargets.forEach((target) => {
            target.removeEventListener('scroll', this.handleViewportScroll, true);
        });
        this.stickyScrollTargets = [];
        this.stickyScrollListenersAttached = false;
        if (this.stickyUpdateFrame !== null) {
            cancelAnimationFrame(this.stickyUpdateFrame);
            this.stickyUpdateFrame = null;
        }
    }

    attachStickyScrollListeners() {
        if (this.stickyScrollListenersAttached) {
            return;
        }

        this.stickyScrollListenersAttached = true;
        let currentElement = this.template.host;
        while (currentElement) {
            this.stickyScrollTargets.push(currentElement);
            if (currentElement.parentElement) {
                currentElement = currentElement.parentElement;
            } else {
                const root = currentElement.getRootNode();
                currentElement = root && root.host ? root.host : null;
            }
        }

        this.stickyScrollTargets.forEach((target) => {
            target.addEventListener('scroll', this.handleViewportScroll, true);
        });
    }

    handleViewportScroll = () => {
        if (this.stickyUpdateFrame !== null) {
            return;
        }

        this.stickyUpdateFrame = requestAnimationFrame(() => {
            this.stickyUpdateFrame = null;
            this.updateStickyArea();
        });
    };

    updateStickyArea() {
        const viewShell = this.template.querySelector('.attendance-view-shell');
        const fixedArea = this.template.querySelector('.attendance-fixed-area');
        const fixedAreaSpacer = this.template.querySelector('.attendance-fixed-area-spacer');

        if (!viewShell || !fixedArea || !fixedAreaSpacer) {
            return;
        }

        const fixedAreaHeight = fixedArea.offsetHeight;
        if (!fixedAreaHeight) {
            return;
        }

        // Preserve the space used by the title, filters, legend, and date header.
        fixedAreaSpacer.style.height = `${fixedAreaHeight}px`;

        const viewBounds = viewShell.getBoundingClientRect();
        const shouldFixArea = viewBounds.top < 0 && viewBounds.bottom > fixedAreaHeight;
        fixedArea.classList.toggle('is-fixed', shouldFixArea);

        if (shouldFixArea) {
            fixedArea.style.left = `${viewBounds.left}px`;
            fixedArea.style.width = `${viewBounds.width}px`;
        } else {
            fixedArea.style.left = '';
            fixedArea.style.width = '';
        }
    }

    handleGridScroll(event) {
        const stickyHeaderScroller = this.template.querySelector('.attendance-sticky-header-scroll');
        if (stickyHeaderScroller) {
            stickyHeaderScroller.scrollLeft = event.target.scrollLeft;
        }
        this.updateStickyArea();
    }

    generateYearOptions() {
        const currentYear = new Date().getFullYear();
        const years = [];

        for (let year = 2025; year <= currentYear + 20; year += 1) {
            years.push({ label: String(year), value: String(year) });
        }

        return years;
    }

    handleMonthChange(event) {
        this.selectedMonth = event.detail.value;
        this.generateDays();
        this.loadMonthlyData();
    }

    handleYearChange(event) {
        this.selectedYear = event.detail.value;
        this.generateDays();
        this.loadMonthlyData();
    }

    // Build date strings ourselves so they remain YYYY-MM-DD in every browser timezone.
    generateDays() {
        const year = Number(this.selectedYear);
        const month = Number(this.selectedMonth);
        const numberOfDays = new Date(year, month, 0).getDate();
        const days = [];

        for (let dayNumber = 1; dayNumber <= numberOfDays; dayNumber += 1) {
            const dateObject = new Date(year, month - 1, dayNumber);
            const dayName = dateObject.toLocaleDateString('en-US', { weekday: 'short' });

            days.push({
                dayNumber,
                dayName,
                date: String(year) + '-' + String(month).padStart(2, '0') + '-' +
                    String(dayNumber).padStart(2, '0'),
                isWeekend: dayName === 'Sat' || dayName === 'Sun'
            });
        }

        this.days = days;
    }

    loadMonthlyData() {
        const requestId = ++this.loadRequestId;
        this.isLoading = true;
        Promise.all([
            getActiveEmployees(),
            getMonthlyAttendance({
                month: Number(this.selectedMonth),
                year: Number(this.selectedYear)
            }),
            getMonthlyHolidays({
                month: Number(this.selectedMonth),
                year: Number(this.selectedYear)
            })
        ])
            .then(([employees, attendanceRecords, holidayRecords]) => {
                // A slower response for the previous month must not replace the current month.
                if (requestId !== this.loadRequestId) {
                    return;
                }
                this.employees = employees;
                this.attendanceRecords = attendanceRecords;
                this.holidayRecords = holidayRecords;
                this.buildEmployeeRows();
            })
            .catch(error => {
                if (requestId !== this.loadRequestId) {
                    return;
                }
                this.showToast('Could not load attendance', this.getErrorMessage(error), 'error');
            })
            .finally(() => {
                if (requestId === this.loadRequestId) {
                    this.isLoading = false;
                }
            });
    }

    // Monthly totals are derived from this month's dates and records; they are not saved on Employee__c.
    buildEmployeeRows() {
        const holidaysByDate = new Map(
            this.holidayRecords.map(holiday => [holiday.Holiday_Date__c, holiday])
        );
        const attendanceByEmployeeAndDate = new Map(
            this.attendanceRecords.map(record => [
                record.Employee__c + ':' + record.Attendance_Date__c,
                record
            ])
        );
        this.employeeRows = this.employees.map(employee => {
            const counts = {
                wfhCount: 0,
                wfoCount: 0,
                absentCount: 0,
                leaveCount: 0
            };

            const employeeDays = this.days.map(day => {
                const holiday = holidaysByDate.get(day.date);
                const attendance = attendanceByEmployeeAndDate.get(
                    employee.Id + ':' + day.date
                );
                const isHoliday = Boolean(holiday);
                const isWeekend = day.isWeekend;
                const attendanceStatus = attendance?.Status__c ||
                    (isHoliday ? 'Holiday' : (isWeekend ? 'Weekly_Off' : ''));
                const displayedStatus = attendanceStatus === 'LOP' ? 'Absent' : attendanceStatus;
                const selectedOption = this.statusOptions.find(
                    option => option.value === displayedStatus
                );
                const statusClass = this.getStatusClass(displayedStatus, isHoliday, isWeekend);

                if (attendanceStatus === 'WFH') {
                    counts.wfhCount += 1;
                } else if (attendanceStatus === 'WFO') {
                    counts.wfoCount += 1;
                } else {
                    // None and blank mean pending. Only an explicit Absent choice increments this count.
                    switch (attendanceStatus) {
                        case 'Absent':
                        case 'LOP': // Legacy LOP records are counted as Absent.
                            counts.absentCount += 1;
                            break;
                        case 'Leave':
                            counts.leaveCount += 1;
                            break;
                        default:
                            break;
                    }
                }

                const status = attendanceStatus;
                const tooltip = isHoliday
                    ? holiday.Name
                    : (isWeekend
                        ? 'Weekly Off. Select a status if the employee worked.'
                        : employee.Name + ' — ' + day.date);

                return {
                    date: day.date,
                    dayNumber: day.dayNumber,
                    dayName: day.dayName,
                    status,
                    isHoliday,
                    isWeekend,
                    holidayName: holiday ? holiday.Name : '',
                    attendanceStatus,
                    statusLabel: selectedOption ? selectedOption.label : 'Select status',
                    statusOptions: this.statusOptions.map(option => ({
                        ...option,
                        checked: option.value === displayedStatus
                    })),
                    statusControlClass: 'status-control ' + statusClass,
                    tooltip,
                    accessibleLabel: employee.Name + ' — ' + day.date
                };
            });

            return {
                employeeId: employee.Id,
                employeeName: employee.Name,
                days: employeeDays,
                ...counts
            };
        });
    }

    getStatusClass(status, isHoliday, isWeekend) {
        switch (status) {
            case 'WFH':
                return 'status-wfh';
            case 'WFO':
                return 'status-wfo';
            case 'Absent':
            case 'LOP':
                return 'status-absent';
            case 'Leave':
                return 'status-leave';
            case 'None':
                return 'status-none';
            case 'Weekly_Off':
                return 'status-wo';
            case 'Holiday':
                return 'status-holiday';
            default:
                if (isHoliday) {
                    return 'status-holiday';
                }
                return isWeekend ? 'status-wo' : 'status-empty';
        }
    }

    handleCellStatusChange(event) {
        const employeeId = event.currentTarget.dataset.employeeId;
        const date = event.currentTarget.dataset.date;
        const status = event.detail.value;
        const previousRecords = this.attendanceRecords;
        const optimisticRecord = {
            ...(this.attendanceRecords.find(record =>
                record.Employee__c === employeeId && record.Attendance_Date__c === date
            ) || {}),
            Employee__c: employeeId,
            Attendance_Date__c: date,
            Status__c: status
        };

        this.isSaving = true;
        this.replaceAttendanceRecord(optimisticRecord);
        this.buildEmployeeRows();

        saveAttendance({
            employeeId,
            attendanceDate: date,
            status,
            remarks: ''
        })
            .then(savedRecord => {
                this.replaceAttendanceRecord(savedRecord);
                this.buildEmployeeRows();
                this.showToast('Saved', 'Attendance was saved.', 'success');
            })
            .catch(error => {
                this.attendanceRecords = previousRecords;
                this.buildEmployeeRows();
                this.showToast('Could not save attendance', this.getErrorMessage(error), 'error');
            })
            .finally(() => {
                this.isSaving = false;
            });
    }

    replaceAttendanceRecord(recordToSave) {
        const remainingRecords = this.attendanceRecords.filter(record =>
            !(record.Employee__c === recordToSave.Employee__c &&
                record.Attendance_Date__c === recordToSave.Attendance_Date__c)
        );
        this.attendanceRecords = [...remainingRecords, recordToSave];
    }

    getErrorMessage(error) {
        return error?.body?.message || error?.message || 'An unexpected error occurred.';
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
