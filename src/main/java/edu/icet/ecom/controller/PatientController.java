package edu.icet.ecom.controller;

import edu.icet.ecom.dto.ApiResponse;
import edu.icet.ecom.dto.PatientProfileRequestDTO;
import edu.icet.ecom.dto.PatientProfileResponse;
import edu.icet.ecom.service.PatientProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;

@RestController
@RequestMapping("/api/patients/profile")
@PreAuthorize("hasRole('PATIENT')")
public class PatientController {

    private final PatientProfileService patientProfileService;

    public PatientController(PatientProfileService patientProfileService) {
        this.patientProfileService = patientProfileService;
    }

    @PutMapping("/update")
    public ResponseEntity<ApiResponse<PatientProfileResponse>> updateHealthSummary(Principal principal,
                                                                                    @Valid @RequestBody PatientProfileRequestDTO request) {
        PatientProfileResponse response = patientProfileService
                .updateHealthSummary(getAuthenticatedEmail(principal), request);
        return ResponseEntity.ok(ApiResponse.success("Patient health summary updated successfully", response));
    }

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PatientProfileResponse>> uploadProfileImage(Principal principal,
                                                                                   @RequestParam("file") MultipartFile file) {
        PatientProfileResponse response = patientProfileService
                .uploadProfileImage(getAuthenticatedEmail(principal), file);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Profile image uploaded successfully", response));
    }

    private String getAuthenticatedEmail(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return principal.getName();
    }
}
