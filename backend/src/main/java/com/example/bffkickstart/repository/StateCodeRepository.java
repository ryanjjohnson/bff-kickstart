package com.example.bffkickstart.repository;

import com.example.bffkickstart.domain.StateCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StateCodeRepository extends JpaRepository<StateCode, String> {
    List<StateCode> findAllByOrderByNameAsc();
}
