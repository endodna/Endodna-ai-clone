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
  createPatientConversationSchema,
  sendPatientMessageSchema,
  updateConversationTitleSchema,
  registerPatientDNAKitSchema,
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
doctorRouter.post(
  "/patients/:patientId/lab-orders/kit",
  validateParams(patientIdParamsSchema),
  validate(registerPatientDNAKitSchema),
  DoctorController.registerPatientDNAKit,
);
doctorRouter.get("/patients/:patientId",
  validateParams(patientIdParamsSchema),
  DoctorController.getPatient
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

export default doctorRouter;
