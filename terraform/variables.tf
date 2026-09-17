variable "project_id" {
  description = "The GCP project. Not a secret, but it is yours."
  type        = string
}

variable "region" {
  type    = string
  default = "us-west1"
}

variable "zone" {
  type    = string
  default = "us-west1-b"
}

variable "machine_type" {
  type    = string
  default = "e2-micro"
}

variable "repo_url" {
  type    = string
  default = "https://github.com/joshbarcher/sdev372_postcard.git"
}

variable "branch" {
  description = "Which branch the machine should run. week-4 is the hand-deployed shape."
  type        = string
  default     = "week-4"
}

variable "admin_token" {
  description = "Required to delete a postcard."
  type        = string
  sensitive   = true
}

variable "allowed_cidrs" {
  description = "Who may reach port 8080. Narrow this to your own address if you like."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
