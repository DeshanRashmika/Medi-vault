package edu.icet.ecom.service;

import edu.icet.ecom.models.Inventory;
import edu.icet.ecom.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    @Transactional
    public Inventory addItem(Inventory item) {
        return inventoryRepository.save(item);
    }

    @Transactional
    public Inventory updateStockQuantity(Long itemId, int quantityUsed) {
        Inventory item = inventoryRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        if (item.getQuantityInStock() < quantityUsed) {
            throw new RuntimeException("Insufficient stock for item: " + item.getItemName());
        }

        item.setQuantityInStock(item.getQuantityInStock() - quantityUsed);
        return inventoryRepository.save(item);
    }

    public List<Inventory> getLowStockAlerts() {
        return inventoryRepository.findLowStockItems();
    }
}