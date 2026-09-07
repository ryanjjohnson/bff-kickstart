package com.example.bffkickstart.repository;

import com.example.bffkickstart.domain.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface FacilityRepository extends JpaRepository<Facility, Long>, JpaSpecificationExecutor<Facility> {
    boolean existsByNameIgnoreCase(String name);

    Optional<Facility> findByNameIgnoreCase(String name);
}
