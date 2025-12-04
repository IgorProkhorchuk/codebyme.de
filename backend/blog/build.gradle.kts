import org.springframework.boot.gradle.tasks.bundling.BootJar

plugins {
    id("org.springframework.boot") 
    id("java-library")
}

// Disable creation of an executable JAR (fat jar)
tasks.withType<BootJar> {
    enabled = false
}

// Enable creation of a standard library JAR
tasks.withType<Jar> {
    enabled = true
    // excclude classifier to avoid '-plain' suffix
    archiveClassifier.set("") 
}

dependencies {
    // Access Shared Utilities
    implementation(project(":shared"))

    // Feature Dependencies (No versions needed; inherited from Parent/Plugin)
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    
}