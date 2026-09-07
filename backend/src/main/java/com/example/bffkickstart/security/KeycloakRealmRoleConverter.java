package com.example.bffkickstart.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.user.OidcUserAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Keycloak puts roles under {@code resource_access.<clientId>.roles} on the token,
 * scoped per-client rather than realm-wide (see {@code roles.client.bff-kickstart-client}
 * in the realm export - the client roles live there, not under {@code roles.realm}).
 * Spring Security's default OIDC/JWT authority mapping only knows
 * about "SCOPE_*"/"OIDC_USER" authorities, so this maps those client roles onto
 * ROLE_* authorities that @PreAuthorize / hasRole() understand - for both the session-login
 * path (ID token claims, via a GrantedAuthoritiesMapper) and the resource-server/Bearer-token
 * path (raw JWT claims, via a JwtAuthenticationConverter).
 */
public final class KeycloakRealmRoleConverter {

    private KeycloakRealmRoleConverter() {
    }

    public static Set<GrantedAuthority> extractResourceAccessRoles(Collection<? extends GrantedAuthority> authorities,
                                                                     String clientId) {
        Set<GrantedAuthority> mapped = new HashSet<>();
        for (GrantedAuthority authority : authorities) {
            mapped.add(authority);
            if (authority instanceof OidcUserAuthority oidcUserAuthority) {
                mapped.addAll(rolesFromClaims(oidcUserAuthority.getIdToken().getClaims(), clientId));
            }
        }
        return mapped;
    }

    public static Set<GrantedAuthority> extractJwtAuthorities(Jwt jwt, String clientId) {
        return rolesFromClaims(jwt.getClaims(), clientId);
    }

    private static Set<GrantedAuthority> rolesFromClaims(Map<String, Object> claims, String clientId) {
        Set<GrantedAuthority> roles = new HashSet<>();
        Object resourceAccess = claims.get("resource_access");
        if (resourceAccess instanceof Map<?, ?> resourceAccessMap) {
            Object clientEntry = resourceAccessMap.get(clientId);
            if (clientEntry instanceof Map<?, ?> clientMap) {
                Object clientRoles = clientMap.get("roles");
                if (clientRoles instanceof List<?> roleList) {
                    for (Object role : roleList) {
                        // No case transformation: role names are stored in Keycloak exactly as
                        // they should be granted/checked ("Admin", "Data Manager", ...) - every
                        // hasRole()/hasAnyRole() call must match this literal casing (and spacing)
                        // exactly, since GrantedAuthority equality is a plain case-sensitive
                        // String comparison.
                        roles.add(new SimpleGrantedAuthority("ROLE_" + role.toString()));
                    }
                }
            }
        }
        return roles;
    }
}
