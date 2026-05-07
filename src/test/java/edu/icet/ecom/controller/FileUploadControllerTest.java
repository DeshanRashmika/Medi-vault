package edu.icet.ecom.controller;

import edu.icet.ecom.models.MedicalRecord;
import edu.icet.ecom.models.Patient;
import edu.icet.ecom.repository.PatientRepository;
import edu.icet.ecom.service.FileStorageService;
import edu.icet.ecom.service.MedicalRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileUploadControllerTest {

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private MedicalRecordService medicalRecordService;

    @Mock
    private PatientRepository patientRepository;

    private FileUploadController controller;

    @BeforeEach
    void setUp() {
        controller = new FileUploadController(fileStorageService, medicalRecordService, patientRepository);
    }

    @Test
    void uploadMedicalFile_returnsCreatedResponse() {
        Patient patient = new Patient();
        patient.setId(1L);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "record.pdf",
                "application/pdf",
                "dummy-data".getBytes()
        );

        MedicalRecord saved = new MedicalRecord();
        saved.setTitle("Scan Report");
        saved.setPatient(patient);
        saved.setFileUrl("/uploads/test.pdf");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(fileStorageService.storeFile(file)).thenReturn("test.pdf");
        when(medicalRecordService.uploadSecureRecord(any(MedicalRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = controller.uploadMedicalFile(file, "  Scan Report  ", 1L);

        assertEquals(201, response.getStatusCode().value());
        assertEquals("File uploaded successfully", response.getBody().getMessage());
        assertEquals("Scan Report", response.getBody().getData().getTitle());
        assertEquals("/uploads/test.pdf", response.getBody().getData().getFileUrl());
        verify(fileStorageService).storeFile(file);
        verify(medicalRecordService).uploadSecureRecord(any(MedicalRecord.class));
    }

    @Test
    void uploadMedicalFile_rejectsBlankTitle() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "record.pdf",
                "application/pdf",
                "dummy-data".getBytes()
        );

        assertThrows(jakarta.validation.ValidationException.class,
                () -> controller.uploadMedicalFile(file, "   ", 1L));
    }
}

