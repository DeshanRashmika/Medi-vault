package edu.icet.ecom.controller;

import edu.icet.ecom.dto.ApiResponse;
import edu.icet.ecom.mapper.PatientProfileMapper;
import edu.icet.ecom.models.MedicalRecord;
import edu.icet.ecom.models.Patient;
import edu.icet.ecom.models.User;
import edu.icet.ecom.service.FileStorageService;
import edu.icet.ecom.service.MedicalRecordService;
import edu.icet.ecom.repository.PatientRepository;
import edu.icet.ecom.repository.UserRepository;
import edu.icet.ecom.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.ValidationException;

import java.security.Principal;

@RequiredArgsConstructor
@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/api/v1/records")
@PreAuthorize("hasRole('PATIENT')")
public class FileUploadController {

    private final FileStorageService fileStorageService;
    private final MedicalRecordService medicalRecordService;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @PostMapping("/upload-secure")
    public ResponseEntity<ApiResponse<MedicalRecord>> uploadMedicalFile(
            Principal principal,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "recordFile", required = false) MultipartFile recordFile,
            @RequestParam(value = "medicalFile", required = false) MultipartFile medicalFile,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "recordTitle", required = false) String recordTitle,
            @RequestParam(value = "patientId", required = false) Long patientId,
            @RequestParam(value = "patient_id", required = false) Long patientIdAlias,
            @RequestParam(value = "patient", required = false) Long patientLegacyId) {

        MultipartFile resolvedFile = firstNonNullFile(file, recordFile, medicalFile);
        String resolvedTitle = firstNonBlank(title, recordTitle);
        Long resolvedPatientId = firstNonNull(patientId, patientIdAlias, patientLegacyId);

        if (resolvedFile == null || resolvedFile.isEmpty()) {
            throw new ValidationException("File is required");
        }
        if (resolvedTitle == null || resolvedTitle.isBlank()) {
            throw new ValidationException("Title is required");
        }

        Patient patient = resolvePatient(principal, resolvedPatientId);

        String fileName = fileStorageService.storeFile(resolvedFile);

        MedicalRecord medicalRecord = new MedicalRecord();
        medicalRecord.setTitle(resolvedTitle.trim());
        medicalRecord.setFileUrl("/uploads/" + fileName);
        medicalRecord.setPatient(patient);

        MedicalRecord savedRecord = medicalRecordService.uploadSecureRecord(medicalRecord);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("File uploaded successfully", savedRecord));
    }

    private Patient resolvePatient(Principal principal, Long patientId) {
        if (patientId != null && patientId > 0) {
            return patientRepository.findById(patientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));
        }

        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new ValidationException("Valid patientId is required");
        }

        return patientRepository.findByUserEmail(principal.getName())
                .orElseGet(() -> {
                    User user = userRepository.findByEmail(principal.getName())
                            .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

                    Patient patient = new Patient();
                    patient.setUser(user);
                    patient.setProfileImageUrl(PatientProfileMapper.PROFILE_IMAGE_URL);
                    return patientRepository.save(patient);
                });
    }

    private MultipartFile firstNonNullFile(MultipartFile... files) {
        for (MultipartFile candidate : files) {
            if (candidate != null) {
                return candidate;
            }
        }
        return null;
    }

    private String firstNonBlank(String... values) {
        for (String candidate : values) {
            if (candidate != null && !candidate.isBlank()) {
                return candidate;
            }
        }
        return null;
    }

    @SafeVarargs
    private <T> T firstNonNull(T... values) {
        for (T candidate : values) {
            if (candidate != null) {
                return candidate;
            }
        }
        return null;
    }
}
