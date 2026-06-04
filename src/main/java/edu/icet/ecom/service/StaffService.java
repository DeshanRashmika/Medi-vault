package edu.icet.ecom.service;

import edu.icet.ecom.models.Staff;
import edu.icet.ecom.models.User;
import edu.icet.ecom.repository.StaffRepository;
import edu.icet.ecom.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StaffService {

    private final StaffRepository staffRepository;
    private final UserRepository userRepository;

    public StaffService(StaffRepository staffRepository, UserRepository userRepository) {
        this.staffRepository = staffRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Staff addStaffMember(Staff staff, String email, String password, User.Role role) {
        User user = new User();
        user.setEmail(email);
        user.setFullName(staff.getFullName());
        user.setPassword(password);
        user.setRole(role);
        User savedUser = userRepository.save(user);

        staff.setUser(savedUser);
        return staffRepository.save(staff);
    }

    @Transactional
    public Staff updateSchedule(Long staffId, String newSchedule) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff member not found"));
        staff.setScheduleDetails(newSchedule);
        return staffRepository.save(staff);
    }

    public List<Staff> getDoctorsBySpecialization(String specialization) {
        return staffRepository.findBySpecialization(specialization);
    }

    public List<Staff> getAllStaff() {
        return staffRepository.findAll();
    }

    @Transactional
    public void deleteStaff(Long id) {
        staffRepository.deleteById(id);
    }
}