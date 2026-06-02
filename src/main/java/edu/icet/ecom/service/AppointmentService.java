package edu.icet.ecom.service;

import edu.icet.ecom.models.Appointment;
import edu.icet.ecom.models.Patient;
import edu.icet.ecom.models.Staff;
import edu.icet.ecom.repository.AppointmentRepository;
import edu.icet.ecom.repository.PatientRepository;
import edu.icet.ecom.repository.StaffRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {
    private final AppointmentRepository appointmentRepository;
    private PatientRepository patientRepository;
    private final PatientService patientService;
    private final staffService staffService;
    private final billingService billingService;
    public AppointmentService(AppointmentRepository appointmentRepository,
                              PatientRepository patientRepository,
                              StaffRepository staffRepository, PatientService patientService, staffService staffService, billingService billingService) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.patientService = patientService;
        this.staffService = staffService;
        this.billingService = billingService;
    }
    @Transactional
    public Appointment bookAppointment(Long patientId, Long doctorId, LocalDateTime dateTime) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + patientId));

        Staff doctor = staffRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found with ID: " + doctorId));

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDateTime(dateTime);
        appointment.setStatus("BOOKED");

        return appointmentRepository.save(appointment);
    }
    @Transactional
    public Appointment cancelAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + appointmentId));

        appointment.setStatus("CANCELED");
        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getAppointmentsByDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

}
