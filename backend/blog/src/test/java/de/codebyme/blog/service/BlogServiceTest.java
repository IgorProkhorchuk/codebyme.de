package de.codebyme.blog.service;

import de.codebyme.blog.dto.BlogPostDto;
import de.codebyme.blog.model.BlogPost;
import de.codebyme.blog.repository.BlogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BlogServiceTest {
    @Mock // creates fake repository
    private BlogRepository blogRepository;

    private BlogService blogService;


    @BeforeEach
    void setUp() {
        blogService = new BlogService(blogRepository);
    }

    @Test
    void shouldConvertToArray_whenFetchingPosts() {

        BlogPost rawPost = new BlogPost(
                "My Title",
                "my-slug",
                "Content",
                "Java, TDD"
        );
        when(blogRepository.findAll()).thenReturn(List.of(rawPost));

        List<BlogPostDto> result = blogService.getAllPosts();

        assertNotNull(result);

        assertEquals(2, result.get(0).tags().length);
        assertEquals("Java", result.get(0).tags()[0]);
        assertEquals("TDD", result.get(0).tags()[1]);

    }

    @Test
    void shouldReturnPostBySlug() {
        BlogPost rawPost = new BlogPost(
                "My Title",
                "my-slug",
                "Content",
                "Java"
        );
        when(blogRepository.findBySlug("my-slug")).thenReturn(java.util.Optional.of(rawPost));

        BlogPostDto result = blogService.getPostBySlug("my-slug");

        assertNotNull(result);
        assertEquals("My Title", result.title());
        assertEquals("my-slug", result.slug());
        assertEquals(1, result.tags().length);
        assertEquals("Java", result.tags()[0]);
    }

}