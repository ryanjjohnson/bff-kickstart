package com.example.keycloak.registration;

import jakarta.ws.rs.core.MultivaluedMap;
import org.keycloak.Config;
import org.keycloak.authentication.FormAction;
import org.keycloak.authentication.FormActionFactory;
import org.keycloak.authentication.FormContext;
import org.keycloak.authentication.ValidationContext;
import org.keycloak.events.Details;
import org.keycloak.events.Errors;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.ModelDuplicateException;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.FormMessage;
import org.keycloak.provider.ProviderConfigProperty;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Replaces the built-in "registration-user-creation" step in the registration
 * flow. Users never choose their own username: it is generated server-side as
 * {@code lastname_fm_#} (lastname, first+middle initials, next free sequence
 * number), stored both as the Keycloak username and as the "gizmo_username"
 * user attribute. Also enforces this app's required registration fields.
 */
public class BffRegistrationUserCreation implements FormAction, FormActionFactory {

    public static final String PROVIDER_ID = "bff-registration-user-creation";

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private static final Requirement[] REQUIREMENT_CHOICES = {Requirement.REQUIRED};

    // ---------------------------------------------------------------- FormAction

    @Override
    public void validate(ValidationContext context) {
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();
        List<FormMessage> errors = new ArrayList<>();

        String email = trim(formData.getFirst("email"));
        String firstName = trim(formData.getFirst("firstName"));
        String lastName = trim(formData.getFirst("lastName"));

        if (isBlank(firstName)) {
            errors.add(new FormMessage("firstName", "missingFirstNameMessage"));
        }
        if (isBlank(lastName)) {
            errors.add(new FormMessage("lastName", "missingLastNameMessage"));
        }
        if (isBlank(email)) {
            errors.add(new FormMessage("email", "missingEmailMessage"));
        } else if (!EMAIL_PATTERN.matcher(email).matches()) {
            errors.add(new FormMessage("email", "invalidEmailMessage"));
        } else if (context.getSession().users().getUserByEmail(context.getRealm(), email) != null) {
            errors.add(new FormMessage("email", "emailExistsMessage"));
        }

        requireField(formData, errors, "addressLine1", "missingAddress1Message");
        requireField(formData, errors, "city", "missingCityMessage");
        requireField(formData, errors, "state", "missingStateMessage");
        requireField(formData, errors, "zip", "missingZipMessage");
        requireField(formData, errors, "telephone", "missingPhoneMessage");
        requireField(formData, errors, "securityQuestion", "missingSecurityQuestionMessage");
        requireField(formData, errors, "securityAnswer", "missingSecurityAnswerMessage");

        if (!errors.isEmpty()) {
            context.error(Errors.INVALID_REGISTRATION);
            context.validationError(formData, errors);
            return;
        }

        context.success();
    }

    @Override
    public void success(FormContext context) {
        KeycloakSession session = context.getSession();
        RealmModel realm = context.getRealm();
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();

        String email = trim(formData.getFirst("email"));
        String firstName = trim(formData.getFirst("firstName"));
        String middleName = trim(formData.getFirst("middleName"));
        String lastName = trim(formData.getFirst("lastName"));

        UserModel user = null;
        String username = null;
        for (int attempt = 0; attempt < 5 && user == null; attempt++) {
            username = nextUsername(session, realm, firstName, middleName, lastName, attempt);
            try {
                user = session.users().addUser(realm, username);
            } catch (ModelDuplicateException raceLoser) {
                user = null;
            }
        }
        if (user == null) {
            throw new IllegalStateException("Unable to allocate a unique username for " + lastName);
        }

        user.setEnabled(true);
        user.setEmail(email);
        user.setEmailVerified(false);
        user.setFirstName(firstName);
        user.setLastName(lastName);

        user.setSingleAttribute("gizmo_username", username);
        if (!isBlank(middleName)) {
            user.setSingleAttribute("middleName", middleName);
        }
        setAttr(user, formData, "addressLine1");
        setAttr(user, formData, "addressLine2");
        setAttr(user, formData, "city");
        setAttr(user, formData, "state");
        setAttr(user, formData, "zip");
        setAttr(user, formData, "telephone");
        setAttr(user, formData, "securityQuestion");

        String securityAnswer = trim(formData.getFirst("securityAnswer"));
        if (!isBlank(securityAnswer)) {
            // Store only a one-way hash of the recovery answer, never the plaintext.
            // Written under the same "securityAnswer" attribute the User Profile config
            // declares (rather than a separate *Hash attribute) so Keycloak's own
            // profile-completeness check (VERIFY_PROFILE) sees the required field as
            // populated instead of nagging every new user to re-enter it.
            user.setSingleAttribute("securityAnswer", sha256(securityAnswer.toLowerCase(Locale.ROOT)));
        }

        context.getEvent().user(user);
        context.getEvent().detail(Details.USERNAME, username);
        context.getEvent().detail(Details.EMAIL, email);
        context.getEvent().detail(Details.REGISTER_METHOD, "form");

        context.setUser(user);
    }

