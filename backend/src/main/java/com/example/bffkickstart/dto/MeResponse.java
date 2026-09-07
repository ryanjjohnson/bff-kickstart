package com.example.bffkickstart.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MeResponse {
    private boolean authenticated;
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String zip;
    private String telephone;
    private boolean external;
    private List<String> roles;

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
