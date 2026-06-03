package edu.icet.ecom.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class ReportService {
    public Map<String, Object> getAppointmentSummaryReport(LocalDateTime start, LocalDateTime end) {
        return Map.of(
                "totalAppointments", 100,
                "completedAppointments", 80,
                "pendingAppointments", 20
        );
    }

    public Map<String, Object> getBedOccupancyReport()
    {
        return Map.of(
                "totalBeds", 50,
                "occupiedBeds", 35,
                "availableBeds", 15
        );
    }
}
