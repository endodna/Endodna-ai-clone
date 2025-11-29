/**
 * Pathogenicity Gauge Algorithm - Worst-Case Implementation (TypeScript)
 *
 * This module implements a worst-case aggregation algorithm for classifying genetic variant
 * pathogenicity based on ACMG/AMP (American College of Medical Genetics and Genomics / Association
 * for Molecular Pathology) guidelines.
 *
 * The algorithm aggregates multiple variant classifications into a single gauge value represented
 * by three color zones:
 * - Green: Low risk (benign / likely benign variants)
 * - Yellow: Moderate / uncertain risk (variants of uncertain significance)
 * - Red: High risk (likely pathogenic / pathogenic variants)
 *
 * The worst-case approach uses the most pathogenic classification in a group to determine the
 * overall risk level, ensuring clinical caution is prioritized.
 */

type GaugeColor = "green" | "yellow" | "red";

export interface GaugeResult {
    color: GaugeColor;
    maxSeverity: number | null;
    normalizedScore: number | null;
    unknownLabels: string[];
}

/**
 * Mapping of ACMG/AMP variant classification categories to severity scores.
 *
 * Severity scores range from 0 (benign) to 4 (pathogenic). These scores are used for worst-case
 * aggregation: the maximum severity determines the gauge color. The mapping aligns with clinical
 * risk levels:
 *  - 0-1: Benign / Likely Benign (low risk) → Green
 *  - 2: Uncertain Significance (moderate risk) → Yellow
 *  - 3-4: Likely Pathogenic / Pathogenic (high risk) → Red
 */
const ACMG_SEVERITY: Record<string, number> = {
    benign: 0,
    "likely benign": 1,
    "uncertain significance": 2,
    vus: 2,
    "likely pathogenic": 3,
    pathogenic: 4,
};

/**
 * Normalizes ACMG labels and aggregates them into a gauge color using a worst-case approach.
 *
 * Algorithm:
 *  1. Maps each recognized ACMG label to a severity score (0-4).
 *  2. Finds the maximum severity score among all variants.
 *  3. Normalizes the score to 0.0-1.0 range (maxSeverity / 4.0).
 *  4. Assigns a color based on maximum severity:
 *     - Green: maxSeverity ≤ 1 (all benign / likely benign)
 *     - Yellow: maxSeverity = 2 (at least one VUS, no LP/P)
 *     - Red: maxSeverity ≥ 3 (at least one likely pathogenic / pathogenic)
 *
 * @param labels List of ACMG variant classification labels.
 * @returns GaugeResult summarizing the aggregated risk.
 */
export function gaugeFromAcmgLabels(labels: Array<string | null | undefined>): GaugeResult {
    if (!labels || labels.length === 0) {
        return {
            color: "green",
            maxSeverity: 0,
            normalizedScore: 0,
            unknownLabels: [],
        };
    }

    const severities: number[] = [];
    const unknownLabels: string[] = [];

    for (const rawLabel of labels) {
        if (rawLabel == null) {
            unknownLabels.push(String(rawLabel));
            continue;
        }

        const normalized = rawLabel.trim().toLowerCase();
        const severity = ACMG_SEVERITY[normalized];

        if (typeof severity === "number") {
            severities.push(severity);
        } else {
            unknownLabels.push(rawLabel);
        }
    }

    if (severities.length === 0) {
        return {
            color: "yellow",
            maxSeverity: null,
            normalizedScore: null,
            unknownLabels,
        };
    }

    const maxSeverity = Math.max(...severities);
    const normalizedScore = maxSeverity / 4;

    let color: GaugeColor;
    if (maxSeverity <= 1) {
        color = "green";
    } else if (maxSeverity === 2) {
        color = "yellow";
    } else {
        color = "red";
    }

    return {
        color,
        maxSeverity,
        normalizedScore,
        unknownLabels,
    };
}

export default gaugeFromAcmgLabels;

