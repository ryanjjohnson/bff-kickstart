package com.example.bffkickstart.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "permit")
@Getter
@Setter
@NoArgsConstructor
public class Permit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "facility_id", nullable = false)
    private Facility facility;

    @Column(name = "permit_number", nullable = false, unique = true, length = 50)
    private String permitNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "permit_type", nullable = false, length = 30)
    private PermitType permitType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PermitStatus status;

    @Column(length = 1000)
    private String description;

    @Column(name = "issued_date")
    private LocalDate issuedDate;

    @Column(name = "expiration_date")
    private LocalDate expirationDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
