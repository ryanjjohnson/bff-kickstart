package com.example.bffkickstart.dto;

import com.example.bffkickstart.domain.StateCode;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StateCodeResponse {
    private String code;
    private String name;

    public static StateCodeResponse from(StateCode s) {
        return StateCodeResponse.builder().code(s.getCode()).name(s.getName()).build();
    }
}
