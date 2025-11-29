package de.codebyme.codebyme;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import de.codebyme.shared.MyService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;

@SpringBootApplication(scanBasePackages = "de.codebyme")
public class CodebymeApplication {
    public static void main(String[] args) {
        SpringApplication.run(CodebymeApplication.class, args);
    }

    @Bean
    public CommandLineRunner commandLineRunner(MyService myService) {
        return args -> {
            System.out.println("----------------------------------------");
            System.out.println(myService.message());
            System.out.println("----------------------------------------");
        };
    }
}