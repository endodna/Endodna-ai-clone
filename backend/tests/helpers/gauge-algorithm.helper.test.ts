import { describe, it, expect } from "@jest/globals";
import { gaugeFromAcmgLabels } from "../../src/helpers/gauge-algorithm.helper";

describe("gaugeFromAcmgLabels", () => {
    it("returns green for all benign variants", () => {
        const result = gaugeFromAcmgLabels(["benign", "likely benign"]);
        expect(result.color).toBe("green");
        expect(result.maxSeverity).toBe(1);
        expect(result.normalizedScore).toBeCloseTo(0.25);
        expect(result.unknownLabels).toHaveLength(0);
    });

    it("returns yellow when any VUS label is present", () => {
        const result = gaugeFromAcmgLabels(["benign", "uncertain significance"]);
        expect(result.color).toBe("yellow");
        expect(result.maxSeverity).toBe(2);
        expect(result.normalizedScore).toBeCloseTo(0.5);
    });

    it("returns red when a likely impactful variant is present", () => {
        const result = gaugeFromAcmgLabels(["benign", "likely impactful"]);
        expect(result.color).toBe("red");
        expect(result.maxSeverity).toBe(3);
        expect(result.normalizedScore).toBeCloseTo(0.75);
    });

    it("returns red when an impactful variant is present", () => {
        const result = gaugeFromAcmgLabels(["benign", "benign", "impactful"]);
        expect(result.color).toBe("red");
        expect(result.maxSeverity).toBe(4);
        expect(result.normalizedScore).toBeCloseTo(1);
    });

    it("defaults to green when no labels are provided", () => {
        const result = gaugeFromAcmgLabels([]);
        expect(result.color).toBe("green");
        expect(result.maxSeverity).toBe(0);
        expect(result.normalizedScore).toBe(0);
    });

    it("tracks unknown labels separately", () => {
        const result = gaugeFromAcmgLabels(["benign", "unknown_label", "vus"]);
        expect(result.color).toBe("yellow");
        expect(result.maxSeverity).toBe(2);
        expect(result.normalizedScore).toBeCloseTo(0.5);
        expect(result.unknownLabels).toEqual(["unknown_label"]);
    });

    it("returns yellow when all labels are unknown", () => {
        const result = gaugeFromAcmgLabels(["mystery", "alien"]);
        expect(result.color).toBe("yellow");
        expect(result.maxSeverity).toBeNull();
        expect(result.normalizedScore).toBeNull();
        expect(result.unknownLabels).toEqual(["mystery", "alien"]);
    });
});

