package de.codebyme.blog.model;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;

@Entity
public class BlogPost {

    private String title;
    private String slug;
    private String content;
    private String tags;
    private LocalDateTime publishedAt;



    public BlogPost() {
    }

    public BlogPost(String title, String slug, String content, String tags) {
        this.title = title;
        this.slug = slug;
        this.content = content;
        this.tags = tags;
        this.publishedAt = LocalDateTime.now();
    }

    public BlogPost(String title, String slug, String content, String tags, LocalDateTime publishedAt) {
        this.title = title;
        this.slug = slug;
        this.content = content;
        this.tags = tags;
        this.publishedAt = publishedAt;
    }


    public String getTitle() {
        return title;
    }

    public String getSlug() {
        return slug;
    }

    public String getContent() {
        return content;
    }

    public String getTags() {
        return tags;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }
}