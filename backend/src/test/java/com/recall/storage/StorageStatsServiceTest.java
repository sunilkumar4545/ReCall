package com.recall.storage;

import com.recall.dto.response.StorageStatsResponse;
import com.recall.service.StorageStatsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class StorageStatsServiceTest {

    @Autowired
    private StorageStatsService storageStatsService;

    @Test
    public void testLiveStorageStatsCalculation() {
        StorageStatsResponse stats = storageStatsService.getStorageStats();
        assertNotNull(stats);
        assertNotNull(stats.getNeon());
        assertNotNull(stats.getBackblaze());

        System.out.println("=== LIVE STORAGE TELEMETRY ===");
        System.out.println("Neon Used: " + stats.getNeon().getUsedFormatted() + " / " + stats.getNeon().getLimitFormatted());
        System.out.println("Neon Free: " + stats.getNeon().getFreeFormatted());
        System.out.println("Neon Entries: " + stats.getNeon().getTotalEntries());
        System.out.println("B2 Used: " + stats.getBackblaze().getUsedFormatted() + " / " + stats.getBackblaze().getLimitFormatted());
        System.out.println("B2 Free: " + stats.getBackblaze().getFreeFormatted());
        System.out.println("B2 Savings: -" + stats.getBackblaze().getSavingsPercentage() + "%");
        System.out.println("B2 Blobs: " + stats.getBackblaze().getTotalBlobs());
        System.out.println("==============================");

        assertTrue(stats.getNeon().getUsedBytes() >= 0);
        assertTrue(stats.getBackblaze().getLimitBytes() > 0);
    }
}
