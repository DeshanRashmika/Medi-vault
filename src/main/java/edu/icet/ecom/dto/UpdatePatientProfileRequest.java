package edu.icet.ecom.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePatientProfileRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 120, message = "Full name must be less than or equal to 120 characters")
    private String fullName;
}

