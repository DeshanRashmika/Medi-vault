package edu.icet.ecom.service;

import edu.icet.ecom.exception.ResourceNotFoundException;
import edu.icet.ecom.models.MedicalRecord;
import edu.icet.ecom.models.Patient;
import edu.icet.ecom.repository.MedicalRecordRepository;
import edu.icet.ecom.repository.PatientRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.ValidationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicalRecordService {

    @Autowired
    private MedicalRecordRepository recordRepository;

    @Autowired
    private PatientRepository patientRepository;

    public List<MedicalRecord> getRecordsForDoctor(Long patient, Long doctorId) {
        if (hasAccess(patient, doctorId)) {
            return recordRepository.findByPatientId(patient);
        }
        throw new RuntimeException("Access Denied: You do not have permission to view these records.");
    }

    public List<MedicalRecord> getRecordsForCurrentPatient(String email) {
        Patient patient = patientRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
        return recordRepository.findByPatientId(patient.getId());
    }

    @Transactional
    public MedicalRecord uploadSecureRecord(MedicalRecord record) {
        if (record == null || record.getPatient() == null || record.getPatient().getId() == null) {
            throw new ValidationException("patient.id is required");
        }

        Patient patient = patientRepository.findById(record.getPatient().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        record.setPatient(patient);

        return recordRepository.save(record);
    }

    @Transactional
    public MedicalRecord uploadRecordForCurrentPatient(String email, MedicalRecord record) {
        if (record == null) {
            throw new ValidationException("Request body is required");
        }

        Patient patient = patientRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
        record.setPatient(patient);

        return recordRepository.save(record);
    }

    private boolean hasAccess(Long patient, Long doctorId) {
        return true;
    }

    public List<MedicalRecord> getRecordsByPatientId(Long patientId) {
        return recordRepository.findByPatientId(patientId);
    }
}