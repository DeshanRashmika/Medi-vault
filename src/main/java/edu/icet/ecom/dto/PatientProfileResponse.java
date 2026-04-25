package edu.icet.ecom.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PatientProfileResponse {
    private String fullName;
    private String email;
    private String profileImageUrl;
    private String bloodGroup;
    private Double height;
    private Double weight;

    public PatientProfileResponse(String fullName, String email, String profileImageUrl) {
        this.fullName = fullName;
        this.email = email;
        this.profileImageUrl = profileImageUrl;
    }

    public PatientProfileResponse(String fullName,
                                  String email,
                                  String profileImageUrl,
                                  String bloodGroup,
                                  Double height,
                                  Double weight) {
        this.fullName = fullName;
        this.email = email;
        this.profileImageUrl = profileImageUrl;
        this.bloodGroup = bloodGroup;
        this.height = height;
        this.weight = weight;
    }
}
