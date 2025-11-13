import { PatientRow } from "@/types/patient";

/**
 * Mock patient data matching backend API response structure exactly.
 * This will be replaced with API data.
 */
export const mockPatients: PatientRow[] = [
  {
    id: "1",
    firstName: "Alexander",
    lastName: "Maximillian Thompson",
    status: "ACTIVE",
    dateOfBirth: "1985-10-27",
    patientDNAResults: [
      {
        id: "dna-1",
        status: "GENOTYPING_ACCEPTED",
        updatedAt: "2025-11-13T10:00:00Z",
      },
    ],
    patientGoals: [
      {
        id: "goal-1",
        description: "Set a health goal to improve your overall wellness and maintain a balanced lifestyle through regular exercise and proper nutrition",
      },
    ],
    patientActivities: [
      {
        id: 1,
        activity: "DNA extraction completed successfully",
        status: "ACHIEVED",
        createdAt: "2025-11-13T10:00:00Z",
      },
    ],
    managingDoctor: {
      id: "doc-1",
      firstName: "Kaufmann",
      lastName: "",
      email: "kaufmann@example.com",
    },
  },
  {
    id: "2",
    firstName: "Maximilian",
    lastName: "Harrington Alexander",
    status: "INVITED",
    dateOfBirth: "1992-12-03",
    patientDNAResults: [
      {
        id: "dna-2",
        status: "DNA_EXTRACTION_ACCEPTED",
        updatedAt: "2025-11-13T10:00:00Z",
      },
      {
        id: "dna-2",
        status: "DNA_EXTRACTION_ACCEPTED",
        updatedAt: "2025-11-12T10:00:00Z",
      },
    ],  
    patientActivities: [
      {
        id: 2,
        activity: "DNA extraction completed successfully",
        status: "PENDING",
        createdAt: "2025-11-12T10:00:00Z",
      },
    ],
    patientGoals: [
      {
        id: "goal-2",
        description: "Prioritize adding more fruits and vegetables to daily meals while reducing processed food intake",
      },
    ],
    managingDoctor: {
      id: "doc-2",
      firstName: "David",
      lastName: "Lee",
      email: "david.lee@example.com",
    },
  },
  {
    id: "3",
    firstName: "Sebastian",
    lastName: "Montgomery Harrington III",
    status: "ACTIVE",
    dateOfBirth: "1992-12-03",
    patientDNAResults: [
      {
        id: "dna-3",
        status: "READY",
      },
    ],
    patientGoals: [
      {
        id: "goal-3",
        description: "Establish a wellness goal by committing to at least 30 minutes of physical activity five days per week",
      },
    ],
    managingDoctor: {
      id: "doc-3",
      firstName: "Michael",
      lastName: "Thompson",
      email: "michael.thompson@example.com",
    },
  },
  {
    id: "4",
    firstName: "Alexander",
    lastName: "Maximilian Thompson",
    status: "ACTIVE",
    dateOfBirth: "1985-10-27",
    patientDNAResults: [
      {
        id: "dna-4",
        status: "GENOTYPING_ACCEPTED",
      },
    ],
    patientGoals: [
      {
        id: "goal-4",
        description: "Set a health goal to improve your overall wellness and maintain a balanced lifestyle",
      },
    ],
    managingDoctor: {
      id: "doc-1",
      firstName: "Kaufmann",
      lastName: "",
      email: "kaufmann@example.com",
    },
  },
  {
    id: "5",
    firstName: "Maximilian",
    lastName: "Harrington Alexander",
    status: "PENDING",
    dateOfBirth: "1992-12-03",
    patientDNAResults: [],
    patientGoals: [],
    managingDoctor: null,
  },
  {
    id: "6",
    firstName: "Sebastian",
    lastName: "Montgomery Harrington III",
    status: "ACTIVE",
    dateOfBirth: "1992-12-03",
    patientDNAResults: [
      {
        id: "dna-6",
        status: "PENDING",
      },
    ],
    patientGoals: [],
    managingDoctor: null,
  },
  {
    id: "7",
    firstName: "Emma",
    lastName: "Watson",
    status: "ACTIVE",
    dateOfBirth: "1990-05-15",
    patientDNAResults: [],
    patientGoals: [
      {
        id: "goal-7",
        description: "Focus on improving sleep quality and establishing a consistent bedtime routine",
      },
    ],
    managingDoctor: {
      id: "doc-4",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@example.com",
    },
  },
  {
    id: "8",
    firstName: "John",
    lastName: "Smith",
    status: "ACTIVE",
    dateOfBirth: "1988-08-20",
    patientDNAResults: [
      {
        id: "dna-8",
        status: "READY",
      },
    ],
    patientGoals: [
      {
        id: "goal-8",
        description: "Maintain healthy cholesterol levels through diet and exercise",
      },
    ],
    managingDoctor: {
      id: "doc-5",
      firstName: "Robert",
      lastName: "Williams",
      email: "robert.williams@example.com",
    },
  },
];

