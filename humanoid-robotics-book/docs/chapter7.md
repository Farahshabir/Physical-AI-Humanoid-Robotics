---
sidebar_position: 7
---

# Chapter 7: Hardware Requirements & Lab Setup

This course is technically demanding, sitting at the intersection of Physics Simulation, Visual Perception, and Generative AI.

### 1. The "Digital Twin" Workstation (Required)

Standard laptops (including MacBooks and non-RTX Windows machines) will not work due to the reliance on NVIDIA's RTX capabilities for Isaac Sim.

- **GPU**: NVIDIA RTX 4070 Ti (12GB VRAM) or higher.
- **CPU**: Intel Core i7 (13th Gen+) or AMD Ryzen 9.
- **RAM**: 64 GB DDR5.
- **OS**: Ubuntu 22.04 LTS (mandatory for native ROS 2 experience).

### 2. The "Physical AI" Edge Kit

This kit allows students to deploy their code to a physical "brain" to understand real-world constraints.

- **The Brain**: NVIDIA Jetson Orin Nano (8GB) or Orin NX (16GB).
- **The Eyes**: Intel RealSense D435i or D455 (provides RGB color and Depth data).
- **The Inner Ear**: USB IMU (for balance and orientation).
- **Voice Interface**: USB Microphone array (e.g., ReSpeaker).

### 3. The Robot Lab (Actuators)

- **Option A (Recommended for Budget)**: Quadruped (dog-like) robot, such as the **Unitree Go2 Edu**. The software principles transfer effectively.
- **Option B (Miniature Humanoid)**: Small, table-top humanoids like the **Unitree G1** or **Robotis OP3**.
- **Option C (Premium)**: A full-sized, research-grade humanoid like the **Unitree G1** for true sim-to-real deployment.

### 4. Cloud-Native Lab (High OpEx Alternative)

For those without access to local high-performance workstations.

- **Cloud Workstations**: Renting GPU instances from AWS (e.g., g5.2xlarge) or Azure.
- **Latency Trap**: Controlling a physical robot from the cloud is dangerous. The workflow is: train in the cloud, download the model, and flash it to the local Jetson kit for physical execution.
