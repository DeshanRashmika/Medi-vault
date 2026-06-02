package edu.icet.ecom.repository;

import edu.icet.ecom.models.Bed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {

    List<Bed> findByIsOccupied(boolean isOccupied);

    List<Bed> findByWardName(String wardName);
}
