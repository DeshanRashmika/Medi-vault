package edu.icet.ecom.controller;

import edu.icet.ecom.models.Bed;
import edu.icet.ecom.service.BedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/beds")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class BedController {

    private final BedService bedService;

    @GetMapping
    public ResponseEntity<List<Bed>> getAllBeds() {
        return ResponseEntity.ok(bedService.getAllBeds());
    }

    @GetMapping("/available")
    public ResponseEntity<List<Bed>> getAvailableBeds() {
        return ResponseEntity.ok(bedService.getAvailableBeds());
    }

    @PostMapping
    public ResponseEntity<Bed> addBed(@RequestBody Bed bed) {
        return ResponseEntity.ok(bedService.addBed(bed));
    }

    @PostMapping("/{bedId}/assign/{patientId}")
    public ResponseEntity<Bed> assignBedToPatient(@PathVariable Long bedId, @PathVariable Long patientId) {
        return ResponseEntity.ok(bedService.assignBedToPatient(bedId, patientId));
    }

    @PostMapping("/{bedId}/release")
    public ResponseEntity<Bed> releaseBed(@PathVariable Long bedId) {
        return ResponseEntity.ok(bedService.releaseBed(bedId));
    }
}
