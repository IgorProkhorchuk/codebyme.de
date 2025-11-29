plugins {
    id("org.springframework.boot")
}

description = "Blog von Igor Prokhorchuk"

dependencies {

    implementation(project(":shared"))

    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
