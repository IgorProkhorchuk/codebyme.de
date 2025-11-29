package de.codebyme.shared;

import org.springframework.stereotype.Service;

@Service
public class MyService {
    public String message() {
        return "Hello from the Shared Module running on Java 25!";
    }
}