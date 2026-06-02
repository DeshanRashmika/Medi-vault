package edu.icet.ecom.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "beds")
public class Bed {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String bedNumber;
    private String wardName;
    private boolean isOccupied = false;

    @OneToOne
    @JoinColumn(name = "current_patient_id")
    private Patient currentPatient;
}
