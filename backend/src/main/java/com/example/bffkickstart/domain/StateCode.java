package com.example.bffkickstart.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "state_code")
@Getter
@Setter
@NoArgsConstructor
public class StateCode {

    @Id
    @Column(length = 2)
    private String code;

    @Column(nullable = false, length = 50)
    private String name;
}
