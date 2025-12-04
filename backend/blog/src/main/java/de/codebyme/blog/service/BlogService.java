package de.codebyme.blog.service;

import de.codebyme.blog.dto.BlogPostDto;
import de.codebyme.blog.repository.BlogRepository;

import java.util.List;

public class BlogService {
    private final BlogRepository blogRepository;

    public BlogService(BlogRepository blogRepository) {
        this.blogRepository = blogRepository;
    }

    public List<BlogPostDto> getAllPosts() {
        return null;
    }

    public BlogPostDto getPostBySlug(String slug) {
        return null;
    }

}
