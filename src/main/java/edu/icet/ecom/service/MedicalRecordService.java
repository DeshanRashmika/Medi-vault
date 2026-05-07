package edu.icet.ecom.service;

import edu.icet.ecom.exception.ResourceNotFoundException;
import edu.icet.ecom.models.MedicalRecord;
import edu.icet.ecom.models.Patient;
import edu.icet.ecom.repository.MedicalRecordRepository;
import edu.icet.ecom.repository.PatientRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.ValidationException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicalRecordService {

    private final MedicalRecordRepository recordRepository;
    private final PatientRepository patientRepository;

    public MedicalRecordService(MedicalRecordRepository recordRepository, PatientRepository patientRepository) {
        this.recordRepository = recordRepository;
        this.patientRepository = patientRepository;
    }

    public List<MedicalRecord> getRecordsForDoctor(Long patientId, Long doctorId) {
        return recordRepository.findByPatientId(patientId);
    }

    public List<MedicalRecord> getRecordsForCurrentPatient(String email) {
        Patient patient = patientRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
        return recordRepository.findByPatientId(patient.getId());
    }

    @Transactional
    public MedicalRecord uploadSecureRecord(MedicalRecord medicalRecord) {
        if (medicalRecord == null) {
            throw new ValidationException("Request body is required");
        }
        if (medicalRecord.getTitle() == null || medicalRecord.getTitle().isBlank()) {
            throw new ValidationException("title is required");
        }
        if (medicalRecord.getPatient() == null || medicalRecord.getPatient().getId() == null) {
            throw new ValidationException("patient.id is required");
        }

        Patient patient = patientRepository.findById(medicalRecord.getPatient().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        medicalRecord.setPatient(patient);

        return recordRepository.save(medicalRecord);
    }

    @Transactional
    public MedicalRecord uploadRecordForCurrentPatient(String email, MedicalRecord medicalRecord) {
        if (medicalRecord == null) {
            throw new ValidationException("Request body is required");
        }

        Patient patient = patientRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
        medicalRecord.setPatient(patient);

        return recordRepository.save(medicalRecord);
    }

    public List<MedicalRecord> getRecordsByPatientId(Long patientId) {
        return recordRepository.findByPatientId(patientId);
    }
}