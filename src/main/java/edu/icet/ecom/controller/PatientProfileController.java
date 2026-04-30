package edu.icet.ecom.controller;

import edu.icet.ecom.dto.ApiResponse;
import edu.icet.ecom.dto.PatientProfileResponse;
import edu.icet.ecom.dto.UpdatePatientProfileRequest;
import edu.icet.ecom.service.PatientProfileService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.time.Duration;

@RestController
@RequestMapping("/api/patient/profile")
@PreAuthorize("hasRole('PATIENT')")
public class PatientProfileController {

    private final PatientProfileService patientProfileService;

    public PatientProfileController(PatientProfileService patientProfileService) {
        this.patientProfileService = patientProfileService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PatientProfileResponse>> getMyProfile(Principal principal) {
        PatientProfileResponse profile = patientProfileService.getCurrentProfile(getAuthenticatedEmail(principal));
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", profile));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<PatientProfileResponse>> updateMyProfile(Principal principal,
                                                                               @Valid @RequestBody UpdatePatientProfileRequest request) {
        PatientProfileResponse profile = patientProfileService
                .updateCurrentProfile(getAuthenticatedEmail(principal), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile));
    }

    @PostMapping(value = "/picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PatientProfileResponse>> updateProfilePicture(Principal principal,
                                                                                     @RequestParam("file") MultipartFile file) {
        PatientProfileResponse profile = patientProfileService
                .updateCurrentProfilePicture(getAuthenticatedEmail(principal), file);
        return ResponseEntity.ok(ApiResponse.success("Profile picture updated successfully", profile));
    }

    @GetMapping("/picture")
    public ResponseEntity<byte[]> getProfilePicture(Principal principal) {
        PatientProfileService.ProfileImageData imageData = patientProfileService
                .getCurrentProfilePicture(getAuthenticatedEmail(principal));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(imageData.contentType()));
        headers.setCacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePrivate());
        headers.setContentDisposition(ContentDisposition.inline().filename(imageData.fileName()).build());

        return new ResponseEntity<>(imageData.bytes(), headers, HttpStatus.OK);
    }

    private String getAuthenticatedEmail(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return principal.getName();
    }
}
