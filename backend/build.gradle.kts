import org.gradle.api.plugins.JavaPluginExtension 

plugins {
    id("org.springframework.boot") version "4.0.0" apply false
    id("io.spring.dependency-management") version "1.1.7" apply false
}

subprojects {
    apply(plugin = "java")
    apply(plugin = "io.spring.dependency-management")

    group = "de.codebyme"
    version = "0.0.1-SNAPSHOT"
    

    repositories {
        mavenCentral()
    }

    configure<JavaPluginExtension> {
        toolchain {
            languageVersion.set(JavaLanguageVersion.of(25))
        }
    }

    tasks.withType<Test> {
        useJUnitPlatform()
    }
}