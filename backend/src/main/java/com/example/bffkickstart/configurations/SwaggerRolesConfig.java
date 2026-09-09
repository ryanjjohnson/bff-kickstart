package com.example.bffkickstart.configurations;

import io.swagger.v3.oas.models.Operation;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.method.HandlerMethod;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Surfaces each endpoint's required role(s) in the generated OpenAPI docs by reading the
 * {@code @PreAuthorize} annotations the controllers already carry - the same annotations that
 * actually enforce access, so the docs can't drift from the enforcement. No extra annotations
 * on the controllers, no duplicated role lists.
 * <p>
 * springdoc picks up every {@link OperationCustomizer} bean automatically and runs it once per
 * operation. Method-level {@code @PreAuthorize} wins over class-level, matching Spring
 * Security's own override semantics. The roles are appended to the operation description as a
 * bold "Requires role:" line (descriptions render as Markdown in Swagger UI).
 * <p>
 * The role names are pulled from the SpEL expression's quoted literals, which covers the
 * {@code hasRole}/{@code hasAnyRole} expressions this app uses. An expression with no quoted
 * literals (e.g. {@code isAuthenticated()}) just gets no line - never a wrong one. Note that
 * "API Owner" appears in no expression but satisfies all of them: it's a composite role that
 * expands to every CRUD role at token issuance (see the realm export).
 */
@Configuration
public class SwaggerRolesConfig {

    private static final Pattern QUOTED_LITERAL = Pattern.compile("'([^']+)'");

    @Bean
    @ConditionalOnProperty(name = "springdoc.api-docs.enabled", havingValue = "true")
    public OperationCustomizer requiredRolesCustomizer() {
        return (Operation operation, HandlerMethod handlerMethod) -> {
            PreAuthorize preAuthorize = handlerMethod.getMethodAnnotation(PreAuthorize.class);
            if (preAuthorize == null) {
                preAuthorize = AnnotationUtils.findAnnotation(handlerMethod.getBeanType(), PreAuthorize.class);
            }
            if (preAuthorize == null) {
                return operation;
            }
            List<String> roles = QUOTED_LITERAL.matcher(preAuthorize.value()).results()
                    .map(match -> match.group(1))
                    .toList();
            if (roles.isEmpty()) {
                return operation;
            }
            String line = "**Requires role:** " + String.join(" or ", roles);
            String description = operation.getDescription();
            operation.setDescription(description == null || description.isBlank()
                    ? line
                    : description + "\n\n" + line);
            return operation;
        };
    }
}
