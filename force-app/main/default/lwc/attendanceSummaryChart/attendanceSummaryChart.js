import { LightningElement, api } from 'lwc';

const DONUT_CIRCUMFERENCE = 2 * Math.PI * 45;
const SUMMARY_TYPES = [
    { key: 'wfhCount', label: 'Work from home', statusClass: 'status-wfh' },
    { key: 'wfoCount', label: 'Work from office', statusClass: 'status-wfo' },
    { key: 'leaveCount', label: 'Leave', statusClass: 'status-leave' },
    { key: 'absentCount', label: 'Absent', statusClass: 'status-absent' }
];

export default class AttendanceSummaryChart extends LightningElement {
    @api summary = {};
    @api periodLabel = '';
    @api loading = false;

    activeMetricKey;

    get metrics() {
        const values = SUMMARY_TYPES.map(type => ({
            ...type,
            value: Number(this.summary?.[type.key]) || 0
        }));
        const total = values.reduce((sum, item) => sum + item.value, 0);
        let cumulativeLength = 0;

        return values.map(item => {
            const percentage = total ? (item.value / total) * 100 : 0;
            const segmentLength = DONUT_CIRCUMFERENCE * (percentage / 100);
            const metric = {
                ...item,
                percentageLabel: `${percentage.toFixed(1)}%`,
                isActive: this.activeMetricKey === item.key,
                segmentClass: `donut-segment ${item.statusClass}${this.activeMetricKey === item.key ? ' is-active' : ''}`,
                legendRowClass: `legend-row${this.activeMetricKey === item.key ? ' legend-row-active' : ''}`,
                swatchClass: `legend-swatch ${item.statusClass}`,
                dashArray: `${segmentLength.toFixed(3)} ${DONUT_CIRCUMFERENCE.toFixed(3)}`,
                dashOffset: (-cumulativeLength).toFixed(3),
                accessibleLabel: `${item.label}: ${percentage.toFixed(1)} percent`
            };
            cumulativeLength += segmentLength;
            return metric;
        });
    }

    get activeMetric() {
        return this.metrics.find(item => item.isActive);
    }

    handleMetricHover(event) {
        this.activeMetricKey = event.currentTarget.dataset.key;
    }

    handleMetricLeave(event) {
        if (this.activeMetricKey === event.currentTarget.dataset.key) {
            this.activeMetricKey = undefined;
        }
    }

    get hasRecords() {
        return this.metrics.some(item => item.value > 0);
    }

    get chartAccessibleLabel() {
        const breakdown = this.metrics
            .map(item => `${item.label} ${item.percentageLabel}`)
            .join(', ');
        return `${this.periodLabel} attendance status breakdown: ${breakdown}.`;
    }
}
