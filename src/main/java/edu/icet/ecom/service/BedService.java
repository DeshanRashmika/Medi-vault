package edu.icet.ecom.service;

import edu.icet.ecom.models.Bed;
import edu.icet.ecom.models.Patient;
import edu.icet.ecom.repository.BedRepository;
import edu.icet.ecom.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BedService {

    private final BedRepository bedRepository;
    private final PatientRepository patientRepository;

    @Transactional
    public Bed assignBedToPatient(Long bedId, Long patientId) {
        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new RuntimeException("Bed not found"));

        if (bed.isOccupied()) {
            throw new RuntimeException("Bed is already occupied!");
        }

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        bed.setCurrentPatient(patient);
        bed.setOccupied(true);
        return bedRepository.save(bed);
    }

    @Transactional
    public Bed releaseBed(Long bedId) {
        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new RuntimeException("Bed not found"));

        bed.setCurrentPatient(null);
        bed.setOccupied(false);
        return bedRepository.save(bed);
    }

    public List<Bed> getAvailableBeds() {
        return bedRepository.findByIsOccupied(false);
    }
}