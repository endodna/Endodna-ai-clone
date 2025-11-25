export interface PrefilledDataField {
    id: string;
    label: string;
    dataType: string;
    options?: string[];
    example?: string;
    unit?: string;
    type: "single" | "multiple";
}

export const prefilledDataFields: PrefilledDataField[] = [
    {
        id: "weight",
        label: "Weight",
        dataType: "number",
        example: "200",
        unit: "lbs",
        type: "single",
    },
    {
        id: "height",
        label: "Height",
        dataType: "number",
        example: "180",
        unit: "cm",
        type: "single",
    },
    {
        id: "age",
        label: "Patient Age",
        dataType: "number",
        example: "22",
        unit: "years",
        type: "single",
    },
    {
        id: "bloodType",
        label: "Blood Type",
        dataType: "string",
        example: "A+",
        type: "single",
    },
    {
        id: "bmi",
        label: "BMI",
        dataType: "number",
        example: "25.68",
        type: "single",
    },
    {
        id: "currentActivityLevel",
        label: "Current Activity Level",
        dataType: "string",
        options: ["Low", "Average", "High"],
        example: "Average",
        type: "single",
    },
    {
        id: "desiredActivityLevel",
        label: "Desired Activity Level",
        dataType: "string",
        options: ["Low", "Average", "High"],
        example: "Select",
        type: "single",
    },
    {
        id: "menstrualCycle",
        label: "Menstrual Cycle",
        dataType: "string",
        options: ["Select", "Regular", "Irregular"],
        example: "Select",
        type: "single",
    },
    {
        id: "psa",
        label: "PSA",
        dataType: "number",
        example: "3333",
        type: "single",
    },
    {
        id: "totalTestosterone",
        label: "Total Testosterone",
        dataType: "number",
        example: "333",
        type: "single",
    },
    {
        id: "vitaminD",
        label: "Vitamin D",
        dataType: "number",
        example: "12",
        type: "single",
    },
    {
        id: "takingAddMeds",
        label: "Currently taking ADD meds",
        dataType: "string",
        options: ["YES", "NO"],
        example: "YES",
        type: "single",
    },
    {
        id: "chronicPainPatient",
        label: "Chronic Pain Patient",
        dataType: "string",
        options: ["YES", "NO"],
        example: "NO",
        type: "single",
    },
    {
        id: "prostateCancerHistory",
        label: "Personal Prostate Cancer History",
        dataType: "string",
        options: ["YES", "NO"],
        example: "NO",
        type: "single",
    },
    {
        id: "breastCancerHistory",
        label: "Personal Breast Cancer History",
        dataType: "string",
        options: ["YES", "NO"],
        example: "NO",
        type: "single",
    },
    {
        id: "ovarianCancerHistory",
        label: "Personal Ovarian Cancer History",
        dataType: "string",
        options: ["YES", "NO"],
        example: "NO",
        type: "single",
    },
    {
        id: "uterineCancerHistory",
        label: "Personal Uterine Cancer History",
        dataType: "string",
        options: ["YES", "NO"],
        example: "NO",
        type: "single",
    },
    {
        id: "osteopeniaOsteoporosisHistory",
        label: "Personal History of Osteopenia/Osteoporosis",
        dataType: "string",
        options: ["YES", "NO"],
        example: "NO",
        type: "single",
    },
];