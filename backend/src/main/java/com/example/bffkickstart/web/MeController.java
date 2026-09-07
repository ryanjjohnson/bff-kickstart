package com.example.bffkickstart.web;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.example.bffkickstart.dto.MeResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Backchannel logout (see SecurityConfig) pushes revocations to us as they happen, but it depends
 * on Keycloak reliably delivering that call - worth having, not worth trusting alone. This adds a
 * pull-based check: every /api/me call (page load, and the periodic poll the frontend runs)
 * additionally asks Keycloak directly, via RFC 7662 token introspection, whether the session's
 * access token is still active, and kills the local session immediately if Keycloak says no.
 */
@RestController
public class MeController {

    private static final Log logger = LogFactory.getLog(MeController.class);

    private final OAuth2AuthorizedClientService authorizedClientService;
    private final RestClient restClient;
    private final String introspectionUri;
    private final String clientId;
    private final String clientSecret;

    public MeController(OAuth2AuthorizedClientService authorizedClientService,
                         RestClient.Builder restClientBuilder,
                         @Value("${app.keycloak.introspection-uri}") String introspectionUri,
                         @Value("${spring.security.oauth2.client.registration.keycloak.client-id}") String clientId,
                         @Value("${spring.security.oauth2.client.registration.keycloak.client-secret}") String clientSecret) {
        this.authorizedClientService = authorizedClientService;
        this.restClient = restClientBuilder.build();
        this.introspectionUri = introspectionUri;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    @GetMapping("/api/v1/me")
    public Object me(Authentication authentication, HttpServletRequest request) {
        if (authentication == null || !(authentication.getPrincipal() instanceof OidcUser user)) {
            return Map.of("authenticated", false);
        }

        if (!isStillActiveInKeycloak(authentication)) {
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            return Map.of("authenticated", false);
        }

        // The ROLE_* authorities live on the Authentication (populated by our
        // GrantedAuthoritiesMapper in SecurityConfig), not on the OidcUser
        // principal itself - user.getAuthorities() would still be the raw,
        // unmapped set and always come back empty here.
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring("ROLE_".length()))
                .toList();

        // Address/phone attributes and realm_access (a separate claim from the
        // resource_access client roles above) aren't covered by OidcUser's standard
        // claim accessors, and OidcUser#getClaims() prefers the userinfo response
        // over the ID token when both are present - not guaranteed to echo back
        // every custom attribute mapper the same way the ID token does. Reading
        // the ID token's own claims directly sidesteps that, same reasoning as
        // KeycloakRealmRoleConverter's use of getIdToken().getClaims().
        Map<String, Object> idTokenClaims = user.getIdToken().getClaims();

        return MeResponse.builder()
                .authenticated(true)
                .username(user.getPreferredUsername())
                .firstName(user.getGivenName())
                .lastName(user.getFamilyName())
                .email(user.getEmail())
                .addressLine1((String) idTokenClaims.get("addressLine1"))
                .addressLine2((String) idTokenClaims.get("addressLine2"))
                .city((String) idTokenClaims.get("city"))
                .state((String) idTokenClaims.get("state"))
                .zip((String) idTokenClaims.get("zip"))
                .telephone((String) idTokenClaims.get("telephone"))
                .external(!hasRealmRole(idTokenClaims, "Internal User"))
                .roles(roles)
                .build();
    }

    private boolean hasRealmRole(Map<String, Object> idTokenClaims, String roleName) {
        Object realmAccess = idTokenClaims.get("realm_access");
        if (realmAccess instanceof Map<?, ?> realmAccessMap) {
            Object roles = realmAccessMap.get("roles");
            if (roles instanceof List<?> roleList) {
                return roleList.contains(roleName);
            }
        }
        return false;
    }

    /**
     * A transient failure to reach Keycloak (network blip, brief restart) fails open - it logs a
     * warning and treats the session as still active - rather than logging everyone out because
     * of an outage that has nothing to do with whether their session is actually valid. Only an
     * explicit {@code active: false} response ends the session.
     */
    private boolean isStillActiveInKeycloak(Authentication authentication) {
        OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient("keycloak", authentication.getName());
        if (client == null) {
            return true;
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("token", client.getAccessToken().getTokenValue());
        try {
            IntrospectionResponse response = restClient.post()
                    .uri(introspectionUri)
                    .headers(headers -> headers.setBasicAuth(clientId, clientSecret))
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(IntrospectionResponse.class);
            return response != null && response.active();
        } catch (Exception e) {
            logger.warn("Keycloak token introspection failed; treating session as still active", e);
            return true;
        }
    }

    /** RFC 7662 introspection response - only the one field we actually check. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    private record IntrospectionResponse(boolean active) {
    }
}
