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
                segmentClass: `donut-segment ${item.statusClass}`,
                swatchClass: `legend-swatch ${item.statusClass}`,
                dashArray: `${segmentLength.toFixed(3)} ${DONUT_CIRCUMFERENCE.toFixed(3)}`,
                dashOffset: (-cumulativeLength).toFixed(3),
                accessibleLabel: `${item.label}: ${percentage.toFixed(1)} percent`
            };
            cumulativeLength += segmentLength;
            return metric;
        });
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
