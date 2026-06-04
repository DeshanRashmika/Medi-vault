package edu.icet.ecom.service;

import edu.icet.ecom.models.Patient;
import edu.icet.ecom.models.User;
import edu.icet.ecom.repository.PatientRepository;
import edu.icet.ecom.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    public PatientService(PatientRepository patientRepository, UserRepository userRepository) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Patient registerPatient(Patient patient, String username, String password) {
        User user = new User();
        user.setPassword(password);
        user.setRole(User.Role.PATIENT);
        User savedUser = userRepository.save(user);

        patient.setUser(savedUser);
        return patientRepository.save(patient);
    }

    @Transactional
    public Patient updateMedicalHistory(Long patientId, String newHistory) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        String updatedHistory = patient.getMedicalHistory() == null ? newHistory : patient.getMedicalHistory() + "\n" + newHistory;
        patient.setMedicalHistory(updatedHistory);

        return patientRepository.save(patient);
    }
}