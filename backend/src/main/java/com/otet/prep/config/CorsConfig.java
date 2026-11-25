package com.otet.prep.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins:*}")
    private String allowedOrigins;

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        config.setAllowCredentials(true);
        if ("*".equals(allowedOrigins.trim())) {
            config.addAllowedOriginPattern("*");
            config.setAllowCredentials(false);
        } else {
            List<String> origins = Arrays.stream(allowedOrigins.split(","))
                    .map(String::trim)
                    .toList();
            for (String origin : origins) {
                if (origin.contains("*")) {
                    config.addAllowedOriginPattern(origin);
                } else {
                    config.addAllowedOrigin(origin);
                }
            }
        }
        
        config.addAllowedHeader("*");
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
