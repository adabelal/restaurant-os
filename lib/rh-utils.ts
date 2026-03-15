/**
 * Utilities for RH calculations, including historical hourly rates.
 */

interface RateEntry {
    rate: number
    startDate: string // ISO date string (YYYY-MM-DD)
}

/**
 * Determines the applicable hourly rate for a specific month and year based on rate history.
 * 
 * @param historyJson - JSON string containing an array of RateEntry { rate: number, startDate: string }
 * @param fallbackRate - The default hourly rate if no applicable historical rate is found
 * @param targetMonth - The month (0-11)
 * @param targetYear - The year (e.g., 2024)
 * @returns The applicable hourly rate as a number
 */
export function getApplicableRate(
    historyJson: string | null | undefined,
    fallbackRate: number,
    targetMonth: number,
    targetYear: number
): number {
    if (!historyJson) return fallbackRate

    try {
        const history: RateEntry[] = JSON.parse(historyJson)
        if (!Array.isArray(history) || history.length === 0) return fallbackRate

        // Target date is the first day of the target month
        const targetDate = new Date(targetYear, targetMonth, 1)

        // Sort history by date descending
        const sortedHistory = [...history].sort(
            (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        )

        // Find the most recent rate that started on or before the target date
        const applicableEntry = sortedHistory.find(entry => {
            const entryDate = new Date(entry.startDate)
            // Normalize entry date to start of month for comparison if needed, 
            // but the user's specific request uses full months.
            return entryDate <= targetDate ||
                (entryDate.getFullYear() === targetYear && entryDate.getMonth() === targetMonth)
        })

        return applicableEntry ? applicableEntry.rate : fallbackRate
    } catch (e) {
        console.error("Error parsing rate history:", e)
        return fallbackRate
    }
}

/**
 * Standard SMIC historical rates as requested.
 */
export const SMIC_HISTORY = [
    { rate: 11.52, startDate: '2023-06-01', label: 'SMIC Juin 2023' },
    { rate: 11.65, startDate: '2024-01-01', label: 'SMIC Janvier 2024' },
    { rate: 11.88, startDate: '2025-01-01', label: 'SMIC Janvier 2025' },
    { rate: 12.02, startDate: '2025-11-01', label: 'SMIC Actuel' }, // Ajusté selon la demande
]

/**
 * Formats decimal hours into a human-readable string (e.g., 3.5 -> 3h30)
 */
export function formatDecimalHours(decimalHours: number): string {
    const isNegative = decimalHours < 0;
    const absHours = Math.abs(decimalHours);
    const h = Math.floor(absHours);
    const m = Math.round((absHours - h) * 60);
    return `${isNegative ? '-' : ''}${h}h${m.toString().padStart(2, '0')}`;
}
