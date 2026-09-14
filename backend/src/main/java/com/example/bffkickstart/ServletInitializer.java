package com.example.bffkickstart;

import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletException;
import jakarta.servlet.SessionCookieConfig;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/**
 * Bootstraps the app when it's deployed as a WAR into a standalone servlet
 * container (Tomcat 10.1). Running embedded - {@code java -jar backend.war} or
 * the container image - never touches this: {@link BackendApplication#main} is
 * the entry point there, and {@code server.servlet.*} configures the embedded
 * container directly.
 */
public class ServletInitializer extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(BackendApplication.class);
    }

    @Override
    public void onStartup(ServletContext servletContext) throws ServletException {
        // server.servlet.session.cookie.* only configures Spring Boot's EMBEDDED
        // container. A standalone Tomcat ignores those properties and falls back
        // to JSESSIONID scoped to the WAR's context path - and since the SPA only
        // ever talks to its own sibling path (FRONTEND_BASE_PATH) through the
        // reverse proxy, never the backend's context path directly, a
        // context-path-scoped cookie is never sent back. The session is then lost
        // on every request, so /api/v1/me sees no OidcUser and Authentication is
        // null. Re-apply the same cookie config here, before super.onStartup()
        // bootstraps Spring, while SessionCookieConfig is still mutable. Keep in
        // sync with application.properties' server.servlet.session.cookie.*.
        SessionCookieConfig cookie = servletContext.getSessionCookieConfig();
        cookie.setName("BFFKICKSTARTSESSION");
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        // Read from the same env the embedded config binds
        // (SERVER_SERVLET_SESSION_COOKIE_SECURE=true in the deploy overlay).
        // Defaults false so a plain-HTTP standalone Tomcat can still round-trip
        // the cookie during local testing.
        cookie.setSecure(Boolean.parseBoolean(
                System.getenv().getOrDefault("SERVER_SERVLET_SESSION_COOKIE_SECURE", "false")));
        cookie.setAttribute("SameSite", "Lax"); // Servlet 6.0 / Tomcat 10.1
        // server.servlet.session.timeout is embedded-only too - mirror the 15m default.
        servletContext.setSessionTimeout(15);
        super.onStartup(servletContext);
    }
}
