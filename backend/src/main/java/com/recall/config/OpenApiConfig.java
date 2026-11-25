package com.recall.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenApiConfig
 * 
 * Configures OpenAPI 3.0 / Swagger UI documentation for ReCall.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI recallOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ReCall by sunil4224 API")
                        .description("Indexed Personal Developer Memory Logs & Knowledge Engine")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("sunil4224")
                                .url("https://github.com/sunil4224"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")));
    }
}
