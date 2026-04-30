package edu.icet.ecom.service;

import edu.icet.ecom.dto.UpdatePatientProfileRequest;
import edu.icet.ecom.exception.ForbiddenOperationException;
import edu.icet.ecom.mapper.PatientProfileMapper;
import edu.icet.ecom.models.Patient;
import edu.icet.ecom.models.User;
import edu.icet.ecom.repository.PatientRepository;
import edu.icet.ecom.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientProfileServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileStorageService fileStorageService;

    private PatientProfileService patientProfileService;

    @BeforeEach
    void setUp() {
        patientProfileService = new PatientProfileService(
                patientRepository,
                userRepository,
                new PatientProfileMapper(),
                fileStorageService
        );
    }

    @Test
    void updateCurrentProfile_savesUserAndPatientInSameFlow() {
        User user = new User();
        user.setId(10L);
        user.setEmail("patient@medi-vault.com");
        user.setFullName("Initial Name");
        user.setRole(User.Role.PATIENT);

        Patient patient = new Patient();
        patient.setId(20L);
        patient.setUser(user);

        UpdatePatientProfileRequest request = new UpdatePatientProfileRequest();
        request.setFullName("Updated Name");
        request.setBloodGroup("B+");
        request.setHeight(1.75);
        request.setWeight(72.4);

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(patientRepository.findByUserEmail(user.getEmail())).thenReturn(Optional.of(patient));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        patientProfileService.updateCurrentProfile(user.getEmail(), request);

        assertEquals("Updated Name", user.getFullName());
        assertEquals("B+", patient.getBloodGroup());
        assertEquals(1.75, patient.getHeight());
        assertEquals(72.4, patient.getWeight());
        verify(userRepository).save(eq(user));
        verify(patientRepository).save(eq(patient));
    }

    @Test
    void updateCurrentProfile_rejectsNonPatientUsers() {
        User doctor = new User();
        doctor.setEmail("doctor@medi-vault.com");
        doctor.setRole(User.Role.DOCTOR);

        when(userRepository.findByEmail(doctor.getEmail())).thenReturn(Optional.of(doctor));

        assertThrows(ForbiddenOperationException.class,
                () -> patientProfileService.updateCurrentProfile(doctor.getEmail(), new UpdatePatientProfileRequest()));

        verify(patientRepository, never()).save(any(Patient.class));
        verify(userRepository, never()).save(any(User.class));
    }
}

