package edu.icet.ecom.controller;

import edu.icet.ecom.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/appointments")
    public ResponseEntity<Map<String, Object>> getAppointmentSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        Map<String, Object> report = reportService.getAppointmentSummaryReport(start, end);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/beds/occupancy")
    public ResponseEntity<Map<String, Object>> getBedOccupancyReport() {
        Map<String, Object> report = reportService.getBedOccupancyReport();
        return ResponseEntity.ok(report);
    }
}