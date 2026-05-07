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
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "patientId", required = false) Long patientId) {

        if (file == null || file.isEmpty()) {
            throw new ValidationException("File is required");
        }
        if (title == null || title.isBlank()) {
            throw new ValidationException("Title is required");
        }
        if (patientId == null || patientId <= 0) {
            throw new ValidationException("Valid patientId is required");
        }

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        String fileName = fileStorageService.storeFile(file);

        MedicalRecord medicalRecord = new MedicalRecord();
        medicalRecord.setTitle(title.trim());
        medicalRecord.setFileUrl("/uploads/" + fileName);
        medicalRecord.setPatient(patient);

        MedicalRecord savedRecord = medicalRecordService.uploadSecureRecord(medicalRecord);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("File uploaded successfully", savedRecord));
    }
}
