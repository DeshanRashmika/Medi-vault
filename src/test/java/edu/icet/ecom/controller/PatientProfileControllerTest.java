package edu.icet.ecom.controller;

import edu.icet.ecom.dto.PatientProfileResponse;
import edu.icet.ecom.exception.ForbiddenOperationException;
import edu.icet.ecom.exception.GlobalExceptionHandler;
import edu.icet.ecom.exception.ResourceNotFoundException;
import edu.icet.ecom.service.PatientProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.UnsupportedMediaTypeStatusException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PatientProfileControllerTest {

    private MockMvc mockMvc;
    private PatientProfileService patientProfileService;

    @BeforeEach
    void setUp() {
        patientProfileService = Mockito.mock(PatientProfileService.class);
        PatientProfileController controller = new PatientProfileController(patientProfileService);

        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getProfile_returnsCurrentPatientProfile() throws Exception {
        Mockito.when(patientProfileService.getCurrentProfile("patient@medi-vault.com"))
                .thenReturn(new PatientProfileResponse("Patient One", "patient@medi-vault.com", "/api/patient/profile/picture"));

        mockMvc.perform(get("/api/patient/profile").principal(() -> "patient@medi-vault.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Patient One"))
                .andExpect(jsonPath("$.data.email").value("patient@medi-vault.com"))
                .andExpect(jsonPath("$.data.profileImageUrl").value("/api/patient/profile/picture"));
    }

    @Test
    void putProfile_updatesFullName() throws Exception {
        Mockito.when(patientProfileService.updateCurrentProfile(eq("patient@medi-vault.com"), any()))
                .thenReturn(new PatientProfileResponse("Updated Name", "patient@medi-vault.com", "/api/patient/profile/picture"));

        mockMvc.perform(put("/api/patient/profile")
                        .principal(() -> "patient@medi-vault.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Updated Name\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Updated Name"));
    }

    @Test
    void postPicture_updatesProfilePicture() throws Exception {
        Mockito.when(patientProfileService.updateCurrentProfilePicture(eq("patient@medi-vault.com"), any(MultipartFile.class)))
                .thenReturn(new PatientProfileResponse("Patient One", "patient@medi-vault.com", "/api/patient/profile/picture"));

        mockMvc.perform(multipart("/api/patient/profile/picture")
                        .file("file", "fake-image".getBytes())
                        .principal(() -> "patient@medi-vault.com")
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void putProfile_returns400ForInvalidPayload() throws Exception {
        mockMvc.perform(put("/api/patient/profile")
                        .principal(() -> "patient@medi-vault.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void getPicture_streamsStoredImage() throws Exception {
        byte[] image = "img-bytes".getBytes();
        Mockito.when(patientProfileService.getCurrentProfilePicture("patient@medi-vault.com"))
                .thenReturn(new PatientProfileService.ProfileImageData(image, "image/png", "avatar.png", null));

        mockMvc.perform(get("/api/patient/profile/picture").principal(() -> "patient@medi-vault.com"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "image/png"))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"avatar.png\""))
                .andExpect(content().bytes(image));
    }

    @Test
    void postPicture_returns415ForUnsupportedMediaType() throws Exception {
        Mockito.when(patientProfileService.updateCurrentProfilePicture(eq("patient@medi-vault.com"), any(MultipartFile.class)))
                .thenThrow(new UnsupportedMediaTypeStatusException("Only image/jpeg, image/png, image/webp are supported"));

        mockMvc.perform(multipart("/api/patient/profile/picture")
                        .file("file", "bad-file".getBytes())
                        .principal(() -> "patient@medi-vault.com")
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        }))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void profileEndpoint_returns401WhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/patient/profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }

    @Test
    void profileEndpoint_returns403WhenServiceRejectsRole() throws Exception {
        Mockito.when(patientProfileService.getCurrentProfile("doctor@medi-vault.com"))
                .thenThrow(new ForbiddenOperationException("Only patients can access patient profile endpoints"));

        mockMvc.perform(get("/api/patient/profile").principal(() -> "doctor@medi-vault.com"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Only patients can access patient profile endpoints"));
    }

    @Test
    void getPicture_returns404WhenMissing() throws Exception {
        Mockito.when(patientProfileService.getCurrentProfilePicture("patient@medi-vault.com"))
                .thenThrow(new ResourceNotFoundException("Profile picture not found"));

        mockMvc.perform(get("/api/patient/profile/picture").principal(() -> "patient@medi-vault.com"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Profile picture not found"));
    }
}
