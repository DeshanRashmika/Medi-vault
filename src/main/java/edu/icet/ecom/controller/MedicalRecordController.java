package edu.icet.ecom.controller;

import edu.icet.ecom.models.MedicalRecord;
import edu.icet.ecom.service.MedicalRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/records")
@CrossOrigin(origins = "http://localhost:4200")
public class MedicalRecordController {

    @Autowired
    private MedicalRecordService recordService;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalRecord>> getPatientRecords(@PathVariable Long patientId) {
        return ResponseEntity.ok(recordService.getRecordsByPatientId(patientId));
    }

    @PostMapping("/upload")
    public ResponseEntity<MedicalRecord> uploadRecord(@RequestBody MedicalRecord record) {
        MedicalRecord savedRecord = recordService.uploadSecureRecord(record);
        return ResponseEntity.status(201).body(savedRecord);
    }

    @GetMapping("/view-as-doctor")
    public ResponseEntity<?> viewAsDoctor(@RequestParam Long patientId, @RequestParam Long doctorId) {
        try {
            return ResponseEntity.ok(recordService.getRecordsForDoctor(patientId, doctorId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }
}