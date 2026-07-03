---
title: 'Limit Resources Docker'
date: '2025-06-06'
category: 'TECH'
tags: ['docker', 'containers']
---

To limit the resources a Docker container can use, you can set resource constraints when running the container. Here are the key options you can use with `docker run`:

### **1. CPU Limits**

- **`--cpus`**: Limit the number of CPU cores available to the container.

  ```sh
  docker run --cpus=1.5 my-container
  ```

  (Allows 1.5 CPU cores)

- **`--cpu-quota` & `--cpu-period`**: Fine-grained CPU control (in microseconds).

  ```sh
  docker run --cpu-quota=50000 --cpu-period=100000 my-container
  ```

  (Allows 50% CPU usage)

- **`--cpuset-cpus`**: Restrict the container to specific CPU cores.
  ```sh
  docker run --cpuset-cpus="0,1" my-container
  ```
  (Only uses CPU cores 0 and 1)

### **2. Memory (RAM) Limits**

- **`--memory` (`-m`)**: Limit total RAM usage.

  ```sh
  docker run -m 512m my-container
  ```

  (Allows 512 MB RAM)

- **`--memory-swap`**: Limit total memory + swap usage.
  ```sh
  docker run -m 512m --memory-swap=1g my-container
  ```
  (Allows 512 MB RAM + 512 MB swap)

### **3. Disk I/O Limits**

- **`--device-read-iops` & `--device-write-iops`**: Limit disk I/O operations per second.

  ```sh
  docker run --device-read-iops=/dev/sda:100 --device-write-iops=/dev/sda:100 my-container
  ```

  (Limits to 100 I/O operations per second)

- **`--device-read-bps` & `--device-write-bps`**: Limit disk bandwidth in bytes per second.
  ```sh
  docker run --device-read-bps=/dev/sda:10mb --device-write-bps=/dev/sda:10mb my-container
  ```
  (Limits to 10 MB/s read/write)

### **4. Network Limits**

- **`--network`**: Restrict network access.

  ```sh
  docker run --network=none my-container
  ```

  (No network access)

- **`--ulimit`**: Limit system resources (e.g., open files, processes).
  ```sh
  docker run --ulimit nofile=1024:2048 my-container
  ```
  (Limits open files to 1024 soft, 2048 hard)

### **5. GPU Limits (if using NVIDIA GPUs)**

- **`--gpus`**: Limit GPU access.
  ```sh
  docker run --gpus '"device=0,1"' my-container
  ```
  (Only allows access to GPUs 0 and 1)

### **Example: Full Resource-Limited Container**

```sh
docker run \
  --cpus=2 \
  --memory=2g \
  --memory-swap=3g \
  --cpuset-cpus="0,1" \
  --device-read-iops=/dev/sda:1000 \
  --device-write-iops=/dev/sda:1000 \
  --ulimit nofile=1024:2048 \
  my-container
```

### **Using `docker-compose.yml`**

If you're using Docker Compose, you can define limits in the `deploy.resources` section:

```yaml
services:
  my-service:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### **Monitoring Usage**

To check resource usage:

```sh
docker stats
```

This ensures your container doesn't consume excessive system resources.
