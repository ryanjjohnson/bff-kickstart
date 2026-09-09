package com.example.bffkickstart.configurations;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.bffkickstart.exceptions.ApiError;
import com.example.bffkickstart.security.CsrfCookieFilter;
import com.example.bffkickstart.security.KeycloakRealmRoleConverter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.configurers.oauth2.client.OidcBackChannelLogoutHandler;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.oauth2.client.oidc.session.InMemoryOidcSessionRegistry;
import org.springframework.security.oauth2.client.oidc.session.OidcSessionRegistry;
import org.springframework.security.oauth2.client.oidc.web.logout.OidcClientInitiatedLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.keycloak.client-id}")
    private String keycloakClientId;

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Value("${app.frontend-base-path}")
    private String frontendBasePath;

    @Value("${server.servlet.session.cookie.name}")
    private String sessionCookieName;

    // Gates OAuth2 Resource Server support (Bearer JWT / client_credentials API clients) on
    // /api/**, alongside the always-on session-based oauth2Login BFF flow above. Off by default
    // so existing deployments that only ever serve their own frontend see no behavior change.
    @Value("${app.api-exposed}")
    private boolean apiExposed;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, ClientRegistrationRepository clientRegistrationRepository,
                                                     OidcSessionRegistry oidcSessionRegistry, ObjectMapper objectMapper) throws Exception {
        CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();
        // BREACH-safe deferred CSRF token loading, still readable client-side via the XSRF-TOKEN cookie.
        csrfHandler.setCsrfRequestAttributeName(null);

        // Without an explicit path, this cookie defaults to server.servlet.context-path
        // (BACKEND_BASE_PATH, e.g. "/bff-kickstart-api") - since the SPA is served from a
        // sibling path (FRONTEND_BASE_PATH, e.g. "/bff-kickstart"), document.cookie on the
        // SPA's own pages would never see it, so axios could never mirror it into the
        // X-XSRF-TOKEN header and every mutating request would 403. "/" makes it visible
        // (and sent) regardless of which of the two paths the browser is currently on.
        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookiePath("/");

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> {
                    csrf.csrfTokenRepository(csrfTokenRepository)
                            .csrfTokenRequestHandler(csrfHandler)
                            // Keycloak calls this directly, server-to-server, with no session/cookie -
                            // there is no CSRF token to present, and none is needed for a signed JWT body.
                            .ignoringRequestMatchers("/logout/connect/back-channel/*");
                    if (apiExposed) {
                        // A Bearer token can't be silently attached by a browser the way a cookie
                        // can, so client_credentials API callers have nothing CSRF is meant to
                        // guard against - and no session/cookie of their own to carry a token in.
                        //
                        // Must check for the "Bearer " scheme specifically, not just header
                        // presence: checking presence alone let a request carrying a session
                        // cookie plus ANY non-Bearer Authorization header (e.g. "Basic ...", of
                        // any value - it's never validated) skip CSRF entirely, then authenticate
                        // via the session anyway, since BearerTokenAuthenticationFilter only
                        // engages for a "Bearer " prefix and silently no-ops otherwise - a real,
                        // confirmed CSRF bypass on every mutating endpoint once API_EXPOSED=true.
                        // A genuine "Bearer <garbage>" is safe to exempt: BearerTokenAuthenticationFilter
                        // rejects it outright (401) rather than falling back to the session.
                        csrf.ignoringRequestMatchers(request -> {
                            String header = request.getHeader("Authorization");
                            return header != null && header.regionMatches(true, 0, "Bearer ", 0, 7);
                        });
                    }
                })
                .addFilterAfter(new CsrfCookieFilter(), org.springframework.security.web.authentication.www.BasicAuthenticationFilter.class)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/actuator/health", "/actuator/health/**", "/api/v1/me").permitAll()
                        // API Developer gates *access to the docs*, nothing more - it's orthogonal
                        // to the CRUD roles (Admin/Inspector/Viewer/Data Manager), which still
                        // decide what a call from Swagger's own "Try it out" is allowed to do via
                        // each controller's existing @PreAuthorize. API Owner picks this role up
                        // for free as part of its composite in the realm export, so an API Owner
                        // can always reach Swagger too.
                        .requestMatchers("/v3/api-docs", "/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**")
                        .hasRole("API Developer")
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll())
                .exceptionHandling(ex -> ex
                        // Plain HttpStatusEntryPoint (or Spring's default AccessDeniedHandler for
                        // the 403 case) writes little to no response body, which is how the
                        // frontend ended up showing "Request failed with status code 401" instead
                        // of anything the user could act on. Both write the same ApiError JSON
                        // shape GlobalExceptionHandler uses elsewhere, so the frontend's existing
                        // `err.message` handling picks them up for free.
                        .defaultAuthenticationEntryPointFor(
                                jsonAuthenticationEntryPoint(objectMapper),
                                PathPatternRequestMatcher.withDefaults().matcher("/api/**"))
                        .defaultAccessDeniedHandlerFor(
                                jsonAccessDeniedHandler(objectMapper),
                                PathPatternRequestMatcher.withDefaults().matcher("/api/**")))
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userAuthoritiesMapper(grantedAuthoritiesMapper()))
                        // Without this, the OidcSessionRegistry bean below is never actually
                        // populated at login time - declaring it as a @Bean is not enough on its
                        // own, this call is what wires an OidcSessionRegistryAuthenticationStrategy
                        // into the login flow. Skipping it means .oidcLogout().backChannel() below
                        // has no session recorded to match a logout token against, so back-channel
                        // logout silently no-ops (Keycloak still gets its 200 OK either way, per
                        // spec, regardless of whether anything was actually found to log out).
                        .oidcSessionRegistry(oidcSessionRegistry)
                        // A plain response.sendRedirect bypasses Spring's default RedirectStrategy,
                        // which (surprisingly) prepends server.servlet.context-path to any relative
                        // URL passed to .defaultSuccessUrl() - that would turn "/bff-kickstart/"
                        // into "/bff-kickstart-api/bff-kickstart/". There's no saved request worth
                        // preserving instead: unauthenticated /api/** calls get a plain 401, not a
                        // redirect-to-login, so the only way into this flow is the frontend's own
                        // "sign in" link, never a bounce-through of some other deep link.
                        .successHandler((request, response, authentication) ->
                                response.sendRedirect(frontendBasePath + "/")))
                .logout(logout -> logout
                        .logoutSuccessHandler(oidcLogoutSuccessHandler(clientRegistrationRepository)))
                // Lets Keycloak kill our local session server-to-server (e.g. admin-forced
                // logout, or logout from another app sharing the same Keycloak SSO session)
                // even when the browser never calls /logout itself. Requires the client's
                // "Backchannel Logout" settings in the realm export to point back at this app.
                //
                // A custom handler is required, not Customizer.withDefaults(): to actually
                // invalidate the target session, Spring makes an internal self-request carrying
                // "Cookie: JSESSIONID=<id>" - that's hardcoded as the default and never matches
                // our renamed session cookie (server.servlet.session.cookie.name=DEPKICKSTARTSESSION
                // below), so the self-request would land on a fresh anonymous session instead of
                // the one Keycloak is telling us to kill, leaving it alive despite Keycloak logging
                // "logout success: true".
                .oidcLogout(oidc -> oidc.backChannel(backChannel ->
                        backChannel.logoutHandler(oidcBackChannelLogoutHandler(oidcSessionRegistry))));

        if (apiExposed) {
            // Coexists with oauth2Login above in this same filter chain: BearerTokenAuthenticationFilter
            // only engages when a request actually carries "Authorization: Bearer ..." - anything else
            // (including the browser's own session-cookie requests) falls through to the session-based
            // auth already established above, untouched. Standard Spring Security pattern for a backend
            // that's simultaneously an OAuth2 Client (BFF) and a Resource Server.
            http.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));
        }

        return http.build();
    }

    @Bean
    public OidcSessionRegistry oidcSessionRegistry() {
        return new InMemoryOidcSessionRegistry();
    }

    private AuthenticationEntryPoint jsonAuthenticationEntryPoint(ObjectMapper objectMapper) {
        return (request, response, ex) -> writeApiError(response, objectMapper, HttpStatus.UNAUTHORIZED,
                "Your session has expired. Sign in again to continue.", request.getRequestURI());
    }

    private AccessDeniedHandler jsonAccessDeniedHandler(ObjectMapper objectMapper) {
        return (request, response, ex) -> writeApiError(response, objectMapper, HttpStatus.FORBIDDEN,
                "You don't have permission to do that.", request.getRequestURI());
    }

    private void writeApiError(HttpServletResponse response, ObjectMapper objectMapper,
                                HttpStatus status, String message, String path) throws IOException {
        ApiError error = ApiError.builder()
                .timestamp(Instant.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(path)
                .build();
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), error);
    }

    private LogoutHandler oidcBackChannelLogoutHandler(OidcSessionRegistry registry) {
        OidcBackChannelLogoutHandler handler = new OidcBackChannelLogoutHandler(registry);
        handler.setSessionCookieName(sessionCookieName);
        return handler;
    }

    private GrantedAuthoritiesMapper grantedAuthoritiesMapper() {
        return authorities -> KeycloakRealmRoleConverter.extractResourceAccessRoles(authorities, keycloakClientId);
    }

    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        // Replaces the default "scope"/"scp" claim-based authorities converter - this app doesn't
        // use OAuth2 scopes, only Keycloak client roles, in the same resource_access.<clientId>.roles
        // shape the session-login path already understands (KeycloakRealmRoleConverter).
        converter.setJwtGrantedAuthoritiesConverter(jwt -> KeycloakRealmRoleConverter.extractJwtAuthorities(jwt, keycloakClientId));
        return converter;
    }

    private OidcClientInitiatedLogoutSuccessHandler oidcLogoutSuccessHandler(ClientRegistrationRepository repo) {
        OidcClientInitiatedLogoutSuccessHandler handler = new OidcClientInitiatedLogoutSuccessHandler(repo);
        // {baseScheme}/{baseHost}/{basePort} deliberately skip server.servlet.context-path
        // (unlike {baseUrl}, which includes it) so this lands on the frontend SPA's own
        // path, not the backend API's. Must match a registered post.logout.redirect.uris
        // entry in the realm export exactly.
        //
        // The trailing slash is required, not cosmetic: nginx's prod config serves the SPA
        // from a same-named directory (frontend/nginx.conf.template's ${FRONTEND_BASE_PATH}/
        // location), and a request for that path WITHOUT the slash never reaches that
        // location block at all - nginx falls through to its own static-directory handling,
        // which finds the directory and 301s to add the slash itself. That auto-redirect
        // reconstructs the URL from nginx's own listening port (80 inside the container),
        // not the Host header's port (3000 as published on the host), silently dropping it
        // and leaving the browser on a dead http://localhost/... URL. Sending the slash
        // ourselves means the request matches the real location block on the first try, so
        // nginx never gets a chance to "helpfully" rewrite the URL.
        handler.setPostLogoutRedirectUri("{baseScheme}://{baseHost}{basePort}" + frontendBasePath + "/");
        return handler;
    }

    private CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
