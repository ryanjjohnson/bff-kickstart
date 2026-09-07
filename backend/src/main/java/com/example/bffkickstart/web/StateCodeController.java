package com.example.bffkickstart.web;

import com.example.bffkickstart.dto.StateCodeResponse;
import com.example.bffkickstart.repository.StateCodeRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Reference data backing the state-code suggestions on facility forms - not a managed resource. */
@RestController
@RequestMapping("/api/v1/state-codes")
@PreAuthorize("hasAnyRole('Admin','Inspector','Viewer','Data Manager')")
public class StateCodeController {

    private final StateCodeRepository stateCodeRepository;

    public StateCodeController(StateCodeRepository stateCodeRepository) {
        this.stateCodeRepository = stateCodeRepository;
    }

    @GetMapping
    public List<StateCodeResponse> list() {
        return stateCodeRepository.findAllByOrderByNameAsc().stream().map(StateCodeResponse::from).toList();
    }
}
