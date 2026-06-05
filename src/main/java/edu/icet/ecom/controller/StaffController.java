package edu.icet.ecom.controller;

import edu.icet.ecom.models.Staff;
import edu.icet.ecom.models.User;
import edu.icet.ecom.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    @GetMapping
    public ResponseEntity<List<Staff>> getAllStaff() {
        return ResponseEntity.ok(staffService.getAllStaff());
    }

    @PostMapping
    public ResponseEntity<Staff> addStaff(@RequestBody Map<String, Object> payload) {
        // Extract staff and user details
        Staff staff = new Staff();
        staff.setFullName((String) payload.get("fullName"));
        staff.setSpecialization((String) payload.get("specialization"));
        staff.setContactNumber((String) payload.get("contactNumber"));
        staff.setSalary(Double.parseDouble(payload.get("salary").toString()));
        staff.setScheduleDetails((String) payload.get("scheduleDetails"));

        String email = (String) payload.get("email");
        String password = (String) payload.get("password");
        User.Role role = User.Role.valueOf((String) payload.get("role"));

        return ResponseEntity.ok(staffService.addStaffMember(staff, email, password, role));
    }

    @PutMapping("/{id}/schedule")
    public ResponseEntity<Staff> updateSchedule(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(staffService.updateSchedule(id, payload.get("schedule")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        staffService.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }
}
