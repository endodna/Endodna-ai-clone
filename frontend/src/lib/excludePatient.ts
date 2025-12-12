export const isPatientExcluded = (patientId: string, chartType: "testosterone" | "estradiol") => {
    // Christina Anderson = 75654e3a-b761-4780-a291-ac3faa35da12
    // Paul Molina = d6d8a944-4b33-43f7-bf71-c8d272e32391
    return (
        [
            "75654e3a-b761-4780-a291-ac3faa35da12",
            "d6d8a944-4b33-43f7-bf71-c8d272e32391",
        ].includes(patientId) && chartType === "estradiol"
    );
};