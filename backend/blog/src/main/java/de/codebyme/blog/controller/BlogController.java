package de.codebyme.blog.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;

@RestController
@RequestMapping("/api/blog")
public class BlogController {

    @GetMapping
    public String getAllPosts() throws IOException {
        InputStream inputStream = getClass().getResourceAsStream("/blogposts.json");
        if (inputStream == null) {
            throw new IOException("Resource not found: /blogposts.json");
        }
        return new String(inputStream.readAllBytes());
    }
}