package edu.icet.ecom.controller;

import edu.icet.ecom.dto.ApiResponse;
import edu.icet.ecom.models.MedicalRecord;
import edu.icet.ecom.models.Patient;
import edu.icet.ecom.service.FileStorageService;
import edu.icet.ecom.service.MedicalRecordService;
import edu.icet.ecom.repository.PatientRepository;
import edu.icet.ecom.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.ValidationException;

@RequiredArgsConstructor
@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/api/v1/records")
@PreAuthorize("hasRole('PATIENT')")
public class FileUploadController {

    private final FileStorageService fileStorageService;
    private final MedicalRecordService medicalRecordService;
    private final PatientRepository patientRepository;

    @PostMapping("/upload-secure")
    public ResponseEntity<ApiResponse<MedicalRecord>> uploadMedicalFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("patientId") Long patientId) {

        if (patientId == null || patientId <= 0) {
            throw new ValidationException("Valid patientId is required");
        }

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        String fileName = fileStorageService.storeFile(file);

        MedicalRecord record = new MedicalRecord();
        record.setTitle(title);
        record.setFileUrl("/uploads/" + fileName);
        record.setPatient(patient);

        MedicalRecord savedRecord = medicalRecordService.uploadSecureRecord(record);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("File uploaded successfully", savedRecord));
    }
}
