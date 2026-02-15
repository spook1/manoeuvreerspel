
# GitHub Actions for deploying to Versio

This workflow will execute on every push to the main/master branch, build the project, and then use SSH to copy the files to the Versio server.

Before using this, you need to set up the following SECRETS in your GitHub repository settings:
- **HOST**: The hostname or IP of your Versio server (e.g., srv123.versio.nl)
- **USERNAME**: Your SSH username (often your DirectAdmin username)
- **SSH_PRIVATE_KEY**: Your private SSH key (generated on your machine or server)
- **REMOTE_DIR**: The full path to the directory on the server where the game should be (e.g., `/home/username/domains/jouwdomein.nl/public_html/game/`)

## Steps to Setup:
1. Generate an SSH Key pair if you don't have one: `ssh-keygen -t rsa -b 4096 -C "deploy_key"` (do not set a passphrase for CI/CD keys ideally, or manage it via ssh-agent).
2. Add the PUBLIC key (`id_rsa.pub`) to `~/.ssh/authorized_keys` on your Versio server.
3. Add the PRIVATE key (`id_rsa`) to GitHub Secrets as `SSH_PRIVATE_KEY`.

## Troubleshooting Authentication
If you experience "Permission denied" errors when pushing (`git push`), it likely means Windows is trying to use an old GitHub account stored in the Credential Manager.

To fix this for THIS repository only without affecting other projects:
1. Update the remote URL to include your username explicitly:
   `git remote set-url origin https://YOUR_USERNAME@github.com/YOUR_USERNAME/REPO.git`
2. Push again. Windows will now prompt you for the password/token for the correct account.
