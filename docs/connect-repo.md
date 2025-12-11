# Connecting this workspace to your repository

To let me push changes directly to your repo, set up a Git remote and branch tracking. Run these commands from the project root and replace placeholders with your details:

1. Add your remote (use SSH or HTTPS):
   ```bash
   git remote add origin <your-repo-url>
   ```

2. Fetch branches so Git sees your remote refs:
   ```bash
   git fetch origin
   ```

3. Check out the target branch (create if needed):
   ```bash
   git checkout -b main origin/main    # use your branch name
   ```
   *If `main` doesn’t exist yet, drop the `origin/main` argument and push to create it.*

4. Confirm the branch is tracking the remote:
   ```bash
   git status
   git branch -vv
   ```
   You should see something like `[origin/main]` next to your branch name.

5. Share the remote name and branch with me. I’ll commit changes locally and push with:
   ```bash
   git push origin main
   ```

If your repo requires authentication, ensure the credentials or deploy key are available in this environment before running the commands above.
