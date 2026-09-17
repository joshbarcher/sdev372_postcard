output "ip" {
  description = "The machine's public address."
  value       = google_compute_instance.postcard.network_interface[0].access_config[0].nat_ip
}

output "url" {
  description = "Open this. It may take a minute after apply returns -- the machine is still running its startup script."
  value       = "http://${google_compute_instance.postcard.network_interface[0].access_config[0].nat_ip}:8080"
}
