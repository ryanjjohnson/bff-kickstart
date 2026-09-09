package com.example.bffkickstart.repositories;

import com.example.bffkickstart.models.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface FacilityRepository extends JpaRepository<Facility, Long>, JpaSpecificationExecutor<Facility> {
    boolean existsByNameIgnoreCase(String name);

    Optional<Facility> findByNameIgnoreCase(String name);
}
