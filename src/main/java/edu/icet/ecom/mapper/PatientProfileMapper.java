package edu.icet.ecom.mapper;

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
        return new PatientProfileResponse(user.getFullName(), user.getEmail(), PROFILE_IMAGE_URL);
    }

    public void applyUpdate(UpdatePatientProfileRequest request, User user) {
        user.setFullName(request.getFullName().trim());
    }
}

