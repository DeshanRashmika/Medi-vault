package edu.icet.ecom.service;

import edu.icet.ecom.exception.ResourceNotFoundException;
import edu.icet.ecom.models.MedicalRecord;
import edu.icet.ecom.models.Patient;
import edu.icet.ecom.repository.MedicalRecordRepository;
import edu.icet.ecom.repository.PatientRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedicalRecordServiceTest {

    @Mock
    private MedicalRecordRepository recordRepository;

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private MedicalRecordService medicalRecordService;

    @Test
    void uploadSecureRecord_savesRecordWhenValid() {
        Patient patient = new Patient();
        patient.setId(7L);

        MedicalRecord record = new MedicalRecord();
        record.setTitle("X-Ray Report");
        record.setPatient(patient);

        when(patientRepository.findById(7L)).thenReturn(Optional.of(patient));
        when(recordRepository.save(any(MedicalRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MedicalRecord saved = medicalRecordService.uploadSecureRecord(record);

        assertEquals(patient, saved.getPatient());
        assertEquals("X-Ray Report", saved.getTitle());
        verify(recordRepository).save(record);
    }

    @Test
    void uploadSecureRecord_rejectsBlankTitle() {
        Patient patient = new Patient();
        patient.setId(7L);

        MedicalRecord record = new MedicalRecord();
        record.setTitle("   ");
        record.setPatient(patient);

        assertThrows(jakarta.validation.ValidationException.class,
                () -> medicalRecordService.uploadSecureRecord(record));
    }

    @Test
    void uploadSecureRecord_rejectsUnknownPatient() {
        Patient patient = new Patient();
        patient.setId(7L);

        MedicalRecord record = new MedicalRecord();
        record.setTitle("Report");
        record.setPatient(patient);

        when(patientRepository.findById(7L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> medicalRecordService.uploadSecureRecord(record));
    }
}
