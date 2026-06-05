package edu.icet.ecom.controller;

import edu.icet.ecom.models.Inventory;
import edu.icet.ecom.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<Inventory>> getAllItems() {
        return ResponseEntity.ok(inventoryService.getAllItems());
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<Inventory>> getLowStockAlerts() {
        return ResponseEntity.ok(inventoryService.getLowStockAlerts());
    }

    @PostMapping
    public ResponseEntity<Inventory> addItem(@RequestBody Inventory item) {
        return ResponseEntity.ok(inventoryService.addItem(item));
    }

    @PutMapping("/{id}/reduce")
    public ResponseEntity<Inventory> reduceStock(@PathVariable Long id, @RequestBody Map<String, Integer> payload) {
        return ResponseEntity.ok(inventoryService.updateStockQuantity(id, payload.get("quantityUsed")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        inventoryService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
}
