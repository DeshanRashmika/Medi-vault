package edu.icet.ecom.controller;

import edu.icet.ecom.dto.PatientProfileResponse;
import edu.icet.ecom.exception.GlobalExceptionHandler;
import edu.icet.ecom.service.PatientProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PatientControllerTest {

    private MockMvc mockMvc;
    private PatientProfileService patientProfileService;

    @BeforeEach
    void setUp() {
        patientProfileService = Mockito.mock(PatientProfileService.class);
        PatientController controller = new PatientController(patientProfileService);

        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void updateHealthSummary_updatesCurrentPatient() throws Exception {
        Mockito.when(patientProfileService.updateHealthSummary(eq("patient@medi-vault.com"), any()))
                .thenReturn(new PatientProfileResponse(
                        "Patient One",
                        "patient@medi-vault.com",
                        "/uploads/a.png",
                        "A+",
                        1.72,
                        68.5
                ));

        mockMvc.perform(put("/api/patients/profile/update")
                        .principal(() -> "patient@medi-vault.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bloodGroup\":\"A+\",\"height\":1.72,\"weight\":68.5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.bloodGroup").value("A+"))
                .andExpect(jsonPath("$.data.height").value(1.72))
                .andExpect(jsonPath("$.data.weight").value(68.5));
    }

    @Test
    void uploadImage_savesFileAndReturnsUpdatedUrl() throws Exception {
        Mockito.when(patientProfileService.uploadProfileImage(eq("patient@medi-vault.com"), any(MultipartFile.class)))
                .thenReturn(new PatientProfileResponse(
                        "Patient One",
                        "patient@medi-vault.com",
                        "/uploads/171234_avatar.png",
                        null,
                        null,
                        null
                ));

        mockMvc.perform(multipart("/api/patients/profile/upload-image")
                        .file("file", "fake-image".getBytes())
                        .principal(() -> "patient@medi-vault.com")
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.profileImageUrl").value("/uploads/171234_avatar.png"));
    }
}

