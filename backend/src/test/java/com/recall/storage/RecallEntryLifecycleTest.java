package com.recall.storage;

import com.recall.dto.request.CreateEntryRequest;
import com.recall.dto.response.RecallEntryResponse;
import com.recall.service.RecallEntryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class RecallEntryLifecycleTest {

    @Autowired
    private RecallEntryService recallEntryService;

    @Test
    public void testCreateAndDeleteEntry() {
        CreateEntryRequest request = new CreateEntryRequest();
        request.setCategorySlug("java");
        request.setTitle("JUnit Test Deletion Entry");
        request.setSummary("Temporary entry for testing deletion logic");
        request.setExplanation("Testing explanation text for claim check");
        request.setCodeLanguage("java");
        request.setCodeSnippet("System.out.println(\"test\");");

        // 1. Create
        RecallEntryResponse created = recallEntryService.createEntry(request);
        assertNotNull(created);
        assertNotNull(created.getId());
        Long entryId = created.getId();
        System.out.println("Created test entry with ID: " + entryId + ", contentKey: " + created.getContentKey());

        // 2. Delete
        assertDoesNotThrow(() -> {
            recallEntryService.deleteEntry(entryId);
        });
        System.out.println("Successfully deleted test entry with ID: " + entryId);

        // 3. Verify deletion
        assertThrows(Exception.class, () -> {
            recallEntryService.getEntryById(entryId);
        });
        System.out.println("Verified entry is removed from database.");
    }
}
