package edu.icet.ecom.service;

import edu.icet.ecom.models.MedicalRecord;
import edu.icet.ecom.models.Patient;
import edu.icet.ecom.repository.MedicalRecordRepository;
import jakarta.transaction.Transactional;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MedicalRecordService {

    @Autowired
    private MedicalRecordRepository recordRepository;
    public List<MedicalRecord> getRecordsForDoctor( Long patient, Long doctorId) {
         if (hasAccess(patient, doctorId)) {
            return recordRepository.findByPatient(patient);
        } else {
            throw new RuntimeException("Access Denied: You do not have permission to view these records.");
        }
    }

    @Transactional
    public MedicalRecord uploadSecureRecord(MedicalRecord record) {
        return recordRepository.save(record);
    }

    private boolean hasAccess(Long patient, Long doctorId) {
       return true;
    }

    public @Nullable List<MedicalRecord> getRecordsByPatientId(Long patientId) {
        return recordRepository.findByPatient(new Patient() {{ setId(patientId); }}.getId());
    }
}