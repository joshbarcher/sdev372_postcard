# week 7 — onto a cluster

Same application. Same images. What changes is that nothing here says *how* to
run it — only what it should look like when it is running.

## Put it up

    kubectl create secret generic postcard \
      --from-literal=ADMIN_TOKEN=pick-one \
      --from-literal=DB_PASSWORD=pick-one \
      --from-literal=ROOT_PASSWORD=pick-one \
      --from-literal=DATABASE_URL=mysql://postcard:pick-one@db:3306/postcard

    kubectl apply -f k8s/

`k8s/examples/` is deliberately NOT applied by that command -- `apply -f` on a
directory does not recurse. The example Secret in there carries the same
metadata.name as the real one, so applying it would quietly replace the password
you chose with `s3cr3t` and nothing would error.
    kubectl get pods -w

Then find the address:

    kubectl get service postcard-web

## What changed from compose

`git diff week-6 week-7` adds four manifests and touches nothing else. Not one
line under `api/src` or `web/src`, and both Dockerfiles are untouched — the
images from week 6 are the images the cluster runs.

Three things are genuinely different, and they are the week:

**Two replicas of the API, one of the database.** Two MariaDB pods sharing one
`ReadWriteOnce` volume is data corruption, not high availability. Scaling a
database is a different subject.

**Two probes, not one.** `/health` answers "is this process wedged?" and
`/ready` answers "can it reach its database yet?". A pod is alive several
seconds before it is useful, and sending traffic into that window is exactly
where the 502s on a rolling update come from.

**One address for the outside world.** `postcard-web` is a `LoadBalancer`;
everything else is `ClusterIP`. The API is reachable from inside the cluster by
name and from nowhere else — which is the same shape as week 6, enforced by a
different thing.

## Four things to try

Kill a pod and watch it come back:

    kubectl delete pod -l app=postcard-api
    kubectl get pods -w

Scale, and see it is still one answer:

    kubectl scale deployment postcard-api --replicas=5
    kubectl get pods -l app=postcard-api

Roll out a new version and watch it happen one pod at a time:

    kubectl set image deployment/postcard-api api=sdev372/postcard-api:2
    kubectl rollout status deployment/postcard-api

Then put it back:

    kubectl rollout undo deployment/postcard-api

## The Secret is not a secret

A Kubernetes `Secret` is **base64, not encryption**. This gets it back:

    kubectl get secret postcard -o jsonpath='{.data.ADMIN_TOKEN}' | base64 -d

It keeps values out of your manifests and out of git, which is worth doing. It
does not keep them from anyone who can reach the cluster. That is why
`secret.example.yaml` is an example and the real one is made on the command
line, where it never becomes a file.
