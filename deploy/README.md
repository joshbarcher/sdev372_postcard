# week 4 — onto a machine, by hand

The application has not changed. What is new is that something other than you
starts it, and it survives a reboot.

```bash
git clone https://github.com/joshbarcher/sdev372_postcard.git ~/postcard
cd ~/postcard/api && npm install --omit=dev

sudo cp ~/postcard/deploy/postcard.env.example /etc/postcard.env
sudo chmod 600 /etc/postcard.env
sudo nano /etc/postcard.env              # set a real ADMIN_TOKEN

sed "s/USER/$USER/g" ~/postcard/deploy/postcard.service \
  | sudo tee /etc/systemd/system/postcard.service >/dev/null
sudo systemctl daemon-reload
sudo systemctl start postcard      # run it now
sudo systemctl enable postcard     # and again after a reboot
```

Then check it, from the machine and from outside:

```bash
systemctl status postcard
curl localhost:8080/health
journalctl -u postcard -f
```

From your laptop it will **time out** until a firewall rule allows 8080. That is
not a broken deployment — it is the next lesson.

## Two things to try before you believe it

```bash
sudo systemctl kill postcard && sleep 3 && systemctl status postcard
```

It is running again. `Restart=always` did that.

```bash
curl localhost:8080/api/postcards          # send a few first
sudo reboot
curl localhost:8080/api/postcards          # empty
```

The service came back. **The postcards did not.** `/api/config` says
`"store":"memory"`, and that is week 5's problem.