    /**
     * lastname_fm_# where f/m are the first-name and middle-name initials
     * (middle omitted if not supplied) and # is the next free sequence
     * number for that lastname+initials combination. {@code attempt} biases
     * the starting search point so a concurrent-creation retry doesn't just
     * collide again immediately.
     */
    private String nextUsername(KeycloakSession session, RealmModel realm, String firstName, String middleName,
                                 String lastName, int attempt) {
        String normalizedLast = normalize(lastName);
        if (normalizedLast.isEmpty()) {
            normalizedLast = "user";
        }
        String initials = firstInitial(firstName) + firstInitial(middleName);
        String base = normalizedLast + "_" + initials;

        int n = 1 + attempt;
        String candidate;
        do {
            candidate = base + "_" + n;
            n++;
        } while (session.users().getUserByUsername(realm, candidate) != null);
        return candidate;
    }

    private static String firstInitial(String s) {
        if (isBlank(s)) {
            return "";
        }
        return s.trim().substring(0, 1).toLowerCase(Locale.ROOT);
    }

    private static String normalize(String s) {
        if (s == null) {
            return "";
        }
        return s.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private static void requireField(MultivaluedMap<String, String> formData, List<FormMessage> errors,
                                      String field, String messageKey) {
        if (isBlank(formData.getFirst(field))) {
            errors.add(new FormMessage(field, messageKey));
        }
    }

    private static void setAttr(UserModel user, MultivaluedMap<String, String> formData, String field) {
        String v = trim(formData.getFirst(field));
        if (v != null) {
            user.setSingleAttribute(field, v);
        }
    }

    private static String trim(String s) {
        return s == null ? null : s.trim();
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    @Override
    public boolean requiresUser() {
        return false;
    }

    @Override
    public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
        return true;
    }

    @Override
    public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {
        // no-op
    }

    @Override
    public void buildPage(FormContext context, LoginFormsProvider form) {
        // no-op: this action has no visible sub-form of its own, the fields
        // it consumes are rendered by the (unmodified) register.ftl via the
        // declarative User Profile config.
    }

    @Override
    public void close() {
        // no-op
    }

    // ---------------------------------------------------------- FormActionFactory

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    @Override
    public String getDisplayType() {
        return "BFF Kickstart Registration User Creation";
    }

    @Override
    public String getReferenceCategory() {
        return null;
    }

    @Override
    public boolean isConfigurable() {
        return false;
    }

    @Override
    public Requirement[] getRequirementChoices() {
        return REQUIREMENT_CHOICES;
    }

    @Override
    public boolean isUserSetupAllowed() {
        return false;
    }

    @Override
    public List<ProviderConfigProperty> getConfigProperties() {
        return Collections.emptyList();
    }

    @Override
    public String getHelpText() {
        return "Creates the registering user with a system-generated username (lastname_fm_#) instead of a "
                + "user-chosen one, stores it as the 'gizmo_username' attribute, and enforces this app's "
                + "required registration fields.";
    }

    @Override
    public FormAction create(KeycloakSession session) {
        return this;
    }

    @Override
    public void init(Config.Scope config) {
        // no-op
    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {
        // no-op
    }
}
