package com.example.bffkickstart.service;

import com.example.bffkickstart.dto.MailRequest;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class MailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public MailService(JavaMailSender mailSender, @Value("${app.mail.from}") String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    public void send(MailRequest request) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(request.getTo());
            helper.setSubject(request.getSubject());
            helper.setText(buildHtmlBody(request.getMessage()), true);
            helper.addInline("logo", new ClassPathResource("images/gizmo-logo.png"));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to build the email message", e);
        }
        mailSender.send(mimeMessage);
    }

    private String buildHtmlBody(String message) {
        return """
                <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto;">
                    <img src="cid:logo" alt="gizmoshop" style="height: 60px; margin-bottom: 16px;" />
                    <div style="white-space: pre-wrap; font-size: 14px; color: #1a1a1a;">%s</div>
                </div>
                """.formatted(HtmlUtils.htmlEscape(message));
    }
}
