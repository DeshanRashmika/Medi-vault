package edu.icet.ecom.service;

import edu.icet.ecom.models.Billing;
import edu.icet.ecom.models.Patient;
import edu.icet.ecom.repository.BillingRepository;
import edu.icet.ecom.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final BillingRepository billingRepository;
    private final PatientRepository patientRepository;

    @Transactional
    public Billing createBill(Long patientId, double amount) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        Billing bill = new Billing();
        bill.setPatient(patient);
        bill.setTotalAmount(amount);
        bill.setPaymentStatus("UNPAID");
        bill.setBillingDate(LocalDateTime.now());

        return billingRepository.save(bill);
    }

    @Transactional
    public Billing settleBill(Long billId) {
        Billing bill = billingRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        bill.setPaymentStatus("PAID");
        return billingRepository.save(bill);
    }
}