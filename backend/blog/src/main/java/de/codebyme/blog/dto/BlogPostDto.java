package de.codebyme.blog.dto;
import java.time.LocalDateTime;

public record BlogPostDto(
    String title,
    String slug,
    String content,
    String[] tags,
    LocalDateTime publishedAt
) {
    
}