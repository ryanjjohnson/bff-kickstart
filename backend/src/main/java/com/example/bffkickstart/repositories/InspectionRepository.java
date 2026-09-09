package com.example.bffkickstart.repositories;

import com.example.bffkickstart.models.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.List;

public interface InspectionRepository extends JpaRepository<Inspection, Long>, JpaSpecificationExecutor<Inspection> {
    List<Inspection> findAllByFacility_IdInOrderByScheduledDateDesc(Collection<Long> facilityIds);
}
