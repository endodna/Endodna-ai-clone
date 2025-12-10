import { Router } from "express";
import { Authentication } from "../../middlewares/Authentication";
import { DoctorAuthorization } from "../../middlewares/Authorization";
import { validate, validateParams, validateQuery } from "../../middlewares/Validator";
import {
  conversationIdParamsSchema,
  createPatientActiveMedicationSchema,
  createPatientMedicalRecordSchema,
  createPatientSchema,
  getPatientsSchema,
  medicationIdParamsSchema,
  patientIdParamsSchema,
  sendPatientMessageSchema,
  updateConversationTitleSchema,
  registerPatientDNAKitSchema,
  createPatientChartNoteSchema,
  updatePatientChartNoteSchema,
  chartNoteIdParamsSchema,
  createAlertOrAllergyParamsSchema,
  updateAlertOrAllergyParamsSchema,
  deleteAlertOrAllergyParamsSchema,
  updatePatientInfoSchema,
  createAlertOrAllergyBodySchema,
  updateAlertOrAllergyBodySchema,
  createGeneralConversationSchema,
  sendGeneralMessageSchema,
  generalConversationIdParamsSchema,
  createPatientConversationSchema,
  createPatientAddressSchema,
  updatePatientAddressSchema,
  addressIdParamsSchema,
  dnaKitResultIdParamsSchema,
  updatePatientGeneticsStatusSchema,
  getReportsSchema,
  // createReportSchema,
  updateReportSchema,
  reportIdParamsSchema,
  calculatePatientTestosteroneDosingSuggestionsSchema,
  savePatientDosageSchema,
  createPatientGoalSchema,
  updatePatientGoalSchema,
  goalIdParamsSchema,
} from "../../schemas";
import DoctorController from "../../controllers/DoctorController";
import { uploadMultiple } from "../../middlewares/FileUpload";

const doctorRouter = Router().use("/", Authentication, DoctorAuthorization);

// Doctor Routes
doctorRouter.get("/doctors", DoctorController.getDoctors);

// Patient Routes
doctorRouter.post(
  "/patient",
  validate(createPatientSchema),
  DoctorController.createPatient,
);
doctorRouter.get(
  "/patients",
  validateQuery(getPatientsSchema),
  DoctorController.getPatients,
);
doctorRouter.get("/patients/:patientId",
  validateParams(patientIdParamsSchema),
  DoctorController.getPatient
);
doctorRouter.put("/patients/:patientId",
  validateParams(patientIdParamsSchema),
  validate(updatePatientInfoSchema),
  DoctorController.updatePatientInfo
);

// Medication Routes
doctorRouter.post(
  "/patients/:patientId/medications",
  validateParams(patientIdParamsSchema),
  validate(createPatientActiveMedicationSchema),
  DoctorController.createPatientActiveMedication,
);
doctorRouter.get(
  "/patients/:patientId/medications",
  DoctorController.getPatientActiveMedication,
);
doctorRouter.put(
  "/patients/:patientId/medications/:medicationId",
  validateParams(medicationIdParamsSchema),
  validate(createPatientActiveMedicationSchema),
  DoctorController.updatePatientActiveMedication,
);
doctorRouter.delete(
  "/patients/:patientId/medications/:medicationId",
  validateParams(medicationIdParamsSchema),
  DoctorController.deletePatientActiveMedication,
);

// Medical Record Routes
doctorRouter.post(
  "/patients/:patientId/medical-records",
  validateParams(patientIdParamsSchema),
  uploadMultiple,
  validate(createPatientMedicalRecordSchema),
  DoctorController.uploadMultipleMedicalRecords,
);

doctorRouter.get(
  "/patients/:patientId/medical-records",
  validateParams(patientIdParamsSchema),
  DoctorController.getMedicalRecords,
);

// AI Summary Routes
doctorRouter.get(
  "/patients/:patientId/summary",
  validateParams(patientIdParamsSchema),
  DoctorController.getPatientAISummary,
);

// Genetics Routes
doctorRouter.get(
  "/patients/:patientId/genetics",
  validateParams(patientIdParamsSchema),
  DoctorController.getPatientGenetics,
);
doctorRouter.get(
  "/patients/:patientId/genetics/reports",
  validateParams(patientIdParamsSchema),
  DoctorController.getPatientGeneticReports,
);
doctorRouter.post(
  "/patients/:patientId/lab-orders",
  validateParams(patientIdParamsSchema),
  validate(registerPatientDNAKitSchema),
  DoctorController.registerPatientDNAKit,
);
doctorRouter.post(
  "/patients/:patientId/genetics/:dnaKitResultId",
  validateParams(dnaKitResultIdParamsSchema),
  validate(updatePatientGeneticsStatusSchema),
  DoctorController.updatePatientGeneticsStatus,
);

// AI Chat Routes
doctorRouter.get(
  "/patients/:patientId/conversations",
  validateParams(patientIdParamsSchema),
  DoctorController.getPatientConversations,
);
doctorRouter.post(
  "/patients/:patientId/conversations",
  validateParams(patientIdParamsSchema),
  validate(createPatientConversationSchema),
  DoctorController.createPatientConversation,
);
doctorRouter.get(
  "/patients/:patientId/conversations/:conversationId/messages",
  validateParams(conversationIdParamsSchema),
  DoctorController.getPatientConversationMessages,
);
doctorRouter.post(
  "/patients/:patientId/conversations/:conversationId/messages",
  validateParams(conversationIdParamsSchema),
  validate(sendPatientMessageSchema),
  DoctorController.sendPatientConversationMessage,
);

doctorRouter.patch(
  "/patients/:patientId/conversations/:conversationId/title",
  validateParams(conversationIdParamsSchema),
  validate(updateConversationTitleSchema),
  DoctorController.updatePatientConversationTitle,
);

