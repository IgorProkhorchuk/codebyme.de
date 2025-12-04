plugins {
    id("org.springframework.boot")
}

description = "Blog von Igor Prokhorchuk"

dependencies {

    implementation(project(":shared"))
    implementation(project(":blog"))

    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    // testImplementation("org.springframework.boot:spring-boot-starter-test")

    implementation("org.springframework.boot:spring-boot-starter-data-jpa")

    runtimeOnly("org.postgresql:postgresql")
}


fun loadEnv(): Map<String, String> {
    val envFile = file("${project.rootDir}/.env")
    val env = mutableMapOf<String, String>()
    
    if (envFile.exists()) {
        envFile.forEachLine { line ->
            // Simple parser: key=value (ignoring comments #)
            if (line.isNotBlank() && !line.startsWith("#")) {
                val parts = line.split("=", limit = 2)
                if (parts.size == 2) {
                    env[parts[0].trim()] = parts[1].trim()
                }
            }
        }
    }
    return env
}


tasks.named<org.springframework.boot.gradle.tasks.run.BootRun>("bootRun") {
    // Load .env variables and add them to the environment
    environment(loadEnv())
}


tasks.withType<Test> {
    environment(loadEnv())
}