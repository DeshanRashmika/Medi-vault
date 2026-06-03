package edu.icet.ecom.repository;

import edu.icet.ecom.models.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {

    List<Staff> findBySpecialization(String specialization);

    Staff findByUserId(Long userId);
}
