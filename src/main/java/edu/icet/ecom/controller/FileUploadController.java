package edu.icet.ecom.controller;

import edu.icet.ecom.models.MedicalRecord;
import edu.icet.ecom.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RequiredArgsConstructor
@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/Upload")
public class FileUploadController {
    private final FileStorageService fileStorageService;
    @PostMapping("/upload-secure")
    public ResponseEntity<?> uploadMedicalFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("patientId") Long patientId) {

        String fileName = fileStorageService.storeFile(file);

        MedicalRecord record = new MedicalRecord();
        record.setTitle(title);
        record.setFileUrl("/uploads/" + fileName);

        return ResponseEntity.ok("File uploaded successfully: " + fileName);
    }
}