// General AI Chat Routes
doctorRouter.get(
  "/conversations/patients",
  DoctorController.getAllPatientConversations,
);
doctorRouter.get(
  "/conversations",
  DoctorController.getGeneralConversations,
);
doctorRouter.post(
  "/conversations",
  validate(createGeneralConversationSchema),
  DoctorController.createGeneralConversation,
);
doctorRouter.get(
  "/conversations/:conversationId/messages",
  validateParams(generalConversationIdParamsSchema),
  DoctorController.getGeneralConversationMessages,
);
doctorRouter.post(
  "/conversations/:conversationId/messages",
  validateParams(generalConversationIdParamsSchema),
  validate(sendGeneralMessageSchema),
  DoctorController.sendGeneralConversationMessage,
);
doctorRouter.patch(
  "/conversations/:conversationId/title",
  validateParams(generalConversationIdParamsSchema),
  validate(updateConversationTitleSchema),
  DoctorController.updateGeneralConversationTitle,
);

// Patient Chart Note Routes
doctorRouter.post(
  "/patients/:patientId/chart-notes",
  validateParams(patientIdParamsSchema),
  validate(createPatientChartNoteSchema),
  DoctorController.createPatientChartNote,
);
doctorRouter.get(
  "/patients/:patientId/chart-notes",
  validateParams(patientIdParamsSchema),
  DoctorController.getPatientChartNotes,
);
doctorRouter.put(
  "/patients/:patientId/chart-notes/:chartNoteId",
  validateParams(chartNoteIdParamsSchema),
  validate(updatePatientChartNoteSchema),
  DoctorController.updatePatientChartNote,
);
doctorRouter.delete(
  "/patients/:patientId/chart-notes/:chartNoteId",
  validateParams(chartNoteIdParamsSchema),
  DoctorController.deletePatientChartNote,
);

// Patient Alert or Allergy Routes
doctorRouter.post(
  "/patients/:patientId/alerts/:type",
  validateParams(createAlertOrAllergyParamsSchema),
  validate(createAlertOrAllergyBodySchema),
  DoctorController.createPatientAlertAndAllergy,
);
doctorRouter.get(
  "/patients/:patientId/alerts",
  validateParams(patientIdParamsSchema),
  DoctorController.getPatientAlertsAndAllergies,
);
doctorRouter.put(
  "/patients/:patientId/alerts/:alertId/:type",
  validateParams(updateAlertOrAllergyParamsSchema),
  validate(updateAlertOrAllergyBodySchema),
  DoctorController.updatePatientAlertAndAllergy,
);
doctorRouter.delete(
  "/patients/:patientId/alerts/:alertId/:type",
  validateParams(deleteAlertOrAllergyParamsSchema),
  DoctorController.deletePatientAlertAndAllergy,
);

// Patient Address Routes
doctorRouter.get(
  "/patients/:patientId/addresses",
  validateParams(patientIdParamsSchema),
  DoctorController.getPatientAddresses,
);
doctorRouter.post(
  "/patients/:patientId/addresses",
  validateParams(patientIdParamsSchema),
  validate(createPatientAddressSchema),
  DoctorController.createPatientAddress,
);
doctorRouter.put(
  "/patients/:patientId/addresses/:addressId",
  validateParams(addressIdParamsSchema),
  validate(updatePatientAddressSchema),
  DoctorController.updatePatientAddress,
);
doctorRouter.delete(
  "/patients/:patientId/addresses/:addressId",
  validateParams(addressIdParamsSchema),
  DoctorController.deletePatientAddress,
);

// Reports Routes
doctorRouter.get(
  "/reports",
  validateQuery(getReportsSchema),
  DoctorController.getReports,
);
// doctorRouter.post(
//   "/reports",
//   validate(createReportSchema),
//   DoctorController.createReport,
// );
doctorRouter.put(
  "/reports/:reportId",
  validateParams(reportIdParamsSchema),
  validate(updateReportSchema),
  DoctorController.updateReport,
);
// doctorRouter.delete(
//   "/reports/:reportId",
//   validateParams(reportIdParamsSchema),
//   DoctorController.deleteReport,
// );

// Dosing Routes
doctorRouter.post(
  "/patients/:patientId/dosing/testosterone",
  validateParams(patientIdParamsSchema),
  validate(calculatePatientTestosteroneDosingSuggestionsSchema),
  DoctorController.calculatePatientTestosteroneDosingSuggestions,
);
doctorRouter.post(
  "/patients/:patientId/dosing/estradiol",
  validateParams(patientIdParamsSchema),
  DoctorController.calculatePatientEstradiolDosingSuggestions,
);

doctorRouter.post(
  "/patients/:patientId/dosing",
  validateParams(patientIdParamsSchema),
  validate(savePatientDosageSchema),
  DoctorController.savePatientDosage,
);

doctorRouter.get(
  "/patients/:patientId/dosing",
  validateParams(patientIdParamsSchema),
  DoctorController.getPatientDosageHistory,
);

// Patient Goal Routes
doctorRouter.get(
  "/patients/:patientId/goals",
  validateParams(patientIdParamsSchema),
  DoctorController.getPatientGoals,
);
doctorRouter.post(
  "/patients/:patientId/goals",
  validateParams(patientIdParamsSchema),
  validate(createPatientGoalSchema),
  DoctorController.createPatientGoal,
);
doctorRouter.delete(
  "/patients/:patientId/goals/:goalId",
  validateParams(goalIdParamsSchema),
  DoctorController.deletePatientGoal,
);
doctorRouter.put(
  "/patients/:patientId/goals/:goalId",
  validateParams(goalIdParamsSchema),
  validate(updatePatientGoalSchema),
  DoctorController.updatePatientGoal,
);

export default doctorRouter;
