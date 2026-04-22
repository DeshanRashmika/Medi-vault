package edu.icet.ecom.service;

import edu.icet.ecom.dto.PatientProfileResponse;
import edu.icet.ecom.dto.UpdatePatientProfileRequest;
import edu.icet.ecom.exception.ForbiddenOperationException;
import edu.icet.ecom.exception.ResourceNotFoundException;
import edu.icet.ecom.mapper.PatientProfileMapper;
import edu.icet.ecom.models.Patient;
import edu.icet.ecom.models.User;
import edu.icet.ecom.repository.PatientRepository;
import edu.icet.ecom.repository.UserRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.ValidationException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.UnsupportedMediaTypeStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Set;

@Service
public class PatientProfileService {

    private static final long MAX_PROFILE_IMAGE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final PatientProfileMapper patientProfileMapper;

    public PatientProfileService(PatientRepository patientRepository,
                                 UserRepository userRepository,
                                 PatientProfileMapper patientProfileMapper) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.patientProfileMapper = patientProfileMapper;
    }

    @Transactional
    public PatientProfileResponse getCurrentProfile(String email) {
        Patient patient = findOrCreatePatientByEmail(email);
        return patientProfileMapper.toResponse(patient);
    }

    @Transactional
    public PatientProfileResponse updateCurrentProfile(String email, UpdatePatientProfileRequest request) {
        Patient patient = findOrCreatePatientByEmail(email);
        patientProfileMapper.applyUpdate(request, patient.getUser());
        userRepository.save(patient.getUser());
        return patientProfileMapper.toResponse(patient);
    }

    @Transactional
    public PatientProfileResponse updateCurrentProfilePicture(String email, MultipartFile file) {
        validateProfileImage(file);
        Patient patient = findOrCreatePatientByEmail(email);

        try {
            patient.setProfilePicture(file.getBytes());
        } catch (IOException e) {
            throw new ValidationException("Unable to process uploaded image");
        }

        String originalFilename = file.getOriginalFilename();
        patient.setProfilePictureFileName((originalFilename == null || originalFilename.isBlank())
                ? "profile-image"
                : originalFilename);
        patient.setProfilePictureContentType(file.getContentType());
        patient.setProfilePictureUpdatedAt(LocalDateTime.now());
        patientRepository.save(patient);

        return patientProfileMapper.toResponse(patient);
    }

    @Transactional
    public ProfileImageData getCurrentProfilePicture(String email) {
        Patient patient = findOrCreatePatientByEmail(email);

        if (patient.getProfilePicture() == null || patient.getProfilePicture().length == 0) {
            throw new ResourceNotFoundException("Profile picture not found");
        }

        String contentType = patient.getProfilePictureContentType() == null
                ? "application/octet-stream"
                : patient.getProfilePictureContentType();
        String fileName = patient.getProfilePictureFileName() == null
                ? "profile-image"
                : patient.getProfilePictureFileName();

        return new ProfileImageData(patient.getProfilePicture(), contentType, fileName, patient.getProfilePictureUpdatedAt());
    }

    private void validateProfileImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("Profile picture file is required");
        }

        if (file.getSize() > MAX_PROFILE_IMAGE_BYTES) {
            throw new ValidationException("Profile picture must be less than or equal to 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new UnsupportedMediaTypeStatusException("Only image/jpeg, image/png, image/webp are supported");
        }
    }

    private Patient findOrCreatePatientByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        if (user.getRole() != User.Role.PATIENT) {
            throw new ForbiddenOperationException("Only patients can access patient profile endpoints");
        }

        return patientRepository.findByUserEmail(email)
                .orElseGet(() -> {
                    Patient patient = new Patient();
                    patient.setUser(user);
                    return patientRepository.save(patient);
                });
    }

    public record ProfileImageData(byte[] bytes, String contentType, String fileName, LocalDateTime updatedAt) {
    }
}

