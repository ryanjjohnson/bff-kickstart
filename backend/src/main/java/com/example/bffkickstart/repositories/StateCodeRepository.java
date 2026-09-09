package com.example.bffkickstart.repositories;

import com.example.bffkickstart.models.StateCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StateCodeRepository extends JpaRepository<StateCode, String> {
    List<StateCode> findAllByOrderByNameAsc();
}
