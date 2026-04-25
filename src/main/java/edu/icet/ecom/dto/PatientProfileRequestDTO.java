package edu.icet.ecom.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientProfileRequestDTO {

    @Pattern(regexp = "^(A|B|AB|O)[+-]$", message = "Blood group must be one of A+, A-, B+, B-, AB+, AB-, O+, O-")
    private String bloodGroup;

    @DecimalMin(value = "0.3", message = "Height must be at least 0.3 meters")
    @DecimalMax(value = "3.0", message = "Height must be less than or equal to 3.0 meters")
    private Double height;

    @DecimalMin(value = "1.0", message = "Weight must be at least 1kg")
    @DecimalMax(value = "500.0", message = "Weight must be less than or equal to 500kg")
    private Double weight;

    @Size(max = 500, message = "Profile image URL must be less than or equal to 500 characters")
    private String profileImageUrl;
}

