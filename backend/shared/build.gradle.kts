plugins {
    id("org.springframework.boot") 
    id("io.spring.dependency-management")
}

tasks.bootJar {
    enabled = false
}

tasks.jar {
    enabled = true
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-json")
}

description = "Test modularity"