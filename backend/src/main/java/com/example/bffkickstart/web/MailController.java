package com.example.bffkickstart.web;

import com.example.bffkickstart.dto.MailRequest;
import com.example.bffkickstart.service.MailService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/emails")
@PreAuthorize("hasAnyRole('Admin','Inspector','Viewer','Data Manager')")
public class MailController {

    private final MailService mailService;

    public MailController(MailService mailService) {
        this.mailService = mailService;
    }

    // POST to the collection root, not /send - the HTTP verb (POST) already says
    // "create/send," the URI just names the resource. See Application Development
    // Standards §7.2.1: "The HTTP verb describes the operation; the URI describes
    // the subject."
    @PostMapping
    public ResponseEntity<Void> send(@Valid @RequestBody MailRequest request) {
        mailService.send(request);
        return ResponseEntity.ok().build();
    }
}
