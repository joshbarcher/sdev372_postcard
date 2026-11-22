output "ip" {
  description = "The machine's public address."
  value       = google_compute_instance.postcard.network_interface[0].access_config[0].nat_ip
}

output "url" {
  description = "Open this. The app answers only once the startup script finishes: about 15 minutes after apply on an e2-micro."
  value       = "http://${google_compute_instance.postcard.network_interface[0].access_config[0].nat_ip}:8080"
}
