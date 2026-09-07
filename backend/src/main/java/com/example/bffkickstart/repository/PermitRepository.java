package com.example.bffkickstart.repository;

import com.example.bffkickstart.domain.Permit;
import com.example.bffkickstart.domain.PermitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PermitRepository extends JpaRepository<Permit, Long>, JpaSpecificationExecutor<Permit> {
    boolean existsByPermitNumberIgnoreCase(String permitNumber);

    Optional<Permit> findByPermitNumberIgnoreCase(String permitNumber);

    List<Permit> findByStatusAndExpirationDateBetween(PermitStatus status, LocalDate from, LocalDate to);
}
