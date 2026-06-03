package edu.icet.ecom.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "inventory")
@Data
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String itemName;

    private String itemType;
    private int quantityInStock;
    private double unitPrice;
    private int reorderLevel;
}