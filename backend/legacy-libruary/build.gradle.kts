
java {
    toolchain {
        // OVERRIDE: This specific module will compile with Java 21
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-json")
}