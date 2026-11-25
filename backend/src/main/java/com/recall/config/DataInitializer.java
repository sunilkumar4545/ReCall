package com.recall.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * DataInitializer
 * 
 * Schema and tables are created and maintained via Flyway migrations.
 * Automatic insertion/seeding of records on application restart is disabled:
 * Records are created solely by user actions via the UI / API.
 */
@Slf4j
@Component
public class DataInitializer implements CommandLineRunner {

    @Override
    public void run(String... args) {
        log.info("Application started. Database tables verified via Flyway. Automatic record seeding is disabled.");
    }
}
