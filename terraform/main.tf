# Week 4, declared.
#
# Everything here was done by hand once: a machine was created in a console, a
# firewall rule was clicked, a repo was cloned, a unit file was written. This
# file says what the result should LOOK like and lets Terraform work out the
# steps -- the same move kubectl made in week 7, one layer down.

terraform {
  required_version = ">= 1.9"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# The machine. e2-micro because it is the smallest thing that runs this, and
# the credit is not infinite.
resource "google_compute_instance" "postcard" {
  name         = "postcard-vm"
  machine_type = var.machine_type
  tags         = ["postcard"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-13"
      size  = 20
    }
  }

  network_interface {
    network = "default"
    # An empty access_config block is what asks for a public IP. Remove it and
    # the machine exists and nothing can reach it.
    access_config {}
  }

  # The startup script is the unit file, the clone and the npm install from
  # week 4 -- now run by the machine on its first boot instead of by you over
  # ssh. It is idempotent: the machine may run it more than once.
  metadata_startup_script = templatefile("${path.module}/startup.sh.tftpl", {
    admin_token = var.admin_token
    repo_url    = var.repo_url
    branch      = var.branch
  })
}

# The rule that lets you in. In week 4 this was four fields in a console; here
# it is six lines, in git, reviewable, and identical on every rebuild.
resource "google_compute_firewall" "postcard_http" {
  name    = "allow-postcard-http"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }

  # 0.0.0.0/0 is a decision, not a default -- the same sentence week 5's deck
  # uses. Narrow it to your own address and the lesson still works.
  source_ranges = var.allowed_cidrs
  target_tags   = ["postcard"]
}
