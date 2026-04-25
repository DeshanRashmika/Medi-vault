package edu.icet.ecom.mapper;

import edu.icet.ecom.dto.PatientProfileRequestDTO;
import edu.icet.ecom.dto.PatientProfileResponse;
import edu.icet.ecom.dto.UpdatePatientProfileRequest;
import edu.icet.ecom.models.Patient;
import edu.icet.ecom.models.User;
import org.springframework.stereotype.Component;

@Component
public class PatientProfileMapper {

    public static final String PROFILE_IMAGE_URL = "/api/patient/profile/picture";

    public PatientProfileResponse toResponse(Patient patient) {
        User user = patient.getUser();
        String imageUrl = patient.getProfileImageUrl() == null || patient.getProfileImageUrl().isBlank()
                ? PROFILE_IMAGE_URL
                : patient.getProfileImageUrl();

        return new PatientProfileResponse(
                user.getFullName(),
                user.getEmail(),
                imageUrl,
                patient.getBloodGroup(),
                patient.getHeight(),
                patient.getWeight()
        );
    }

    public void applyUpdate(UpdatePatientProfileRequest request, User user) {
        user.setFullName(request.getFullName().trim());
    }

    public void applyHealthSummary(PatientProfileRequestDTO request, Patient patient) {
        patient.setBloodGroup(request.getBloodGroup());
        patient.setHeight(request.getHeight());
        patient.setWeight(request.getWeight());

        if (request.getProfileImageUrl() != null && !request.getProfileImageUrl().isBlank()) {
            patient.setProfileImageUrl(request.getProfileImageUrl().trim());
        }
    }
}
