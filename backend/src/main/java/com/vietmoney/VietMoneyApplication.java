package com.vietmoney;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class VietMoneyApplication {
    public static void main(String[] args) {
        SpringApplication.run(VietMoneyApplication.class, args);
    }
}
