package edu.icet.ecom.service;

import edu.icet.ecom.dto.PatientProfileRequestDTO;
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
import java.util.Arrays;
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
    private final FileStorageService fileStorageService;

    public PatientProfileService(PatientRepository patientRepository,
                                 UserRepository userRepository,
                                 PatientProfileMapper patientProfileMapper,
                                 FileStorageService fileStorageService) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.patientProfileMapper = patientProfileMapper;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public PatientProfileResponse getCurrentProfile(String email) {
        Patient patient = findOrCreatePatientByEmail(email);
        return patientProfileMapper.toResponse(patient);
    }

    @Transactional
    public PatientProfileResponse updateCurrentProfile(String email, UpdatePatientProfileRequest request) {
        Patient patient = findOrCreatePatientByEmail(email);

        // Apply mapped changes which may update both patient and nested user
        patientProfileMapper.applyUpdate(request, patient);

        // Rely on cascade MERGE on Patient.user to persist nested User changes when saving Patient
        Patient saved = patientRepository.save(patient);

        // Reload from repository to ensure response reflects persisted state (and any DB triggers)
        Patient refreshed = patientRepository.findById(saved.getId()).orElse(saved);
        return patientProfileMapper.toResponse(refreshed);
    }

    @Transactional
    public PatientProfileResponse updateHealthSummary(String email, PatientProfileRequestDTO request) {
        Patient patient = findOrCreatePatientByEmail(email);
        patientProfileMapper.applyHealthSummary(request, patient);

        Patient saved = patientRepository.save(patient);
        Patient refreshed = patientRepository.findById(saved.getId()).orElse(saved);
        return patientProfileMapper.toResponse(refreshed);
    }

    @Transactional
    public PatientProfileResponse uploadProfileImage(String email, MultipartFile file) {
        validateProfileImage(file);
        Patient patient = findOrCreatePatientByEmail(email);

        String fileName = fileStorageService.storeFile(file);
        patient.setProfileImageUrl("/uploads/" + fileName);
        Patient saved = patientRepository.save(patient);

        Patient refreshed = patientRepository.findById(saved.getId()).orElse(saved);
        return patientProfileMapper.toResponse(refreshed);
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
        Patient saved = patientRepository.save(patient);

        Patient refreshed = patientRepository.findById(saved.getId()).orElse(saved);
        return patientProfileMapper.toResponse(refreshed);
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
                    // Ensure consistent default profile image handling by storing the mapper fallback
                    patient.setProfileImageUrl(PatientProfileMapper.PROFILE_IMAGE_URL);
                    return patientRepository.save(patient);
                });
    }

    public record ProfileImageData(
            byte[] bytes,
            String contentType,
            String fileName,
            LocalDateTime updatedAt) {

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            ProfileImageData that = (ProfileImageData) o;
            return Arrays.equals(bytes, that.bytes)
                    && java.util.Objects.equals(contentType, that.contentType)
                    && java.util.Objects.equals(fileName, that.fileName)
                    && java.util.Objects.equals(updatedAt, that.updatedAt);
        }

        @Override
        public int hashCode() {
            int result = Arrays.hashCode(bytes);
            result = 31 * result + (contentType != null ? contentType.hashCode() : 0);
            result = 31 * result + (fileName != null ? fileName.hashCode() : 0);
            result = 31 * result + (updatedAt != null ? updatedAt.hashCode() : 0);
            return result;
        }

        @Override
        public String toString() {
            return "ProfileImageData{" +
                    "bytes-length=" + (bytes == null ? 0 : bytes.length) +
                    ", contentType='" + contentType + '\'' +
                    ", fileName='" + fileName + '\'' +
                    ", updatedAt=" + updatedAt +
                    '}';
        }
    }
}
