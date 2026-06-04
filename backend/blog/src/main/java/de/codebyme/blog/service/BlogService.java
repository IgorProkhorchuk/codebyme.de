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
        return blogRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    public BlogPostDto getPostBySlug(String slug) {
        return blogRepository.findBySlug(slug)
                .map(this::mapToDto)
                .orElse(null);
    }

    private BlogPostDto mapToDto(de.codebyme.blog.model.BlogPost post) {
        String[] tags = post.getTags() != null ? post.getTags().split(",\\s*") : new String[0];
        return new BlogPostDto(
                post.getTitle(),
                post.getSlug(),
                post.getContent(),
                tags,
                post.getPublishedAt()
        );
    }

}
