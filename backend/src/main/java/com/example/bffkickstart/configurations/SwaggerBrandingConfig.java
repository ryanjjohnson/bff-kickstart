package com.example.bffkickstart.configurations;

import jakarta.servlet.http.HttpServletRequest;
import org.springdoc.core.properties.SwaggerUiConfigProperties;
import org.springdoc.core.properties.SwaggerUiOAuthProperties;
import org.springdoc.core.providers.ObjectMapperProvider;
import org.springdoc.webmvc.ui.SwaggerIndexPageTransformer;
import org.springdoc.webmvc.ui.SwaggerIndexTransformer;
import org.springdoc.webmvc.ui.SwaggerWelcomeCommon;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.util.StreamUtils;
import org.springframework.web.servlet.resource.ResourceTransformerChain;
import org.springframework.web.servlet.resource.TransformedResource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Swagger UI is Apache-2.0 licensed (org.webjars:swagger-ui) - restyling its header for an
 * internal tool is a license non-issue, not something that needs a real answer beyond "yes".
 * <p>
 * springdoc's {@code indexPageTransformer} bean is {@code @ConditionalOnMissingBean}, so
 * supplying our own here replaces springdoc's default outright - this is the documented
 * extension point for customizing the served swagger-ui index page (there's no
 * {@code springdoc.swagger-ui.custom-css} property in this springdoc version to reach for
 * instead). We delegate to springdoc's own transformer first (for the URL/CSRF/config
 * injection it already does) and only then splice our own branding in, so a springdoc
 * version bump doesn't require touching this again unless the index page's structure changes.
 * <p>
 * The branding itself lives under {@code src/main/resources/swagger/} - {@code branding.css}
 * and {@code branding-header.html} - not in Java string literals; this class only loads those
 * files and splices them in at the right anchors.
 * <p>
 * Gated behind the same {@code springdoc.swagger-ui.enabled} property springdoc itself uses -
 * when it's {@code false}, springdoc never registers {@link SwaggerUiConfigProperties} either,
 * so an unconditional {@code @Bean} here would fail to start the whole app looking for a
 * dependency that was never going to exist.
 */
@Configuration
public class SwaggerBrandingConfig {

    private static final String PAGE_TITLE = "BFF Kickstart - API Docs";

    @Bean
    @ConditionalOnProperty(name = "springdoc.swagger-ui.enabled", havingValue = "true")
    public SwaggerIndexTransformer swaggerIndexTransformer(SwaggerUiConfigProperties swaggerUiConfig,
                                                             SwaggerUiOAuthProperties swaggerUiOAuthProperties,
                                                             SwaggerWelcomeCommon swaggerWelcomeCommon,
                                                             ObjectMapperProvider objectMapperProvider) throws IOException {
        String logoDataUri = loadLogoAsDataUri();
        String styleBlock = "<style>\n" + loadResource("swagger/branding.css") + "</style>\n";
        String headerBlock = loadResource("swagger/branding-header.html").replace("{{logo}}", logoDataUri);
        SwaggerIndexPageTransformer delegate =
                new SwaggerIndexPageTransformer(swaggerUiConfig, swaggerUiOAuthProperties, swaggerWelcomeCommon, objectMapperProvider);
        return new GizmoBrandedSwaggerIndexTransformer(delegate, styleBlock, headerBlock, logoDataUri);
    }

    private static String loadResource(String path) throws IOException {
        try (InputStream in = new ClassPathResource(path).getInputStream()) {
            return StreamUtils.copyToString(in, StandardCharsets.UTF_8);
        }
    }

    private static String loadLogoAsDataUri() throws IOException {
        try (InputStream in = new ClassPathResource("images/gizmo-logo.png").getInputStream()) {
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(StreamUtils.copyToByteArray(in));
        }
    }

    /**
     * Only the actual index.html gets touched - every other resource under /swagger-ui/**
     * (JS, CSS, the favicon PNGs) is binary or must round-trip byte-for-byte, so it's returned
     * exactly as springdoc's own transformer produced it.
     */
    private record GizmoBrandedSwaggerIndexTransformer(SwaggerIndexPageTransformer delegate,
                                                         String styleBlock,
                                                         String headerBlock,
                                                         String logoDataUri) implements SwaggerIndexTransformer {

        @Override
        public Resource transform(HttpServletRequest request, Resource resource, ResourceTransformerChain transformerChain)
                throws IOException {
            Resource transformed = delegate.transform(request, resource, transformerChain);
            if (!"index.html".equals(resource.getFilename())) {
                return transformed;
            }
            String html = StreamUtils.copyToString(transformed.getInputStream(), StandardCharsets.UTF_8);
            String branded = brand(html);
            return new TransformedResource(resource, branded.getBytes(StandardCharsets.UTF_8));
        }

        private String brand(String html) {
            return html
                    .replace("</head>", styleBlock + "</head>")
                    .replace("<div id=\"swagger-ui\"></div>", headerBlock + "<div id=\"swagger-ui\"></div>")
                    .replace("<title>Swagger UI</title>", "<title>" + PAGE_TITLE + "</title>")
                    .replace("href=\"./favicon-32x32.png\"", "href=\"" + logoDataUri + "\"")
                    .replace("href=\"./favicon-16x16.png\"", "href=\"" + logoDataUri + "\"");
        }
    }
}
