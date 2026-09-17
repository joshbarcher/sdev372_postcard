# week 10 — the whole thing, declared

Week 4 took a morning: create a machine in a console, click a firewall rule,
ssh in, clone, `npm install`, write a unit file, start it.

This is that morning, as a file.

## Run it

    cd terraform
    cp terraform.tfvars.example terraform.tfvars   # then edit it
    terraform init
    terraform plan
    terraform apply

`terraform output url` prints the address. Give it a minute after apply returns
— apply finishes when the machine exists, not when its startup script does.

And when you are done, the part that matters:

    terraform destroy

## Read the plan before you apply it

`terraform plan` is the thing that has no equivalent in weeks 4 through 7. It
tells you what *would* change before anything does:

    Plan: 2 to add, 0 to change, 0 to destroy.

Run `apply` twice and the second says `No changes`. That is the difference
between a script and a description: a script does the steps again, a
description notices there is nothing to do.

Change `machine_type` to `e2-small` and plan again. It will tell you the machine
must be **destroyed and recreated** — some fields can be updated in place and
some cannot, and plan is where you find out rather than halfway through.

## What is actually in here

| file | |
|---|---|
| `main.tf` | the machine and the firewall rule |
| `variables.tf` | everything that differs between two people running this |
| `outputs.tf` | the address, so you do not go hunting in a console |
| `startup.sh.tftpl` | week 4's clone, unit file and `/etc/postcard.env`, run by the machine on first boot |

The startup script is **idempotent on purpose**. A machine may run it more than
once, and a startup script that only works the first time is a machine you
cannot rebuild — which defeats the point of having described it at all.

## The secret is still a secret

`admin_token` is marked `sensitive`, so Terraform will not print it in plan
output. **It is still in `terraform.tfstate` in plain text.** State is not a safe
place for secrets, it is just a place they end up; `terraform.tfvars` and every
`.tfstate` are gitignored for that reason.

Real projects put state in a remote backend with encryption and locking. That is
the next thing you would learn, and it is out of scope here.

## What this deliberately does not do

It stands up **week 4's shape** — one VM running the app under systemd — not the
cluster from week 7. Terraform can absolutely provision GKE, and that is the
obvious next step if you want one.

Starting here is on purpose: you already know exactly what this machine should
look like, because you built it by hand in week 4. That makes the file readable
rather than magic, which is the only way to learn what it is doing.
