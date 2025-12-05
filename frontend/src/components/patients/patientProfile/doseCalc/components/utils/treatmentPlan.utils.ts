/**
 * Utility functions for extracting treatment plan data from dosing history
 */

interface CalculationBreakdownItem {
    step: string;
    condition: string;
    alerts?: string[];
    warnings?: string[];
    criticalAlerts?: string[];
    cautions?: string[];
}

interface ModifierCategory {
    category: string;
    items: string[];
}

interface AlertItem {
    condition: string;
    alerts: string[];
}

// Map step values to modifier categories
const STEP_TO_CATEGORY: Record<string, string> = {
    bmi_aromatization_modifier: "Aromatization",
    shbg_modifier: "Labs",
    estradiol_monitoring_management_modifier: "Labs",
    medication_modifier: "Medication",
    genetic_modifier: "Genetic",
    // Add more mappings as backend adds new steps
};

/**
 * Gets tier data from dosing history based on selected dose
 */
function getTierData(
    historyData: PatientDosageHistoryEntry[],
    selectedDose: { hormoneType: string; tier: string } | null
): {
    dosingCalculation: {
        calculationBreakdown?: CalculationBreakdownItem[];
        geneticMultiplier?: number;
    };
} | null {
    if (!selectedDose || !historyData || historyData.length === 0) {
        return null;
    }

    // Get the most recent entry
    const mostRecentEntry = historyData[0];
    const { data: entryData } = mostRecentEntry;

    // Determine which hormone data to access
    let hormoneData: { dosingSuggestions?: Record<string, unknown> } | undefined;

    if (selectedDose.hormoneType === "testosterone") {
        // Check T100 first, then T200
        hormoneData = entryData.T100 || entryData.T200;
    } else if (selectedDose.hormoneType === "estradiol") {
        hormoneData = entryData.ESTRADIOL;
    }

    if (!hormoneData?.dosingSuggestions) {
        return null;
    }

    // Access the tier data
    const tierData = hormoneData.dosingSuggestions[selectedDose.tier] as
        | {
            dosingCalculation: {
                calculationBreakdown?: CalculationBreakdownItem[];
                geneticMultiplier?: number;
            };
        }
        | undefined;

    return tierData?.dosingCalculation ? tierData : null;
}

/**
 * Extracts calculation breakdown from dosing history based on selected dose
 */
function getCalculationBreakdown(
    historyData: PatientDosageHistoryEntry[],
    selectedDose: { hormoneType: string; tier: string } | null
): CalculationBreakdownItem[] | null {
    const tierData = getTierData(historyData, selectedDose);
    return tierData?.dosingCalculation?.calculationBreakdown || null;
}

/**
 * Extracts modifiers from calculation breakdown
 * Only returns modifiers when geneticMultiplier is 1
 */
export function extractModifiers(
    historyData: PatientDosageHistoryEntry[] | null,
    selectedDose: { hormoneType: string; tier: string } | null
): ModifierCategory[] {
    if (!historyData || !Array.isArray(historyData)) {
        return [];
    }

    const tierData = getTierData(historyData, selectedDose);
    if (!tierData) {
        return [];
    }

    // Check if geneticMultiplier is 1 - only show modifiers when it's 1
    const geneticMultiplier = tierData.dosingCalculation.geneticMultiplier;
    if (geneticMultiplier !== 1) {
        return [];
    }

    const breakdownItems = tierData.dosingCalculation.calculationBreakdown;
    if (!breakdownItems) {
        return [];
    }

    // Extract modifiers (all steps except base_dose and final_dose)
    const modifierMap = new Map<string, string[]>();

    breakdownItems.forEach((item) => {
        const step = item.step?.toLowerCase();
        // Skip base_dose and final_dose as they're not modifiers
        if (step && step !== "base_dose" && step !== "final_dose" && item.condition) {
            const category = STEP_TO_CATEGORY[step] || "Other";
            if (!modifierMap.has(category)) {
                modifierMap.set(category, []);
            }
            modifierMap.get(category)?.push(item.condition);
        }
    });

    // Convert map to array format
    return Array.from(modifierMap.entries()).map(([category, items]) => ({
        category,
        items,
    }));
}

/**
 * Extracts alerts from calculation breakdown
 */
export function extractAlerts(
    historyData: PatientDosageHistoryEntry[] | null,
    selectedDose: { hormoneType: string; tier: string } | null
): AlertItem[] {
    if (!historyData || !Array.isArray(historyData)) {
        return [];
    }

    const breakdownItems = getCalculationBreakdown(historyData, selectedDose);
    if (!breakdownItems) {
        return [];
    }

    // Filter for items that have alerts
    const itemsWithAlerts = breakdownItems.filter(
        (item) => item.alerts && Array.isArray(item.alerts) && item.alerts.length > 0
    );

    // Map to the format we need: { condition, alerts }
    return itemsWithAlerts.map((item) => ({
        condition: item.condition,
        alerts: item.alerts || [],
    }));
}

